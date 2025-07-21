use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::utils::LsLmsr;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<SellShares>,
    market_id: String,
    option_index: u8,
    shares: u64,
    expected_cost: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let position = &mut ctx.accounts.position;
    let admin_config = &ctx.accounts.admin_config;

    // Validate option index
    require!(
        option_index < market.options.len() as u8,
        OpinionMarketError::InvalidOptionIndex
    );

    // Validate shares
    require!(
        shares >= MIN_SHARES && shares <= MAX_SHARES,
        OpinionMarketError::SharesTooHigh
    );

    // Check if user has enough shares
    require!(
        position.shares[option_index as usize] >= shares,
        OpinionMarketError::InsufficientShares
    );

    // Calculate liquidity parameter
    let liquidity_param = LsLmsr::liquidity_param_from_total(market.liquidity);

    // Calculate actual cost for selling shares
    let actual_cost = LsLmsr::sell_cost(
        &market.total_shares,
        option_index as usize,
        shares,
        liquidity_param,
    )?;

    // Validate slippage
    LsLmsr::validate_slippage(expected_cost, actual_cost, SLIPPAGE_TOLERANCE)?;

    // Calculate fee
    let fee = LsLmsr::calculate_fee(actual_cost, admin_config.fee_rate)?;
    let cost_after_fees = actual_cost.checked_sub(fee).ok_or(OpinionMarketError::MathOverflow)?;

    // Update market shares
    market.total_shares[option_index as usize] = market.total_shares[option_index as usize]
        .checked_sub(shares)
        .ok_or(OpinionMarketError::MathOverflow)?;

    // Update position
    position.shares[option_index as usize] = position.shares[option_index as usize]
        .checked_sub(shares)
        .ok_or(OpinionMarketError::MathOverflow)?;
    position.total_cost = position.total_cost
        .checked_sub(actual_cost)
        .ok_or(OpinionMarketError::MathOverflow)?;
    position.total_fees_paid = position.total_fees_paid
        .checked_add(fee)
        .ok_or(OpinionMarketError::MathOverflow)?;
    position.updated_at = Clock::get()?.unix_timestamp;

    // Update fee account
    let fee_account = &mut ctx.accounts.fee_account;
    fee_account.total_fees = fee_account.total_fees
        .checked_add(fee)
        .ok_or(OpinionMarketError::MathOverflow)?;

    // Transfer tokens from fee account to seller
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.fee_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.fee_account.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, cost_after_fees)?;

    msg!("Sell order executed:");
    msg!("Market: {}", market_id);
    msg!("Option: {}", option_index);
    msg!("Shares sold: {}", shares);
    msg!("Cost received: {} lamports", cost_after_fees);
    msg!("Fee paid: {} lamports", fee);
    msg!("Expected cost: {} lamports", expected_cost);

    Ok(())
} 