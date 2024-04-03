const DEVNET_QUERY = '?cluster=devnet';

export const solscanToken = (token: string, isMainnet: boolean): string => {
  return `https://solscan.io/token/${token}${isMainnet ? '' : DEVNET_QUERY}`;
};

export const solscanAccount = (account: string, isMainnet: boolean): string => {
  return `https://solscan.io/account/${account}${
    isMainnet ? '' : DEVNET_QUERY
  }`;
};

export const solscanTx = (sig: string, isMainnet: boolean): string => {
  return `https://solscan.io/tx/${sig}${isMainnet ? '' : DEVNET_QUERY}`;
};
