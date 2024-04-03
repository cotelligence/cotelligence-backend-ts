import { setupConfigService } from '../__tests__/utils.spec';
import { HeliusService } from '../helius/helius.service';
import { FeishuService } from '../helpers/feishu.service';
import { OnChainService } from '../helpers/on-chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { NftService } from './nft.service';

describe('NftService', () => {
  const configService = setupConfigService();
  const prismaService = new PrismaService();
  const feishuService = new FeishuService(configService);
  const heliusService = new HeliusService(
    configService,
    prismaService,
    feishuService
  );
  const onChainService = new OnChainService(configService);
  const nftService = new NftService(
    prismaService,
    configService,
    heliusService,
    onChainService,
    feishuService
  );
  const MINT = 'HhK829D67XmgAw29toGLfZXsvyNYzGd3MuPxCr5TdzU';
  it('should update metadata', async () => {
    await nftService.updateTokenMetadata(MINT);
  });

  it('should refresh mint transfers', async () => {
    await prismaService.gpuMint.create({
      data: {
        mint: MINT,
        gpuSource: 'Runpod',
        owner: 'test',
      },
    });
    await nftService.refreshTokenTransfer(MINT, 5);
  });
});
