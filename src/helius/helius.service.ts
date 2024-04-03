import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { CommonConfigService } from '../config/common.config.service';
import { FeishuService } from '../helpers/feishu.service';
import { MintTransfer } from '../helpers/on-chain.types';
import { PrismaService } from '../prisma/prisma.service';
import { genMintTransferMsg } from '../utils/msg';
import {
  Asset,
  HeliusUpdate,
  HeliusWebhook,
  WebhookEvent,
} from './helius.types';

@Injectable()
export class HeliusService {
  private logger = new Logger(HeliusService.name);

  constructor(
    private configService: CommonConfigService,
    private prismaService: PrismaService,
    private feishuService: FeishuService
  ) {}

  getWebhookById(id: string): Promise<HeliusWebhook> {
    const url = `${this.configService.heliusApiBaseUrl}/v0/webhooks/${id}?api-key=${this.configService.heliusApiKey}`;
    return axios.get<HeliusWebhook>(url).then((res) => res.data);
  }

  async editWebhookById(id: string, update: HeliusUpdate): Promise<void> {
    const url = `${this.configService.heliusApiBaseUrl}/v0/webhooks/${id}?api-key=${this.configService.heliusApiKey}`;
    // if sol_mainnet use webhookType enhanced, else use enhancedDevnet
    const webhookType = this.configService.isMainnet
      ? 'enhanced'
      : 'enhancedDevnet';
    const params = {
      transactionTypes: update.transactionTypes,
      accountAddresses: update.accountAddresses,
      webhookType: webhookType,
      webhookURL: update.webhookURL,
    };

    await axios.put(url, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  searchAssets(
    collection: string,
    owner?: string,
    limit?: number
  ): Promise<Asset[]> {
    const url = `${this.configService.heliusRpcBaseUrl}/?api-key=${this.configService.heliusApiKey}`;
    return axios
      .post<{
        result: {
          total: number;
          limit: number;
          page: number;
          items: Asset[];
        };
      }>(
        url,
        {
          jsonrpc: '2.0',
          method: 'searchAssets',
          id: Math.random().toString(36).substring(7),
          params: {
            ownerAddress: owner,
            grouping: ['collection', collection],
            page: 1,
            limit: limit ?? 1000,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((res) => res.data.result.items);
  }

  async appendAddressesToWebhook(
    id: string,
    newAccountAddresses: string[]
  ): Promise<void> {
    const webhook = await this.getWebhookById(id);
    const accountAddresses = [
      ...new Set(webhook.accountAddresses.concat(newAccountAddresses)),
    ];
    if (accountAddresses.length > 100_000) {
      this.logger.warn('account addresses exceed 100k, truncating ...');
      accountAddresses.splice(0, accountAddresses.length - 100_000);
      await this.feishuService.feishuMessage(
        'helius webhook account addresses exceed 100k'
      );
    }
    const heliusUpdate: HeliusUpdate = {
      webhookURL: webhook.webhookURL,
      transactionTypes: webhook.transactionTypes,
      accountAddresses,
    };
    return this.editWebhookById(id, heliusUpdate);
  }

  async processWebhookEvents(events: WebhookEvent[]): Promise<MintTransfer[]> {
    const transfers: MintTransfer[] = events
      .map((event) => parseTransfer(event))
      .flat();
    this.logger.log(
      `found ${transfers.length} mint transfers by webhook, saving to db ...`
    );
    // get gpu_mint records
    const gpuMints = await this.prismaService.gpuMint.findMany({
      select: { mint: true },
    });
    // filter transfers of gpu mints
    const mintTransfers = transfers.filter((mintTransfer) =>
      gpuMints.some((gpuMint) => gpuMint.mint === mintTransfer.mint)
    );
    if (mintTransfers.length === 0) {
      this.logger.log('no mint transfers found');
      return [];
    }
    try {
      // insert transfers to mint_transfer table
      await this.prismaService.mintTransfer.createMany({
        data: mintTransfers,
        skipDuplicates: true,
      });
    } catch (e) {
      this.logger.error(`Failed to save mint transfers to db: ${e}`);
    }
    // send feishu message
    const message = mintTransfers
      .map((transfer) =>
        genMintTransferMsg(transfer, this.configService.isMainnet)
      )
      .join('\n');
    await this.feishuService.feishuMessage(message);
    return mintTransfers;
  }
}

const parseTransfer = (event: WebhookEvent): MintTransfer[] => {
  return event.tokenTransfers.map((transfer) => ({
    mint: transfer.mint,
    sig: event.signature,
    fromAddr: transfer.fromUserAccount,
    toAddr: transfer.toUserAccount,
    slot: event.slot,
  }));
};
