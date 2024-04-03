import { setupConfigService } from '../__tests__/utils.spec';
import { FeishuService } from '../helpers/feishu.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeliusService } from './helius.service';

describe('heliusService', () => {
  const configService = setupConfigService();
  const prismaService = new PrismaService();
  const feishuService = new FeishuService(configService);
  const heliusService = new HeliusService(
    configService,
    prismaService,
    feishuService
  );

  it('should edit webhook by id', async () => {
    await heliusService.editWebhookById(configService.heliusWebhookId, {
      transactionTypes: ['Any'],
      accountAddresses: ['Bjex8K2YSg55KDSw2xEBKc2zzo6Zcs93CGRk3GpVFvqk'],
      webhookURL: 'https://test.cotelligence.com',
    });
    // sleep for 5 seconds to avoid rate limit
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const webhook = await heliusService.getWebhookById(
      configService.heliusWebhookId
    );
    expect(webhook.accountAddresses[0]).toBe(
      'Bjex8K2YSg55KDSw2xEBKc2zzo6Zcs93CGRk3GpVFvqk'
    );
    expect(webhook.webhookURL).toBe('https://test.cotelligence.com');
  });

  it('should search assets', async () => {
    try {
      const assets = await heliusService.searchAssets(
        'HLoCcPkpZFoHqXrqGFn1uYoSLPmtpSG8YCxqJP7ihtxw',
        '8CmJ6Xm2iAXW85z6r4LUEmjWcb2bS8MHmuSh3TM9KQNa',
        1
      );
      console.log(JSON.stringify(assets, null, 2));
      expect(assets.length).toBe(1);
    } catch (e) {
      console.log(JSON.stringify(e, null, 2));
    }
  });
});
