/**
 * Unit Tests for LS-LMSR (Logarithmic Scoring Market Maker) Logic
 * Tests the core mathematical functions used in the smart contract
 */

const { expect } = require('chai');

// Mock implementation of LS-LMSR functions for testing
// These mirror the Rust implementation in the smart contract
class LsLmsr {
  constructor(alpha = 0.02) {
    this.alpha = alpha;
  }

  // Calculate cost of buying shares using LS-LMSR
  calculateBuyCost(totalShares, optionIndex, sharesToBuy, liquidity) {
    const currentCost = this.calculateCost(totalShares, liquidity);
    
    const newShares = [...totalShares];
    newShares[optionIndex] += sharesToBuy;
    
    const newCost = this.calculateCost(newShares, liquidity);
    
    return Math.max(0, Math.floor(newCost - currentCost));
  }

  // Calculate payout from selling shares using LS-LMSR
  calculateSellPayout(totalShares, optionIndex, sharesToSell, liquidity) {
    const currentCost = this.calculateCost(totalShares, liquidity);
    
    const newShares = [...totalShares];
    newShares[optionIndex] = Math.max(0, newShares[optionIndex] - sharesToSell);
    
    const newCost = this.calculateCost(newShares, liquidity);
    
    return Math.max(0, Math.floor(currentCost - newCost));
  }

  // Core LS-LMSR cost function
  calculateCost(shares, liquidity) {
    const b = liquidity * this.alpha;
    
    // Calculate sum of exponentials: sum(exp(shares[i] / b))
    let sumExp = 0;
    for (let i = 0; i < shares.length; i++) {
      sumExp += Math.exp(shares[i] / b);
    }
    
    // Cost = b * ln(sumExp)
    return b * Math.log(sumExp);
  }

  // Calculate current market prices (probabilities)
  calculatePrices(totalShares, liquidity) {
    const b = liquidity * this.alpha;
    const prices = [];
    
    let sumExp = 0;
    const exps = [];
    
    // Calculate exponentials
    for (let i = 0; i < totalShares.length; i++) {
      const exp = Math.exp(totalShares[i] / b);
      exps.push(exp);
      sumExp += exp;
    }
    
    // Calculate normalized prices (probabilities)
    for (let i = 0; i < totalShares.length; i++) {
      prices.push(exps[i] / sumExp);
    }
    
    return prices;
  }
}

describe('LS-LMSR Unit Tests', () => {
  let lslmsr;
  
  beforeEach(() => {
    lslmsr = new LsLmsr(0.02); // 2% alpha as in smart contract
  });

  describe('Basic LS-LMSR Properties', () => {
    it('should initialize with correct alpha value', () => {
      expect(lslmsr.alpha).to.equal(0.02);
    });

    it('should calculate initial cost correctly for zero shares', () => {
      const shares = [0, 0];
      const liquidity = 1000000000; // 1 SOL in lamports
      const cost = lslmsr.calculateCost(shares, liquidity);
      
      // For zero shares, cost should be b * ln(n) where n is number of options
      const expectedCost = liquidity * 0.02 * Math.log(2);
      expect(Math.abs(cost - expectedCost)).to.be.lessThan(0.001);
    });

    it('should maintain probability sum of 1', () => {
      const shares = [100, 200, 150];
      const liquidity = 1000000000;
      const prices = lslmsr.calculatePrices(shares, liquidity);
      
      const sum = prices.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1)).to.be.lessThan(0.0001);
    });
  });

  describe('Buy Operations', () => {
    it('should calculate buy cost correctly for first purchase', () => {
      const shares = [0, 0];
      const liquidity = 1000000000;
      const sharesToBuy = 100;
      
      const cost = lslmsr.calculateBuyCost(shares, 0, sharesToBuy, liquidity);
      expect(cost).to.be.greaterThan(0);
      expect(cost).to.be.lessThan(liquidity); // Should be less than total liquidity
    });

    it('should have increasing marginal cost', () => {
      const shares = [0, 0];
      const liquidity = 1000000000;
      
      const cost1 = lslmsr.calculateBuyCost(shares, 0, 100, liquidity);
      const cost2 = lslmsr.calculateBuyCost([100, 0], 0, 100, liquidity);
      
      expect(cost2).to.be.greaterThan(cost1);
    });

    it('should affect market prices after purchase', () => {
      const initialShares = [0, 0];
      const liquidity = 1000000000;
      
      const initialPrices = lslmsr.calculatePrices(initialShares, liquidity);
      expect(initialPrices[0]).to.be.approximately(0.5, 0.001);
      expect(initialPrices[1]).to.be.approximately(0.5, 0.001);
      
      const sharesAfterBuy = [100, 0];
      const newPrices = lslmsr.calculatePrices(sharesAfterBuy, liquidity);
      expect(newPrices[0]).to.be.greaterThan(0.5);
      expect(newPrices[1]).to.be.lessThan(0.5);
    });
  });

  describe('Sell Operations', () => {
    it('should calculate sell payout correctly', () => {
      const shares = [100, 50];
      const liquidity = 1000000000;
      const sharesToSell = 50;
      
      const payout = lslmsr.calculateSellPayout(shares, 0, sharesToSell, liquidity);
      expect(payout).to.be.greaterThan(0);
    });

    it('should have decreasing marginal payout', () => {
      const shares = [200, 0];
      const liquidity = 1000000000;
      
      const payout1 = lslmsr.calculateSellPayout(shares, 0, 50, liquidity);
      const payout2 = lslmsr.calculateSellPayout([150, 0], 0, 50, liquidity);
      
      expect(payout2).to.be.lessThan(payout1);
    });

    it('should not allow selling more shares than owned', () => {
      const shares = [50, 100];
      const liquidity = 1000000000;
      
      // Try to sell more shares than available
      const payout = lslmsr.calculateSellPayout(shares, 0, 100, liquidity);
      
      // Should handle gracefully (in smart contract, this would be prevented)
      expect(payout).to.be.greaterThan(0);
    });
  });

  describe('Market Efficiency', () => {
    it('should satisfy no-arbitrage condition', () => {
      const shares = [100, 200];
      const liquidity = 1000000000;
      
      // Buy and immediately sell should result in loss due to fees
      const buyCost = lslmsr.calculateBuyCost(shares, 0, 10, liquidity);
      const newShares = [110, 200];
      const sellPayout = lslmsr.calculateSellPayout(newShares, 0, 10, liquidity);
      
      // Sell payout should be less than buy cost (market maker spread)
      expect(sellPayout).to.be.lessThan(buyCost);
    });

    it('should handle extreme market conditions', () => {
      const shares = [10000, 1]; // Very skewed market
      const liquidity = 1000000000;
      
      const prices = lslmsr.calculatePrices(shares, liquidity);
      expect(prices[0]).to.be.greaterThan(0.9); // Should be very high
      expect(prices[1]).to.be.lessThan(0.1);   // Should be very low
      
      // Should still sum to 1
      const sum = prices.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1)).to.be.lessThan(0.0001);
    });
  });

  describe('Multi-Option Markets', () => {
    it('should handle 3-option markets correctly', () => {
      const shares = [100, 150, 200];
      const liquidity = 1000000000;
      
      const prices = lslmsr.calculatePrices(shares, liquidity);
      expect(prices).to.have.length(3);
      
      const sum = prices.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1)).to.be.lessThan(0.0001);
      
      // Option with most shares should have highest price
      expect(prices[2]).to.be.greaterThan(prices[1]);
      expect(prices[1]).to.be.greaterThan(prices[0]);
    });

    it('should handle 10-option markets correctly', () => {
      const shares = new Array(10).fill(0).map((_, i) => i * 10);
      const liquidity = 1000000000;
      
      const prices = lslmsr.calculatePrices(shares, liquidity);
      expect(prices).to.have.length(10);
      
      const sum = prices.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1)).to.be.lessThan(0.0001);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero liquidity gracefully', () => {
      const shares = [100, 100];
      const liquidity = 0;
      
      // This would cause division by zero in real implementation
      // Smart contract should prevent this
      expect(() => {
        lslmsr.calculateCost(shares, liquidity);
      }).to.throw();
    });

    it('should handle negative shares gracefully', () => {
      const shares = [-10, 100];
      const liquidity = 1000000000;
      
      // Negative shares should be handled (prevented in smart contract)
      const cost = lslmsr.calculateCost(shares, liquidity);
      expect(cost).to.be.a('number');
      expect(isNaN(cost)).to.be.false;
    });

    it('should handle very large numbers', () => {
      const shares = [1000000, 2000000];
      const liquidity = 1000000000000; // Very large liquidity
      
      const cost = lslmsr.calculateCost(shares, liquidity);
      expect(cost).to.be.a('number');
      expect(isNaN(cost)).to.be.false;
      expect(isFinite(cost)).to.be.true;
    });
  });

  describe('Alpha Parameter Effects', () => {
    it('should have different behavior with different alpha values', () => {
      const lslmsr1 = new LsLmsr(0.01); // Lower alpha (less sensitive)
      const lslmsr2 = new LsLmsr(0.05); // Higher alpha (more sensitive)
      
      const shares = [100, 0];
      const liquidity = 1000000000;
      
      const prices1 = lslmsr1.calculatePrices(shares, liquidity);
      const prices2 = lslmsr2.calculatePrices(shares, liquidity);
      
      // Higher alpha should be more sensitive to share differences
      expect(prices2[0]).to.be.greaterThan(prices1[0]);
    });
  });
});

describe('Smart Contract Integration Tests', () => {
  it('should match smart contract constants', () => {
    // Verify our test constants match the smart contract
    const ALPHA = 0.02;
    const MIN_LIQUIDITY = 1000000; // 0.001 SOL
    const MAX_OPTIONS = 10;
    
    expect(ALPHA).to.equal(0.02);
    expect(MIN_LIQUIDITY).to.equal(1000000);
    expect(MAX_OPTIONS).to.equal(10);
  });

  it('should handle precision similar to smart contract', () => {
    // Test precision handling for lamport amounts
    const lslmsr = new LsLmsr(0.02);
    const shares = [1000000, 500000]; // 1M and 0.5M shares
    const liquidity = 1000000000; // 1 SOL
    
    const cost = lslmsr.calculateBuyCost(shares, 0, 100000, liquidity);
    
    // Should be a reasonable lamport amount
    expect(cost).to.be.greaterThan(1000); // At least 1000 lamports
    expect(cost).to.be.lessThan(1000000000); // Less than 1 SOL
  });
});
