import { decode } from 'bs58';
import * as nacl from 'tweetnacl';

export function signerVerifyMsg(
  pubKey: string,
  msg: string,
  sig: string
): boolean {
  // get public key bytes from base58 string
  const pubKeyBytes = decode(pubKey);
  const signatureBytes = decode(sig);
  const msgBytes = new TextEncoder().encode(msg);

  // verify the message
  return nacl.sign.detached.verify(msgBytes, signatureBytes, pubKeyBytes);
}
