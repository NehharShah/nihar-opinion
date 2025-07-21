use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<AddLiquidity>,
    market_id: String,
    amount: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Validate amount
    require!(
        amount >= MIN_COST && amount <= MAX_COST,
        OpinionMarketError::InvalidAmount
    );

    // Add liquidity to market
    market.liquidity = market.liquidity
        .checked_add(amount)
        .ok_or(OpinionMarketError::MathOverflow)?;

    // Transfer tokens from provider to fee account
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.provider_token_account.to_account_info(),
            to: ctx.accounts.fee_account.to_account_info(),
            authority: ctx.accounts.provider.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, amount)?;

    msg!("Liquidity added:");
    msg!("Market: {}", market_id);
    msg!("Amount: {} lamports", amount);
    msg!("Total liquidity: {} lamports", market.liquidity);

    Ok(())
} 