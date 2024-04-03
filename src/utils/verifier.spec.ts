import { signerVerifyMsg } from './verifier';

describe('Verifier', () => {
  it('should verify signed message', () => {
    const testPubKey = '3y2q1HUboZnikUv3bj52WVjvWiDDMctFB9WXa6xTPBrs';
    const testMsg = 'Joe';
    const testSignature =
      '5nka9QkEh1Kbjq1VChFXwojjdMNPHzjZ8g59RAmVukwRERR9VMDTnioKy8WyZEUWrKoYXm2KDFSwqGuHEE9t2bU8';

    expect(signerVerifyMsg(testPubKey, testMsg, testSignature)).toBeTruthy();
  });
});
