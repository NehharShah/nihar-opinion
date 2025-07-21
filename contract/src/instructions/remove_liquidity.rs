use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<RemoveLiquidity>,
    market_id: String,
    shares: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Validate shares
    require!(
        shares >= MIN_SHARES && shares <= MAX_SHARES,
        OpinionMarketError::InvalidAmount
    );

    // Calculate amount to return based on shares proportion
    let total_shares: u64 = market.total_shares.iter().sum();
    let amount = if total_shares > 0 {
        (market.liquidity * shares) / total_shares
    } else {
        shares // If no shares exist, return the shares amount
    };

    require!(
        amount <= market.liquidity,
        OpinionMarketError::InsufficientLiquidity
    );

    // Remove liquidity from market
    market.liquidity = market.liquidity
        .checked_sub(amount)
        .ok_or(OpinionMarketError::MathOverflow)?;

    // Transfer tokens from fee account to provider
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.fee_account.to_account_info(),
            to: ctx.accounts.provider_token_account.to_account_info(),
            authority: ctx.accounts.fee_account.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, amount)?;

    msg!("Liquidity removed:");
    msg!("Market: {}", market_id);
    msg!("Shares: {}", shares);
    msg!("Amount returned: {} lamports", amount);
    msg!("Remaining liquidity: {} lamports", market.liquidity);

    Ok(())
} 