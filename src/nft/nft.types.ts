import { PublicKey } from '@metaplex-foundation/umi';

export type MintOwner = {
  owner: string;
  mint: string;
  sig: string;
  slot: number;
};

export type MintNftTransaction = {
  serializedTx: string;
  mint: PublicKey | string;
};

export type MintAndBondTransaction = {
  serializedTx: string;
  gpuMint: PublicKey | string;
  bondMint: PublicKey | string;
};

export type UserBonds = {
  owner: string;
  mint: string;
  createdAt: number;
  expired: boolean;
  expireTime: number;
  rewards: number;
};

export type BondingSuccess = {
  owner: string;
  mint: string;
};
