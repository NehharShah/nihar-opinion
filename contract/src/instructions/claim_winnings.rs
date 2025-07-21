use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::utils::LsLmsr;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<ClaimWinnings>,
    market_id: String,
) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.position;

    // Check if user has shares in the winning option
    let winning_option = market.winning_option.ok_or(OpinionMarketError::MarketNotResolved)?;
    let winning_shares = position.shares[winning_option as usize];

    require!(
        winning_shares > 0,
        OpinionMarketError::NoWinningsToClaim
    );

    // Calculate winnings based on total market shares and user's winning shares
    let total_winning_shares = market.total_shares[winning_option as usize];
    let total_market_value = market.liquidity; // Simplified: use initial liquidity as total value
    
    let winnings = if total_winning_shares > 0 {
        (total_market_value * winning_shares) / total_winning_shares
    } else {
        0
    };

    require!(
        winnings > 0,
        OpinionMarketError::NoWinningsToClaim
    );

    // Mark position as claimed
    position.has_claimed = true;

    // Transfer winnings to user
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.fee_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.fee_account.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, winnings)?;

    msg!("Winnings claimed:");
    msg!("Market: {}", market_id);
    msg!("Winning option: {}", winning_option);
    msg!("Winning shares: {}", winning_shares);
    msg!("Winnings: {} lamports", winnings);

    Ok(())
} 