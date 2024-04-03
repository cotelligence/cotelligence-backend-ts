import { Module } from '@nestjs/common';

import { HeliusService } from '../helius/helius.service';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';

@Module({
  imports: [],
  controllers: [NftController],
  providers: [NftService, HeliusService],
  exports: [NftService],
})
export class NftModule {}
