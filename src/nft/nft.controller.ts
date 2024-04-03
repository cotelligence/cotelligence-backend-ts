import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { BondMint, GpuSource } from '@prisma/client';

import { NftService } from './nft.service';
import {
  BondingSuccess,
  MintAndBondTransaction,
  MintNftTransaction,
  UserBonds,
} from './nft.types';

@Controller('nft')
export class NftController {
  constructor(private nftService: NftService) {}

  @Get('/mint-transaction/:owner')
  async getMintNftTransaction(
    @Param('owner') owner: string,
    @Query('gpuSource') gpuSource: GpuSource
  ): Promise<MintNftTransaction> {
    return this.nftService.getMintNftTransaction(owner, gpuSource);
  }

  @Get('/bonding-transaction/:owner')
  async getBondingTransaction(
    @Param('owner') owner: string,
    @Query('gpuNftMint') gpuNftMint: string
  ): Promise<MintNftTransaction> {
    return this.nftService.getBondingTransaction(owner, gpuNftMint);
  }

  @Get('/mint-and-bond/:owner')
  async getMintAndBondTransaction(
    @Param('owner') owner: string
  ): Promise<MintAndBondTransaction> {
    return this.nftService.getMintAndBondTransaction(owner);
  }

  @Post('/bonding-transaction-success')
  async postBondingSuccess(
    @Body() bondingSuccess: BondingSuccess
  ): Promise<BondMint> {
    return this.nftService.bondingSuccess(
      bondingSuccess.mint,
      bondingSuccess.owner
    );
  }

  @Get('/bonds/:owner')
  async getUserBonds(@Param('owner') owner: string): Promise<UserBonds[]> {
    return this.nftService.getUserBonds(owner);
  }

  @Put('/mint-success/:sig')
  async mintSuccess(@Param('sig') sig: string): Promise<void> {
    return this.nftService.verifyMintBySig(sig);
  }

  @Put('/mint-transfers/:mint/refresh')
  async refreshMintTransfers(
    @Param('mint') mint: string,
    @Query('limit') limit = 5
  ): Promise<void> {
    return this.nftService.refreshTokenTransfer(mint, limit);
  }
}
