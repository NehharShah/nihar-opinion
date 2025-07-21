use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<ResolveMarket>,
    market_id: String,
    winning_option: u8,
) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Validate winning option
    require!(
        winning_option < market.options.len() as u8,
        OpinionMarketError::InvalidWinningOption
    );

    // Resolve the market
    market.is_resolved = true;
    market.winning_option = Some(winning_option);

    msg!("Market resolved: {}", market_id);
    msg!("Winning option: {} - {}", winning_option, market.options[winning_option as usize]);

    Ok(())
} 