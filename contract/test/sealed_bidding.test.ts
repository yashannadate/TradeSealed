import { describe, it, expect } from 'vitest';
import { Contract, ledger, Witnesses } from '../managed/contract/index.js';
import { createConstructorContext, createCircuitContext } from '@midnight-ntwrk/compact-runtime';

describe('SealedBidding Contract — Level 2 Test Suite', () => {
  const dummyCoinPublicKey = { bytes: new Uint8Array(32) };
  const dummyAuthority = new Uint8Array(32);
  const dummyContractAddress = '0000000000000000000000000000000000000000000000000000000000000000';

  // Helper: create a contract instance with the given witnesses
  const createContract = (score: bigint, price: bigint) => {
    const witnesses: Witnesses<any> = {
      vendor_qualification_score: (context) => [context.privateState, score],
      bid_price: (context) => [context.privateState, price],
    };
    return new Contract(witnesses);
  };

  // Helper: initialize ledger state
  const initializeLedger = (contract: any, minScore: bigint) => {
    const ctx = createConstructorContext({}, dummyCoinPublicKey);
    return contract.initialState(ctx, dummyAuthority, minScore);
  };

  // Helper: create a circuit context from a constructor/circuit result
  const makeCircuitCtx = (result: any) => {
    return createCircuitContext(
      dummyContractAddress,
      dummyCoinPublicKey,
      result.currentContractState,
      result.currentPrivateState
    );
  };

  // ─── Constructor Tests ────────────────────────────

  describe('Constructor / Initialization', () => {
    it('correctly initializes ledger state via constructor', () => {
      const contract = createContract(85n, 45000n);
      const result = initializeLedger(contract, 75n);
      const state = ledger(result.currentContractState.data);

      expect(state.minimum_qualification_score).toBe(75n);
      expect(state.bids_count).toBe(0n);
      expect(state.is_active).toBe(true);
    });

    it('stores the correct tender authority bytes', () => {
      const contract = createContract(85n, 45000n);
      const result = initializeLedger(contract, 75n);
      const state = ledger(result.currentContractState.data);

      expect(state.tender_authority).toBeInstanceOf(Uint8Array);
      expect(state.tender_authority.length).toBe(32);
    });

    it('initializes with zero bids count', () => {
      const contract = createContract(85n, 45000n);
      const result = initializeLedger(contract, 90n);
      const state = ledger(result.currentContractState.data);

      expect(state.bids_count).toBe(0n);
    });

    it('initializes tender as active by default', () => {
      const contract = createContract(85n, 45000n);
      const result = initializeLedger(contract, 50n);
      const state = ledger(result.currentContractState.data);

      expect(state.is_active).toBe(true);
    });
  });

  // ─── Circuit Execution Tests ──────────────────────

  describe('submit_bid() Circuit', () => {
    it('successfully accepts a valid bid (score >= min, price > 0)', () => {
      const contract = createContract(85n, 50000n);
      const initResult = initializeLedger(contract, 75n);

      const circuitCtx = makeCircuitCtx(initResult);
      const bidResult = contract.impureCircuits.submit_bid(circuitCtx);
      const newState = ledger(bidResult.context.currentQueryContext.state);

      // Bid count should increment from 0 to 1
      expect(newState.bids_count).toBe(1n);
      expect(newState.is_active).toBe(true);
    });

    it('increments bids_count on each successive bid', () => {
      const contract = createContract(90n, 100000n);
      const initResult = initializeLedger(contract, 80n);

      // First bid
      const ctx1 = makeCircuitCtx(initResult);
      const result1 = contract.impureCircuits.submit_bid(ctx1);
      const state1 = ledger(result1.context.currentQueryContext.state);
      expect(state1.bids_count).toBe(1n);

      // Second bid — use the updated context
      const result2 = contract.impureCircuits.submit_bid(result1.context);
      const state2 = ledger(result2.context.currentQueryContext.state);
      expect(state2.bids_count).toBe(2n);
    });

    it('rejects a bid with price equal to zero', () => {
      const contract = createContract(85n, 0n); // price = 0
      const initResult = initializeLedger(contract, 75n);

      const circuitCtx = makeCircuitCtx(initResult);

      expect(() => {
        contract.impureCircuits.submit_bid(circuitCtx);
      }).toThrow();
    });

    it('rejects a bid with qualification score below minimum', () => {
      const contract = createContract(50n, 45000n); // score 50 < min 75
      const initResult = initializeLedger(contract, 75n);

      const circuitCtx = makeCircuitCtx(initResult);

      expect(() => {
        contract.impureCircuits.submit_bid(circuitCtx);
      }).toThrow();
    });

    it('accepts a bid with score exactly equal to minimum', () => {
      const contract = createContract(75n, 30000n); // score == min
      const initResult = initializeLedger(contract, 75n);

      const circuitCtx = makeCircuitCtx(initResult);
      const bidResult = contract.impureCircuits.submit_bid(circuitCtx);
      const newState = ledger(bidResult.context.currentQueryContext.state);

      expect(newState.bids_count).toBe(1n);
    });

    it('preserves other ledger fields after bid submission', () => {
      const contract = createContract(85n, 50000n);
      const initResult = initializeLedger(contract, 80n);

      const circuitCtx = makeCircuitCtx(initResult);
      const bidResult = contract.impureCircuits.submit_bid(circuitCtx);
      const newState = ledger(bidResult.context.currentQueryContext.state);

      // Other fields should remain unchanged
      expect(newState.minimum_qualification_score).toBe(80n);
      expect(newState.is_active).toBe(true);
    });
  });

  // ─── Privacy Verification Tests ───────────────────

  describe('Privacy Model Verification', () => {
    it('private witness values (price, score) are NOT stored in public ledger state', () => {
      const secretPrice = 123456n;
      const secretScore = 99n;
      const contract = createContract(secretScore, secretPrice);
      const initResult = initializeLedger(contract, 75n);

      const circuitCtx = makeCircuitCtx(initResult);
      const bidResult = contract.impureCircuits.submit_bid(circuitCtx);
      const publicState = ledger(bidResult.context.currentQueryContext.state);

      // The public state should NOT contain the secret price or score
      const stateJson = JSON.stringify(publicState, (_, v) => typeof v === 'bigint' ? v.toString() : v);
      expect(stateJson).not.toContain('123456');
      expect(stateJson).not.toContain('"99"');

      // Only bids_count should change
      expect(publicState.bids_count).toBe(1n);
    });

    it('public ledger only reveals tender metadata and bid count', () => {
      const contract = createContract(85n, 50000n);
      const initResult = initializeLedger(contract, 75n);
      const state = ledger(initResult.currentContractState.data);

      // Verify only expected public fields exist
      const publicKeys = Object.keys(state);
      expect(publicKeys).toContain('tender_authority');
      expect(publicKeys).toContain('minimum_qualification_score');
      expect(publicKeys).toContain('bids_count');
      expect(publicKeys).toContain('is_active');

      // Should NOT contain any private witness fields
      expect(publicKeys).not.toContain('bid_price');
      expect(publicKeys).not.toContain('vendor_qualification_score');
    });
  });
});
