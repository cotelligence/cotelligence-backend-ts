import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';

import { MintOwner } from '../nft/nft.types';
import { signerVerifyMsg } from '../utils/verifier';
import { RunpodService } from './runpod.service';
import { RunpodMintInfo, StartPodPayload } from './runpod.type';

@Controller('runpod')
export class RunpodController {
  constructor(private runpodService: RunpodService) {}

  @Get('/token-assets/:owner')
  getUserTokenInfo(@Param('owner') owner: string): Promise<RunpodMintInfo[]> {
    return this.runpodService.runpodMintInfoList(owner);
  }

  @Get('/owners')
  async getMintOwners(@Query('owner') owner: string): Promise<MintOwner[]> {
    return this.runpodService.getMintOwners(owner);
  }

  @Get('/start-msg/:mint')
  async runpodStartMsg(@Param('mint') mint: string): Promise<{ data: string }> {
    return { data: genStartMsg(mint) };
  }

  @Put('/start')
  async startRunpod(
    @Body() data: StartPodPayload
  ): Promise<RunpodMintInfo | undefined> {
    const msg = genStartMsg(data.mint);
    // verify signature
    if (!signerVerifyMsg(data.signer, msg, data.sig)) {
      throw new Error('Invalid Signature');
    }
    return this.runpodService.startRunpod(data.mint, data.signer);
  }
}

const genStartMsg = (mint: string): string => {
  return `Start Runpod With Mint: ${mint}`;
};
