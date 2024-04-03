import {
  createNft,
  fetchMetadataFromSeeds,
  TokenStandard,
  transferV1,
  updateV1,
} from '@metaplex-foundation/mpl-token-metadata';
import { transferSol } from '@metaplex-foundation/mpl-toolbox';
import {
  createNoopSigner,
  generateSigner,
  percentAmount,
  publicKey,
  sol,
  transactionBuilder,
  Umi,
} from '@metaplex-foundation/umi';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BondMint, GpuSource } from '@prisma/client';
import bs58 from 'bs58';

import { CommonConfigService } from '../config/common.config.service';
import { HeliusService } from '../helius/helius.service';
import { FeishuService } from '../helpers/feishu.service';
import { OnChainService } from '../helpers/on-chain.service';
import { MintTransfer } from '../helpers/on-chain.types';
import { PrismaService } from '../prisma/prisma.service';
import { genMintMsg, genMintTransferMsg } from '../utils/msg';
import {
  MintAndBondTransaction,
  MintNftTransaction,
  UserBonds,
} from './nft.types';

@Injectable()
export class NftService implements OnModuleInit {
  private readonly umi: Umi;
  private logger = new Logger(NftService.name);

  constructor(
    private prismaService: PrismaService,
    private configService: CommonConfigService,
    private heliusService: HeliusService,
    private onChainService: OnChainService,
    private feishuService: FeishuService
  ) {
    this.umi = this.onChainService.umiInstance;
    this.logger.log('NftService initialized');
  }

  async onModuleInit(): Promise<void> {
    await this.monitorMints();
  }

  async getMintAndBondTransaction(
    owner: string
  ): Promise<MintAndBondTransaction> {
    const gpuMint = generateSigner(this.umi);
    const bondMint = generateSigner(this.umi);

    const nftPrice = sol(0.1);
    const nftMinterNoopSigner = createNoopSigner(publicKey(owner));
    const gpuCollectionMint = publicKey(this.configService.gpuNftCollection);
    const bondCollectionMint = publicKey(this.configService.bondNftCollection);

    const builder = transactionBuilder()
      .add(
        transferSol(this.umi, {
          source: nftMinterNoopSigner,
          destination: this.umi.identity.publicKey,
          amount: nftPrice,
        })
      )
      .add(
        createNft(this.umi, {
          mint: gpuMint,
          authority: this.umi.identity,
          name: 'CP-NFT',
          uri: this.configService.gpuMetadataUri,
          payer: nftMinterNoopSigner,
          sellerFeeBasisPoints: percentAmount(10),
          collection: { verified: false, key: gpuCollectionMint },
          tokenOwner: this.umi.identity.publicKey,
        })
      )
      .add(
        // create bond nft to user
        // TODO: bond should not be transferable
        createNft(this.umi, {
          mint: bondMint,
          authority: this.umi.identity,
          name: 'CP-Bond',
          uri: this.configService.bondMetadataUri,
          payer: nftMinterNoopSigner,
          sellerFeeBasisPoints: percentAmount(10),
          collection: { verified: false, key: bondCollectionMint },
          tokenOwner: publicKey(owner),
        })
      );
    const backendTx = await builder.buildAndSign(this.umi);
    const serializedTx = this.umi.transactions.serialize(backendTx);
    return {
      serializedTx: bs58.encode(serializedTx),
      gpuMint: gpuMint.publicKey,
      bondMint: bondMint.publicKey,
    };
  }

  async getMintNftTransaction(
    owner: string,
    gpuSource: GpuSource
  ): Promise<MintNftTransaction> {
    const mint = generateSigner(this.umi);
    const nftPrice = sol(0.1);
    const nftMinterNoopSigner = createNoopSigner(publicKey(owner));
    const collectionMint = publicKey(this.configService.gpuNftCollection);
    const builder = transactionBuilder()
      .add(
        transferSol(this.umi, {
          source: nftMinterNoopSigner,
          destination: this.umi.identity.publicKey,
          amount: nftPrice,
        })
      )
      .add(
        createNft(this.umi, {
          mint,
          authority: this.umi.identity,
          name: 'CP-NFT',
          uri: this.configService.gpuMetadataUri,
          payer: nftMinterNoopSigner,
          sellerFeeBasisPoints: percentAmount(10),
          collection: { verified: false, key: collectionMint },
          tokenOwner: nftMinterNoopSigner.publicKey,
        })
      );
    const backendTx = await builder.buildAndSign(this.umi);
    const serializedTx = this.umi.transactions.serialize(backendTx);
    await this.prismaService.gpuMint.create({
      data: {
        mint: mint.publicKey,
        owner,
        gpuSource,
      },
    });
    // add new mint to helius webhook
    this.logger.log(`Adding mint ${mint.publicKey} to helius webhook ...`);
    await this.heliusService.appendAddressesToWebhook(
      this.configService.heliusWebhookId,
      [mint.publicKey]
    );
    return { serializedTx: bs58.encode(serializedTx), mint: mint.publicKey };
  }

  async getUserBonds(user: string): Promise<UserBonds[]> {
    const bonds = await this.prismaService.bondMint.findMany({
      where: {
        owner: user,
      },
    });
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const rewardPerSecond = 225_000 / oneMonth;
    return bonds.map((bondRes) => {
      const now = new Date().getTime();
      let duration = now - bondRes.createdAt.getTime();
      const expired = duration >= oneMonth;
      duration = expired ? oneMonth : duration;
      // duration = Math.floor(duration / 1000);
      const expireTime = bondRes.createdAt.getTime() + oneMonth;
      return {
        owner: user,
        mint: bondRes.mint,
        createdAt: bondRes.createdAt.getTime(),
        rewards: Math.floor(duration / 1000) * rewardPerSecond,
        expired,
        expireTime,
      };
    });
  }

  async getBondingTransaction(
    user: string,
    gpuNftMint: string
  ): Promise<MintNftTransaction> {
    const bondMint = generateSigner(this.umi);
    const userSigner = createNoopSigner(publicKey(user));
    const collectionMint = publicKey(this.configService.bondNftCollection);
    const builder = transactionBuilder()
      .add(
        // transfer gpu nft to us
        transferV1(this.umi, {
          mint: publicKey(gpuNftMint),
          authority: userSigner,
          tokenOwner: publicKey(user),
          destinationOwner: this.umi.identity.publicKey,
          tokenStandard: TokenStandard.NonFungible,
        })
      )
      .add(
        // create bond nft to user
        // TODO: bond should not be transferable
        createNft(this.umi, {
          mint: bondMint,
          authority: this.umi.identity,
          name: 'CP-Bond',
          uri: this.configService.bondMetadataUri,
          payer: userSigner,
          sellerFeeBasisPoints: percentAmount(10),
          collection: { verified: false, key: collectionMint },
          tokenOwner: userSigner.publicKey,
        })
      );
    const backendTx = await builder.buildAndSign(this.umi);
    const serializedTx = this.umi.transactions.serialize(backendTx);
    return {
      serializedTx: bs58.encode(serializedTx),
      mint: bondMint.publicKey,
    };
  }

  async bondingSuccess(mint: string, owner: string): Promise<BondMint> {
    return this.prismaService.bondMint.create({
      data: {
        mint: mint,
        owner,
      },
    });
  }

  // monitor mint status every 120s
  async monitorMints(): Promise<void> {
    setTimeout(async () => {
      try {
        // select all mints that are not minted yet
        const gpuMints = await this.prismaService.gpuMint.findMany({
          where: {
            minted: false,
          },
        });
        for (const gpuMint of gpuMints) {
          const mintTransfer = await this.onChainService.getFirstTransfer(
            gpuMint.mint
          );
          if (!mintTransfer) {
            continue;
          }
          await this.verifyMint(mintTransfer);
        }
      } catch (e) {
        this.logger.error(`Failed to monitor mints: ${e}`);
      } finally {
        await this.monitorMints();
      }
    }, 120_000);
  }

  async verifyMintBySig(sig: string): Promise<void> {
    const mintTransfers = await this.onChainService.getMintTransfersFromSig(
      sig,
      'confirmed'
    );
    if (mintTransfers.length === 0) {
      return;
    }
    const firstMint = mintTransfers[0];
    // assert mint in gpu_mint
    await this.prismaService.gpuMint.findFirstOrThrow({
      where: {
        mint: firstMint.mint,
      },
    });
    await this.verifyMint(firstMint);
  }

  async verifyMint(firstMint: MintTransfer): Promise<void> {
    try {
      // update gpu_mint record
      await this.prismaService.gpuMint.update({
        where: {
          mint: firstMint.mint,
        },
        data: {
          minted: true,
        },
      });
      // insert mint_transfer record
      await this.prismaService.mintTransfer.createMany({
        data: [{ ...firstMint, sshPubkeyUpdated: true }],
        skipDuplicates: true,
      });
      // insert runpod_mint record
      await this.prismaService.runpodMint.createMany({
        data: [
          {
            mint: firstMint.mint,
            sig: firstMint.sig,
          },
        ],
        skipDuplicates: true,
      });
      await this.feishuService.feishuMessage(
        genMintMsg(firstMint, this.configService.isMainnet)
      );
    } catch (e) {
      this.logger.error(`Failed to verify mint ${firstMint.mint}: ${e}`);
    }
  }

  async updateTokenMetadata(mint: string): Promise<void> {
    const mintPubKey = publicKey(mint);
    const initialMetadata = await fetchMetadataFromSeeds(this.umi, {
      mint: mintPubKey,
    });
    await updateV1(this.umi, {
      mint: mintPubKey,
      authority: this.umi.identity,
      data: { ...initialMetadata },
    }).sendAndConfirm(this.umi);
  }

  async refreshTokenTransfer(mint: string, limit: number): Promise<void> {
    const transfers = await this.onChainService.getLatestTransfers(
      mint,
      limit,
      limit
    );
    if (transfers.length === 0) {
      return;
    }
    // filter gpu_mints
    const gpuMints = await this.prismaService.gpuMint.findMany({
      select: { mint: true },
    });
    const mintTransfers = transfers.filter((transfer) =>
      gpuMints.some((gpuMint) => gpuMint.mint === transfer.mint)
    );
    const { count } = await this.prismaService.mintTransfer.createMany({
      data: mintTransfers,
      skipDuplicates: true,
    });
    if (count > 0) {
      await this.feishuService.feishuMessage(
        mintTransfers
          .map((transfer) =>
            genMintTransferMsg(transfer, this.configService.isMainnet)
          )
          .join('\n')
      );
    }
  }
}
