import { Global, Module } from '@nestjs/common';

import { FeishuService } from './feishu.service';
import { OnChainService } from './on-chain.service';

@Global()
@Module({
  providers: [FeishuService, OnChainService],
  exports: [FeishuService, OnChainService],
})
export class HelperModule {}
