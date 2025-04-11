import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract module
const MultiSigWallet = {
  // State
  owners: [],
  threshold: 0,
  txCounter: 0,
  transactions: new Map(),
  blockHeight: 100,

  // Constants
  ERR_NOT_AUTHORIZED: { error: 'err', value: 100 },
  ERR_INVALID_THRESHOLD: { error: 'err', value: 101 },
  ERR_ALREADY_SIGNED: { error: 'err', value: 102 },
  ERR_INSUFFICIENT_SIGNATURES: { error: 'err', value: 103 },
  ERR_TX_DOESNT_EXIST: { error: 'err', value: 104 },
  ERR_TX_EXPIRED: { error: 'err', value: 105 },
  ERR_TX_ALREADY_EXECUTED: { error: 'err', value: 106 },

  // Reset for tests
  reset() {
    this.owners = [];
    this.threshold = 0;
    this.txCounter = 0;
    this.transactions = new Map();
    this.blockHeight = 100;
  },

  // Methods
  initialize(newOwners, sigThreshold, caller) {
    if (sigThreshold > newOwners.length) {
      return this.ERR_INVALID_THRESHOLD;
    }
    if (sigThreshold <= 0) {
      return this.ERR_INVALID_THRESHOLD;
    }
    
    this.owners = [...newOwners];
    this.threshold = sigThreshold;
    return { success: true, value: true };
  },

  isOwner(principal) {
    return this.owners.includes(principal);
  },

  proposeTransaction(to, amount, expiration, caller) {
    if (!this.isOwner(caller)) {
      return this.ERR_NOT_AUTHORIZED;
    }
    
    const txId = this.txCounter;
    this.transactions.set(txId, {
      to,
      amount,
      executed: false,
      expiration,
      signatures: [caller]
    });
    
    this.txCounter++;
    return { success: true, value: txId };
  },

  signTransaction(txId, caller) {
    const tx = this.transactions.get(txId);
    
    if (!tx) {
      return this.ERR_TX_DOESNT_EXIST;
    }
    
    if (this.blockHeight >= tx.expiration) {
      return this.ERR_TX_EXPIRED;
    }
    
    if (tx.executed) {
      return this.ERR_TX_ALREADY_EXECUTED;
    }
    
    if (!this.isOwner(caller)) {
      return this.ERR_NOT_AUTHORIZED;
    }
    
    if (tx.signatures.includes(caller)) {
      return this.ERR_ALREADY_SIGNED;
    }
    
    tx.signatures.push(caller);
    return { success: true, value: true };
  },

  executeTransaction(txId, caller) {
    const tx = this.transactions.get(txId);
    
    if (!tx) {
      return this.ERR_TX_DOESNT_EXIST;
    }
    
    if (this.blockHeight >= tx.expiration) {
      return this.ERR_TX_EXPIRED;
    }
    
    if (tx.executed) {
      return this.ERR_TX_ALREADY_EXECUTED;
    }
    
    if (tx.signatures.length < this.threshold) {
      return this.ERR_INSUFFICIENT_SIGNATURES;
    }
    
    tx.executed = true;
    
    // Mock STX transfer
    return { success: true, value: true };
  },

  getSignatureCount(txId) {
    const tx = this.transactions.get(txId);
    return tx ? { success: true, value: tx.signatures.length } : { success: true, value: 0 };
  },

  hasSigned(txId, who) {
    const tx = this.transactions.get(txId);
    return tx ? { success: true, value: tx.signatures.includes(who) } : { success: true, value: false };
  },

  getOwners() {
    return { success: true, value: this.owners };
  },

  getThreshold() {
    return { success: true, value: this.threshold };
  }
};

// Mock principals for testing
const wallet1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
const wallet2 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const wallet3 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
const wallet4 = 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND';
const wallet5 = 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB';
const nonOwner = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';

describe('Multi-Signature Wallet', () => {
  beforeEach(() => {
    // Reset contract state before each test
    MultiSigWallet.reset();
  });

  describe('initialize', () => {
    it('should successfully initialize with valid parameters', () => {
      // Initialize with 3 owners and threshold 2
      const result = MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        2,
        wallet1
      );

      expect(result.success).toBe(true);
      
      // Check owners and threshold
      const owners = MultiSigWallet.getOwners();
      const threshold = MultiSigWallet.getThreshold();
      
      expect(owners.value).toEqual([wallet1, wallet2, wallet3]);
      expect(threshold.value).toBe(2);
    });

    it('should fail with threshold higher than owner count', () => {
      const result = MultiSigWallet.initialize(
        [wallet1, wallet2],
        3,
        wallet1
      );

      expect(result).toEqual(MultiSigWallet.ERR_INVALID_THRESHOLD);
    });

    it('should fail with threshold zero', () => {
      const result = MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        0,
        wallet1
      );

      expect(result).toEqual(MultiSigWallet.ERR_INVALID_THRESHOLD);
    });
  });

  describe('propose-transaction', () => {
    beforeEach(() => {
      // Initialize wallet for transaction tests
      MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        2,
        wallet1
      );
    });

    it('should allow an owner to propose a transaction', () => {
      const result = MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        200,
        wallet1
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe(0); // First transaction ID should be 0
    });

    it('should not allow a non-owner to propose a transaction', () => {
      const result = MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        200,
        nonOwner
      );

      expect(result).toEqual(MultiSigWallet.ERR_NOT_AUTHORIZED);
    });
  });

  describe('sign-transaction', () => {
    beforeEach(() => {
      // Initialize wallet
      MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        2,
        wallet1
      );

      // Propose a transaction
      MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        200,
        wallet1
      );
    });

    it('should not allow signing a non-existent transaction', () => {
      const result = MultiSigWallet.signTransaction(99, wallet2);
      expect(result).toEqual(MultiSigWallet.ERR_TX_DOESNT_EXIST);
    });

    it('should not allow a non-owner to sign', () => {
      const result = MultiSigWallet.signTransaction(0, nonOwner);
      expect(result).toEqual(MultiSigWallet.ERR_NOT_AUTHORIZED);
    });

    it('should allow an owner to sign a transaction', () => {
      const result = MultiSigWallet.signTransaction(0, wallet2);
      expect(result.success).toBe(true);
      
      // Check signature count
      const count = MultiSigWallet.getSignatureCount(0);
      expect(count.value).toBe(2);
    });

    it('should not allow an owner to sign twice', () => {
      // First sign is successful
      MultiSigWallet.signTransaction(0, wallet2);
      
      // Second sign should fail
      const result = MultiSigWallet.signTransaction(0, wallet2);
      expect(result).toEqual(MultiSigWallet.ERR_ALREADY_SIGNED);
    });
  });

  describe('execute-transaction', () => {
    beforeEach(() => {
      // Initialize wallet
      MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        2,
        wallet1
      );

      // Propose a transaction
      MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        200,
        wallet1
      );
    });

    it('should not execute with insufficient signatures', () => {
      // Only wallet1 has signed (proposer)
      const result = MultiSigWallet.executeTransaction(0, wallet1);
      expect(result).toEqual(MultiSigWallet.ERR_INSUFFICIENT_SIGNATURES);
    });

    it('should execute when threshold is met', () => {
      // wallet2 signs to meet threshold
      MultiSigWallet.signTransaction(0, wallet2);
      
      const result = MultiSigWallet.executeTransaction(0, wallet1);
      expect(result.success).toBe(true);
    });

    it('should not execute an already executed transaction', () => {
      // wallet2 signs to meet threshold
      MultiSigWallet.signTransaction(0, wallet2);
      
      // Execute first time
      MultiSigWallet.executeTransaction(0, wallet1);
      
      // Try to execute again
      const result = MultiSigWallet.executeTransaction(0, wallet1);
      expect(result).toEqual(MultiSigWallet.ERR_TX_ALREADY_EXECUTED);
    });
  });

  describe('expiration', () => {
    beforeEach(() => {
      // Initialize wallet
      MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        2,
        wallet1
      );
    });

    it('should not allow signing an expired transaction', () => {
      // Propose a transaction that expires immediately
      MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        100, // Current block height is 100, so immediately expired
        wallet1
      );
      
      const result = MultiSigWallet.signTransaction(0, wallet2);
      expect(result).toEqual(MultiSigWallet.ERR_TX_EXPIRED);
    });

    it('should not allow executing an expired transaction', () => {
      // Propose a transaction that expires immediately
      MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        100, // Current block height is 100, so immediately expired
        wallet1
      );
      
      const result = MultiSigWallet.executeTransaction(0, wallet1);
      expect(result).toEqual(MultiSigWallet.ERR_TX_EXPIRED);
    });
  });

  describe('helper functions', () => {
    beforeEach(() => {
      // Initialize wallet
      MultiSigWallet.initialize(
        [wallet1, wallet2, wallet3],
        2,
        wallet1
      );

      // Propose a transaction
      MultiSigWallet.proposeTransaction(
        wallet4,
        1000,
        200,
        wallet1
      );
    });

    it('should check if a principal has signed', () => {
      // wallet1 has signed (proposer)
      const wallet1Signed = MultiSigWallet.hasSigned(0, wallet1);
      expect(wallet1Signed.value).toBe(true);
      
      // wallet2 has not signed yet
      const wallet2Signed = MultiSigWallet.hasSigned(0, wallet2);
      expect(wallet2Signed.value).toBe(false);
      
      // wallet2 signs
      MultiSigWallet.signTransaction(0, wallet2);
      
      // Now wallet2 should show as signed
      const wallet2SignedAfter = MultiSigWallet.hasSigned(0, wallet2);
      expect(wallet2SignedAfter.value).toBe(true);
    });
  });
});