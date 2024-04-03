import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonConfigService } from './common.config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CommonConfigService],
  exports: [CommonConfigService],
})
export class CommonConfigModule {}
