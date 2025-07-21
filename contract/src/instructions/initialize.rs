use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<Initialize>,
    admin: Pubkey,
    fee_rate: u64,
    min_liquidity: u64,
) -> Result<()> {
    // Validate fee rate
    require!(
        fee_rate >= MIN_FEE_RATE && fee_rate <= MAX_FEE_RATE,
        OpinionMarketError::InvalidFeeRate
    );

    // Validate minimum liquidity
    require!(
        min_liquidity >= MIN_LIQUIDITY,
        OpinionMarketError::LiquidityTooLow
    );

    // Initialize admin config
    let admin_config = &mut ctx.accounts.admin_config;
    admin_config.admin = admin;
    admin_config.fee_rate = fee_rate;
    admin_config.min_liquidity = min_liquidity;
    admin_config.total_fees_collected = 0;
    admin_config.bump = ctx.bumps.admin_config;

    // Initialize fee account
    let fee_account = &mut ctx.accounts.fee_account;
    fee_account.authority = admin;
    fee_account.total_fees = 0;
    fee_account.bump = ctx.bumps.fee_account;

    msg!("Program initialized with admin: {}", admin);
    msg!("Fee rate: {} basis points", fee_rate);
    msg!("Minimum liquidity: {} lamports", min_liquidity);

    Ok(())
} 