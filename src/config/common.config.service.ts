import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvConfig, EnvConfigObj } from './common.config.types';

@Injectable()
export class CommonConfigService {
  constructor(private configService: ConfigService<EnvConfig>) {
    // validate env
    Object.keys(EnvConfigObj).forEach((key) => {
      this.get(key as keyof EnvConfig);
    });
  }

  get(key: keyof EnvConfig): EnvConfig[typeof key] {
    return this.configService.getOrThrow<EnvConfig[typeof key]>(key);
  }

  get loggerLevel(): string {
    return this.get('LOGGER_LEVEL');
  }

  get isMainnet(): boolean {
    const isMainnet = this.get('IS_MAINNET');
    return (
      isMainnet.toLowerCase() === 'true' || isMainnet.toLowerCase() === 'on'
    );
  }

  get alchemyApiKey(): string {
    return this.get('ALCHEMY_KEY');
  }

  get feishuBotId(): string {
    return this.get('FEISHU_BOT_ID');
  }

  get solanaPrivateKey(): string {
    return this.get('SOLANA_ACCOUNT_KEY');
  }

  get runpodKey(): string {
    return this.get('RUNPOD_KEY');
  }

  get runpodApi(): string {
    return `https://api.runpod.io/graphql?api_key=${this.runpodKey}`;
  }

  get stakingPoolAccountPrivateKey(): string {
    return this.get('STAKING_POOL_ACCOUNT_KEY');
  }

  get heliusApiKey(): string {
    return this.get('HELIUS_API_KEY');
  }

  get heliusWebhookId(): string {
    return this.get('HELIUS_WEBHOOK_ID');
  }

  get heliusWebhookUrl(): string {
    return this.get('HELIUS_WEBHOOK_URL');
  }

  get heliusApiBaseUrl(): string {
    return 'https://api.helius.xyz';
  }

  get heliusRpcBaseUrl(): string {
    return this.isMainnet
      ? 'https://mainnet.helius-rpc.com'
      : 'https://devnet.helius-rpc.com';
  }

  get solRpcUrl(): string {
    return this.isMainnet
      ? `https://solana-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`
      : `https://solana-devnet.g.alchemy.com/v2/${this.alchemyApiKey}`;
  }

  get gpuNftCollection(): string {
    return this.get('GPU_NFT_COLLECTION');
  }

  get bondNftCollection(): string {
    return this.get('BOND_NFT_COLLECTION');
  }

  get gpuMetadataUri(): string {
    return 'https://nftstorage.link/ipfs/bafkreid77dcmqqkv7vmddhupvyxnf3wvqg6aa2s5vvyzx3qem3sptzmxb4';
  }

  get bondMetadataUri(): string {
    return 'https://nftstorage.link/ipfs/bafkreiexu6mt6yijyqd4tpi5hzruz66iwc5lhn76tbzmhw5cibnmkwlham';
  }
}
