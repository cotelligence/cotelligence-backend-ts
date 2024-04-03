import { MintTransfer } from '../helpers/on-chain.types';
import { solscanAccount, solscanToken, solscanTx } from './url';

export const genMintMsg = (
  transfer: MintTransfer,
  isMainnet: boolean
): string => {
  return `[Mint]\nMint: ${transfer.mint} ${solscanToken(
    transfer.mint,
    isMainnet
  )}\nTo: ${transfer.toAddr} ${solscanAccount(
    transfer.toAddr,
    isMainnet
  )}\nSig: ${solscanTx(transfer.sig, isMainnet)}\nSlot: ${transfer.slot}`;
};

export const genMintTransferMsg = (
  transfer: MintTransfer,
  isMainnet: boolean
): string => {
  return `[Transfer]\nMint: ${transfer.mint} ${solscanToken(
    transfer.mint,
    isMainnet
  )}\nFrom: ${transfer.fromAddr} ${solscanAccount(
    transfer.fromAddr,
    isMainnet
  )}\nTo: ${transfer.toAddr} ${solscanAccount(
    transfer.toAddr,
    isMainnet
  )}\nSig: ${solscanTx(transfer.sig, isMainnet)}\nSlot: ${transfer.slot}`;
};
