use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::utils::LsLmsr;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<BuyShares>,
    market_id: String,
    option_index: u8,
    cost: u64,
    expected_shares: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let position = &mut ctx.accounts.position;
    let admin_config = &ctx.accounts.admin_config;

    // Validate option index
    require!(
        option_index < market.options.len() as u8,
        OpinionMarketError::InvalidOptionIndex
    );

    // Validate cost
    require!(
        cost >= MIN_COST && cost <= MAX_COST,
        OpinionMarketError::CostTooHigh
    );

    // Validate expected shares
    require!(
        expected_shares >= MIN_SHARES && expected_shares <= MAX_SHARES,
        OpinionMarketError::SharesTooHigh
    );

    // Calculate liquidity parameter
    let liquidity_param = LsLmsr::liquidity_param_from_total(market.liquidity);

    // Calculate actual shares for the given cost
    let actual_shares = LsLmsr::shares_for_cost(
        &market.total_shares,
        option_index as usize,
        cost,
        liquidity_param,
    )?;

    // Validate slippage
    LsLmsr::validate_slippage(expected_shares, actual_shares, SLIPPAGE_TOLERANCE)?;

    // Calculate fee
    let fee = LsLmsr::calculate_fee(cost, admin_config.fee_rate)?;
    let cost_after_fees = cost.checked_sub(fee).ok_or(OpinionMarketError::MathOverflow)?;

    // Update market shares
    market.total_shares[option_index as usize] = market.total_shares[option_index as usize]
        .checked_add(actual_shares)
        .ok_or(OpinionMarketError::MathOverflow)?;

    // Update position
    if position.market == Pubkey::default() {
        // Initialize position
        position.market = market.key();
        position.user = ctx.accounts.buyer.key();
        position.shares = vec![0; market.options.len()];
        position.total_cost = 0;
        position.total_fees_paid = 0;
        position.has_claimed = false;
        position.bump = ctx.bumps.position;
        position.created_at = Clock::get()?.unix_timestamp;
    }

    position.shares[option_index as usize] = position.shares[option_index as usize]
        .checked_add(actual_shares)
        .ok_or(OpinionMarketError::MathOverflow)?;
    position.total_cost = position.total_cost
        .checked_add(cost)
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

    // Transfer tokens from buyer to fee account
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.fee_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, cost)?;

    msg!("Buy order executed:");
    msg!("Market: {}", market_id);
    msg!("Option: {}", option_index);
    msg!("Cost: {} lamports", cost);
    msg!("Shares received: {}", actual_shares);
    msg!("Fee paid: {} lamports", fee);
    msg!("Expected shares: {}", expected_shares);

    Ok(())
} 