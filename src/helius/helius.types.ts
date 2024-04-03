export interface HeliusWebhook {
  webhookID: string;
  project: string;
  wallet: string;
  webhookURL: string;
  accountAddresses: string[];
  transactionTypes: string[];
  webhookType: string;
}

export interface HeliusUpdate {
  transactionTypes: string[];
  accountAddresses: string[];
  webhookURL: string;
}

interface RawTokenAmount {
  decimals: number;
  tokenAmount: string;
}

interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: RawTokenAmount;
  tokenAccount: string;
  userAccount: string;
}

interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

interface TokenTransfer {
  fromTokenAccount: string;
  fromUserAccount: string;
  mint: string;
  toTokenAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  tokenStandard: string;
}

interface Instruction {
  accounts: string[];
  data: string;
  programId: string;
}

export interface WebhookEvent {
  accountData: AccountData[];
  description: string;
  fee: number;
  feePayer: string;
  instructions: Instruction[];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: TokenTransfer[];
  transactionError?: string;
  type: string;
}

export type Asset = {
  interface: string;
  id: string;
  content: {
    $schema: string;
    json_uri: string;
    files: any[];
    metadata: {
      name: string;
      symbol: string;
      token_standard: string;
    };
    links: any;
  };
  authorities: {
    address: string;
    scopes: string[];
  }[];
  compression: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping: any[];
  royalty: {
    royalty_model: string;
    target: null | string;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators: {
    address: string;
    share: number;
    verified: boolean;
  }[];
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: null | string;
    ownership_model: string;
    owner: string;
  };
  supply: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number;
  };
  mutable: boolean;
  burnt: boolean;
  token_info: {
    supply: number;
    decimals: number;
    token_program: string;
    associated_token_address: string;
  };
};
