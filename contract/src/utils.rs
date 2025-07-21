use anchor_lang::prelude::*;
use crate::ErrorCode;

/// LS-LMSR utility functions for opinion market calculations
pub struct LsLmsr;

impl LsLmsr {
    /// Calculate the cost function C(q) for LS-LMSR
    /// C(q) = b * log(sum(exp(q_i / b)))
    /// where b is the liquidity parameter and q_i are the quantities
    pub fn cost_function(quantities: &[u64], liquidity_param: f64) -> Result<u64> {
        if quantities.is_empty() {
            return Err(ErrorCode::InvalidOption.into());
        }

        let mut sum_exp = 0.0;
        for &q in quantities {
            let q_f64 = q as f64;
            sum_exp += (q_f64 / liquidity_param).exp();
        }

        let cost = liquidity_param * sum_exp.ln();
        
        // Convert to lamports (assuming 9 decimal places like SOL)
        let cost_lamports = (cost * 1_000_000_000.0) as u64;
        
        Ok(cost_lamports)
    }

    /// Calculate the price of option i: p_i(q) = exp(q_i / b) / sum(exp(q_j / b))
    pub fn price_function(quantities: &[u64], option_index: usize, liquidity_param: f64) -> Result<u64> {
        if option_index >= quantities.len() {
            return Err(ErrorCode::InvalidOption.into());
        }

        if quantities.is_empty() {
            return Err(ErrorCode::InvalidOption.into());
        }

        let mut sum_exp = 0.0;
        for &q in quantities {
            let q_f64 = q as f64;
            sum_exp += (q_f64 / liquidity_param).exp();
        }

        let option_q = quantities[option_index] as f64;
        let option_exp = (option_q / liquidity_param).exp();
        
        let price = option_exp / sum_exp;
        
        // Convert to basis points (10000 = 100%)
        let price_bps = (price * 10000.0) as u64;
        
        Ok(price_bps)
    }

    /// Calculate the cost to buy shares of option i
    /// cost = C(q + r_i) - C(q)
    /// where r_i is a vector with r shares for option i and 0 for others
    pub fn buy_cost(
        quantities: &[u64],
        option_index: usize,
        shares: u64,
        liquidity_param: f64,
    ) -> Result<u64> {
        if option_index >= quantities.len() {
            return Err(ErrorCode::InvalidOption.into());
        }

        // Current cost
        let current_cost = Self::cost_function(quantities, liquidity_param)?;

        // New quantities after buying
        let mut new_quantities = quantities.to_vec();
        new_quantities[option_index] = new_quantities[option_index]
            .checked_add(shares)
            .ok_or(ErrorCode::InvalidOption)?;

        // New cost
        let new_cost = Self::cost_function(&new_quantities, liquidity_param)?;

        // Cost difference
        let cost_diff = new_cost
            .checked_sub(current_cost)
            .ok_or(ErrorCode::InvalidOption)?;

        Ok(cost_diff)
    }

    /// Calculate the cost to sell shares of option i
    /// cost = C(q) - C(q - r_i)
    /// where r_i is a vector with r shares for option i and 0 for others
    pub fn sell_cost(
        quantities: &[u64],
        option_index: usize,
        shares: u64,
        liquidity_param: f64,
    ) -> Result<u64> {
        if option_index >= quantities.len() {
            return Err(ErrorCode::InvalidOption.into());
        }

        if quantities[option_index] < shares {
            return Err(ErrorCode::InsufficientShares.into());
        }

        // Current cost
        let current_cost = Self::cost_function(quantities, liquidity_param)?;

        // New quantities after selling
        let mut new_quantities = quantities.to_vec();
        new_quantities[option_index] = new_quantities[option_index]
            .checked_sub(shares)
            .ok_or(ErrorCode::InvalidOption)?;

        // New cost
        let new_cost = Self::cost_function(&new_quantities, liquidity_param)?;

        // Cost difference
        let cost_diff = current_cost
            .checked_sub(new_cost)
            .ok_or(ErrorCode::InvalidOption)?;

        Ok(cost_diff)
    }

    /// Calculate the number of shares received for a given cost
    /// Uses binary search to find the optimal number of shares
    pub fn shares_for_cost(
        quantities: &[u64],
        option_index: usize,
        cost: u64,
        liquidity_param: f64,
    ) -> Result<u64> {
        if option_index >= quantities.len() {
            return Err(ErrorCode::InvalidOption.into());
        }

        if cost == 0 {
            return Ok(0);
        }

        // Binary search for the optimal number of shares
        let mut low = 1u64;
        let mut high = cost * 10; // Conservative upper bound
        
        while low <= high {
            let mid = (low + high) / 2;
            let mid_cost = Self::buy_cost(quantities, option_index, mid, liquidity_param)?;
            
            if mid_cost == cost {
                return Ok(mid);
            } else if mid_cost < cost {
                low = mid + 1;
            } else {
                if mid == 0 {
                    return Ok(0);
                }
                high = mid - 1;
            }
        }

        // Return the best approximation
        Ok(high)
    }

    /// Calculate the cost for a given number of shares
    pub fn cost_for_shares(
        quantities: &[u64],
        option_index: usize,
        shares: u64,
        liquidity_param: f64,
    ) -> Result<u64> {
        Self::buy_cost(quantities, option_index, shares, liquidity_param)
    }

    /// Calculate the liquidity parameter from total liquidity
    pub fn liquidity_param_from_total(total_liquidity: u64) -> f64 {
        // Convert from lamports to SOL and scale appropriately
        let total_sol = total_liquidity as f64 / 1_000_000_000.0;
        total_sol * 100.0 // Scale factor for reasonable prices
    }

    /// Validate slippage tolerance
    pub fn validate_slippage(expected: u64, actual: u64, tolerance_bps: u64) -> Result<()> {
        if expected == 0 {
            return Err(ErrorCode::InvalidOption.into());
        }

        let difference = if actual > expected {
            actual - expected
        } else {
            expected - actual
        };

        let tolerance_amount = (expected * tolerance_bps) / 10000;
        
        if difference > tolerance_amount {
            return Err(ErrorCode::InvalidOption.into());
        }

        Ok(())
    }

    /// Calculate fee amount
    pub fn calculate_fee(amount: u64, fee_rate_bps: u64) -> Result<u64> {
        let fee = (amount * fee_rate_bps) / 10000;
        Ok(fee)
    }

    /// Calculate amount after fees
    pub fn amount_after_fees(amount: u64, fee_rate_bps: u64) -> Result<u64> {
        let fee = Self::calculate_fee(amount, fee_rate_bps)?;
        amount.checked_sub(fee).ok_or(ErrorCode::InvalidOption.into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cost_function() {
        let quantities = vec![1000, 1000, 1000];
        let liquidity_param = 100.0;
        let cost = LsLmsr::cost_function(&quantities, liquidity_param).unwrap();
        assert!(cost > 0);
    }

    #[test]
    fn test_price_function() {
        let quantities = vec![1000, 1000, 1000];
        let liquidity_param = 100.0;
        let price = LsLmsr::price_function(&quantities, 0, liquidity_param).unwrap();
        assert!(price > 0 && price <= 10000);
    }

    #[test]
    fn test_buy_cost() {
        let quantities = vec![1000, 1000, 1000];
        let liquidity_param = 100.0;
        let cost = LsLmsr::buy_cost(&quantities, 0, 100, liquidity_param).unwrap();
        assert!(cost > 0);
    }

    #[test]
    fn test_sell_cost() {
        let quantities = vec![1000, 1000, 1000];
        let liquidity_param = 100.0;
        let cost = LsLmsr::sell_cost(&quantities, 0, 100, liquidity_param).unwrap();
        assert!(cost > 0);
    }
} 