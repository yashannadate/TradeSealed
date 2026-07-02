import { describe, it, expect } from 'vitest';
import { Contract, ledger, Witnesses } from '../managed/contract/index.js';
import { createConstructorContext } from '@midnight-ntwrk/compact-runtime';

describe('SealedBidding Level 1 Contract', () => {
  const dummyCoinPublicKey = { bytes: new Uint8Array(32) };
  const dummyAuthority = new Uint8Array(32);
  
  it('correctly initializes ledger state via constructor', () => {
    const witnesses: Witnesses<any> = {
      vendor_qualification_score: (context) => [context.privateState, 85n],
      bid_price: (context) => [context.privateState, 45000n]
    };

    const contract = new Contract(witnesses);
    const constructorContext = createConstructorContext({}, dummyCoinPublicKey);
    const minScore = 75n;

    const initResult = contract.initialState(constructorContext, dummyAuthority, minScore);
    const currentLedger = ledger(initResult.currentContractState.data);

    expect(currentLedger.minimum_qualification_score).toBe(75n);
    expect(currentLedger.bids_count).toBe(0n);
    expect(currentLedger.is_active).toBe(true);
  });
});
