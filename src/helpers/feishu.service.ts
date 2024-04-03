import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { CommonConfigService } from '../config/common.config.service';
import { formatError } from '../utils/logging';

@Injectable()
export class FeishuService {
  private logger = new Logger(FeishuService.name);
  private readonly feishuBaseUrl =
    'https://open.feishu.cn/open-apis/bot/v2/hook/';
  private readonly botId: string;
  private active = true;

  constructor(private configService: CommonConfigService) {
    this.logger.log('FeishuService initialized!');
    this.botId = this.configService.feishuBotId;
    if (this.botId.length === 0) {
      this.logger.warn('feishu bot id not set, feishu service disabled.');
      this.active = false;
    }
  }

  async feishuMessage(message: string): Promise<void> {
    if (this.botId.length === 0) return;
    this.logger.log(`Feishu Message: ${message}`);
    try {
      if (this.active) {
        const res = await axios
          .post<{ StatusCode: number; StatusMessage: string }>(
            this.feishuBaseUrl + this.botId,
            {
              content: { text: message },
              msg_type: 'text',
            }
          )
          .then((r) => r.data);
        if (res.StatusCode !== 0) {
          this.logger.error(
            `feishu bot message sent failed: [${res.StatusMessage}]\n${message}`
          );
        }
      }
    } catch (e) {
      this.logger.error(
        `feishu message not sent:\n${message}, ${formatError(e)}`
      );
    }
  }
}
