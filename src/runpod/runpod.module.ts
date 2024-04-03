import { Module } from '@nestjs/common';

import { RunpodController } from './runpod.controller';
import { RunpodService } from './runpod.service';

@Module({
  imports: [],
  controllers: [RunpodController],
  providers: [RunpodService],
})
export class RunpodModule {}
