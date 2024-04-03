import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  signerIdentity,
  Umi,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Injectable, Logger } from '@nestjs/common';
import {
  ConfirmedSignatureInfo,
  Connection,
  Finality,
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';

import { CommonConfigService } from '../config/common.config.service';
import { MintTransfer } from './on-chain.types';

@Injectable()
export class OnChainService {
  private _connection: Connection;

  constructor(private configService: CommonConfigService) {
    this.logger.log(
      `OnChainService initialized with [${
        this.configService.isMainnet ? 'mainnet' : 'devnet'
      }]!`
    );
    this._connection = new Connection(configService.solRpcUrl);
  }

  private readonly logger = new Logger(OnChainService.name);

  get connection(): Connection {
    return this._connection;
  }

  get umiInstance(): Umi {
    const umi = createUmi(this.configService.solRpcUrl).use(mplTokenMetadata());
    const secretKey = bs58.decode(this.configService.solanaPrivateKey);
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const authoritySigner = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(authoritySigner));
    return umi;
  }

  getSignaturesForAddress(
    address: string,
    limit?: number,
    startSig?: string,
    commitment: Finality = 'finalized'
  ): Promise<Array<ConfirmedSignatureInfo>> {
    return this.connection.getSignaturesForAddress(
      new PublicKey(address),
      {
        limit,
        until: startSig,
      },
      commitment
    );
  }

  getParsedTx(
    sig: string,
    commitment: Finality = 'finalized'
  ): Promise<ParsedTransactionWithMeta | null> {
    return this.connection.getParsedTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment,
    });
  }

  getMintTransfersFromSig(
    sig: string,
    commitment: Finality = 'finalized'
  ): Promise<MintTransfer[]> {
    return this.getParsedTx(sig, commitment).then((parsedTx) => {
      if (!parsedTx) return [];
      return extractTransferFromBalances(parsedTx);
    });
  }

  async getFirstTransfer(
    mint: string,
    commitment?: Finality
  ): Promise<MintTransfer | undefined> {
    const sigs = await this.getSignaturesForAddress(
      mint,
      1000,
      undefined,
      commitment
    );
    const firstSig = sigs[sigs.length - 1];
    return this.getParsedTx(firstSig.signature, commitment).then((parsedTx) => {
      if (!parsedTx) return undefined;
      const mintTransfers = extractTransferFromBalances(parsedTx);
      return mintTransfers[0];
    });
  }

  getLatestTransfers(
    mint: string,
    limit: number,
    maxSigs?: number,
    startSig?: string,
    commitment?: Finality
  ): Promise<MintTransfer[]> {
    return this.getSignaturesForAddress(
      mint,
      maxSigs ?? 1000,
      startSig,
      commitment
    ).then((signatures) =>
      Promise.all(
        signatures.map((sig) =>
          this.getParsedTx(sig.signature, commitment).then((parsedTx) => {
            if (!parsedTx) return [];
            return extractTransferFromBalances(parsedTx);
          })
        )
      ).then((mintTransfers) => mintTransfers.flat().slice(0, limit))
    );
  }
}

export const extractTransferFromBalances = (
  parsedTx: ParsedTransactionWithMeta
): MintTransfer[] => {
  const mintTransfers: MintTransfer[] = [];
  // Check if the transaction has preTokenBalances and postTokenBalances
  if (!parsedTx.meta?.preTokenBalances || !parsedTx.meta?.postTokenBalances) {
    return [];
  }
  // find mint with decimal 0, which is the SPL token mint
  const mints = new Set(
    parsedTx.meta.postTokenBalances
      .filter((balance) => balance.uiTokenAmount.decimals === 0)
      .map((x) => x.mint)
  );
  // find from and to address for each mint
  for (const mint of mints) {
    const preBalance = parsedTx.meta.preTokenBalances.find(
      (balance) => balance.mint === mint && balance.uiTokenAmount.uiAmount === 1
    );
    const postBalance = parsedTx.meta.postTokenBalances.find(
      (balance) => balance.mint === mint && balance.uiTokenAmount.uiAmount === 1
    );
    if (!postBalance || !postBalance.owner) {
      continue;
    }
    mintTransfers.push({
      mint: mint,
      fromAddr: preBalance?.owner ?? '',
      toAddr: postBalance.owner,
      sig: parsedTx.transaction.signatures[0],
      slot: parsedTx.slot,
    });
  }
  return mintTransfers;
};
