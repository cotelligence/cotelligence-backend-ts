import { Body, Controller, Post } from '@nestjs/common';

import { MintTransfer } from '../helpers/on-chain.types';
import { HeliusService } from './helius.service';
import { WebhookEvent } from './helius.types';

@Controller('helius')
export class HeliusController {
  constructor(private heliusService: HeliusService) {}

  @Post('webhook')
  async heliusWebhookIncomingEvents(
    @Body() data: WebhookEvent[]
  ): Promise<MintTransfer[]> {
    return this.heliusService.processWebhookEvents(data);
  }
}
