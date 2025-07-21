use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<CollectFees>,
    amount: u64,
) -> Result<()> {
    // Validate amount
    require!(
        amount > 0 && amount <= ctx.accounts.fee_account.total_fees,
        OpinionMarketError::InvalidAmount
    );

    // Update fee account
    ctx.accounts.fee_account.total_fees = ctx.accounts.fee_account.total_fees
        .checked_sub(amount)
        .ok_or(OpinionMarketError::MathOverflow)?;

    // Transfer fees to admin
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.fee_account.to_account_info(),
            to: ctx.accounts.admin_token_account.to_account_info(),
            authority: ctx.accounts.fee_account.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, amount)?;

    msg!("Fees collected:");
    msg!("Amount: {} lamports", amount);
    msg!("Remaining fees: {} lamports", ctx.accounts.fee_account.total_fees);

    Ok(())
} 