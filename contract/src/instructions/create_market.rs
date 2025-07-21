use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::utils::LsLmsr;
use crate::errors::OpinionMarketError;

pub fn handler(
    ctx: Context<CreateMarket>,
    market_id: String,
    question: String,
    options: Vec<String>,
    end_time: i64,
    liquidity: u64,
) -> Result<()> {
    // Validate market ID length
    require!(
        market_id.len() <= MAX_MARKET_ID_LENGTH,
        OpinionMarketError::MarketIdTooLong
    );

    // Validate question length
    require!(
        question.len() <= MAX_QUESTION_LENGTH,
        OpinionMarketError::QuestionTooLong
    );

    // Validate options
    require!(
        options.len() >= 2 && options.len() <= MAX_OPTIONS,
        OpinionMarketError::TooManyOptions
    );

    for option in &options {
        require!(
            option.len() <= MAX_OPTION_LENGTH,
            OpinionMarketError::OptionTooLong
        );
    }

    // Validate end time
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        end_time > current_time,
        OpinionMarketError::MarketEndTimeInPast
    );

    let duration = end_time - current_time;
    require!(
        duration >= MIN_MARKET_DURATION,
        OpinionMarketError::MarketDurationTooShort
    );
    require!(
        duration <= MAX_MARKET_DURATION,
        OpinionMarketError::MarketDurationTooLong
    );

    // Validate liquidity
    require!(
        liquidity >= ctx.accounts.admin_config.min_liquidity,
        OpinionMarketError::LiquidityTooLow
    );
    require!(
        liquidity <= MAX_LIQUIDITY,
        OpinionMarketError::LiquidityTooHigh
    );

    // Initialize market
    let market = &mut ctx.accounts.market;
    market.market_id = market_id;
    market.question = question;
    market.options = options;
    market.end_time = end_time;
    market.liquidity = liquidity;
    market.total_shares = vec![0; market.options.len()];
    market.is_resolved = false;
    market.winning_option = None;
    market.creator = ctx.accounts.creator.key();
    market.bump = ctx.bumps.market;
    market.created_at = current_time;

    msg!("Market created: {}", market.market_id);
    msg!("Question: {}", market.question);
    msg!("Options: {:?}", market.options);
    msg!("End time: {}", end_time);
    msg!("Liquidity: {} lamports", liquidity);

    Ok(())
} 