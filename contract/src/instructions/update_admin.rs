use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<UpdateAdmin>,
    new_admin: Pubkey,
    new_fee_rate: u64,
) -> Result<()> {
    let admin_config = &mut ctx.accounts.admin_config;

    // Validate new fee rate
    require!(
        new_fee_rate >= MIN_FEE_RATE && new_fee_rate <= MAX_FEE_RATE,
        OpinionMarketError::InvalidFeeRate
    );

    // Update admin configuration
    admin_config.admin = new_admin;
    admin_config.fee_rate = new_fee_rate;

    msg!("Admin configuration updated:");
    msg!("New admin: {}", new_admin);
    msg!("New fee rate: {} basis points", new_fee_rate);

    Ok(())
} 