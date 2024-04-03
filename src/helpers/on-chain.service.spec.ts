import { setupConfigService } from '../__tests__/utils.spec';
import {
  extractTransferFromBalances,
  OnChainService,
} from './on-chain.service';

describe('OnChainService', () => {
  const configService = setupConfigService();
  const onChainService: OnChainService = new OnChainService(configService);

  it('should get signatures for address', async () => {
    const mint = 'Bsmwy193vE4JxxD5pRifP2CUSeVqaZzxY6D5s5FJy1Mn';
    const limit = 3;
    const sigs = await onChainService.getSignaturesForAddress(mint, limit);
    console.log(sigs);
    expect(sigs.length).toBe(limit);
  });

  it('should get parsed tx', async () => {
    const sig =
      '61CJJj4yv3k9xxHbMympiUp66ZPjMervTUArwbDoAnNVVmxQb9bgALXQXtcdLwnXNXeGcajh3dqLbtWtcNQrCF1i';
    const parsedTx = await onChainService.getParsedTx(sig);
    console.log(JSON.stringify(parsedTx, null, 2));
    expect(parsedTx).toBeDefined();
    if (parsedTx) {
      const mintTransfers = extractTransferFromBalances(parsedTx);
      console.log(mintTransfers);
      expect(mintTransfers.length).toBe(1);
      expect(
        mintTransfers[0].fromAddr ===
          'Bjex8K2YSg55KDSw2xEBKc2zzo6Zcs93CGRk3GpVFvqk'
      );
      expect(
        mintTransfers[0].toAddr ===
          '8CmJ6Xm2iAXW85z6r4LUEmjWcb2bS8MHmuSh3TM9KQNa'
      );
      expect(
        mintTransfers[0].mint === 'Bsmwy193vE4JxxD5pRifP2CUSeVqaZzxY6D5s5FJy1Mn'
      );
      expect(mintTransfers[0].sig === sig);
    }
  });

  it('should get latest mint transfers', async () => {
    const mint = 'Bsmwy193vE4JxxD5pRifP2CUSeVqaZzxY6D5s5FJy1Mn';
    const transfers = await onChainService.getLatestTransfers(mint, 3);
    console.log(transfers);
    expect(transfers.length).toBe(3);
    const transfers2 = await onChainService.getLatestTransfers(
      mint,
      3,
      1000,
      'LV9rBh6XvTWPK3PaacewGPZT4WUoQzkdsCW7R4MmxtbkgaDe9Kn3UDC4yGHkqXs4TCBvbxdTjFVuNDxufDmKPFs'
    );
    console.log(transfers2);
    expect(transfers2.length).toBe(2);
  });

  it('should get first mint', async () => {
    const mint = '9pHXaWHFnZcJGDZTXurjJ9NCEyswTycPbj3gJ6QiVfNo';
    const transfer = await onChainService.getFirstTransfer(mint);
    expect(transfer?.fromAddr).toBe('');
  });

  it('should get mint transfers from sig', async () => {
    const transfers = await onChainService.getMintTransfersFromSig(
      '32VUSsVnDgcMSG5JmhKNX69ssQB5vBhvViVQJK5DFyjLHKNr9TY6fZek2B1M69nHQaEturkirpnCSmApqMBB8GDv'
    );
    console.log(transfers);
    expect(
      transfers[0].mint === '33XH8koTvJ1JeiapTSZQ8j9oA9n25xnZxgvZr7UzYs3J'
    );
  });

  it('should get first mint transfer', async () => {
    const mint = '33XH8koTvJ1JeiapTSZQ8j9oA9n25xnZxgvZr7UzYs3J';
    const transfer = await onChainService.getFirstTransfer(mint);
    console.log(transfer);
    expect(transfer).toBeDefined();
    if (transfer) {
      expect(transfer.fromAddr).toBe('');
    }
  });
});
