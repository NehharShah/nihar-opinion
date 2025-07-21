use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::errors::OpinionMarketError;

/// Program admin configuration
#[account]
pub struct AdminConfig {
    pub admin: Pubkey,
    pub fee_rate: u64, // Fee rate in basis points (e.g., 100 = 1%)
    pub min_liquidity: u64,
    pub total_fees_collected: u64,
    pub bump: u8,
}

impl AdminConfig {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 1;
}

/// Market state
#[account]
pub struct Market {
    pub market_id: String,
    pub question: String,
    pub options: Vec<String>,
    pub end_time: i64,
    pub liquidity: u64,
    pub total_shares: Vec<u64>, // Shares for each option
    pub is_resolved: bool,
    pub winning_option: Option<u8>,
    pub creator: Pubkey,
    pub bump: u8,
    pub created_at: i64,
}

impl Market {
    pub const LEN: usize = 8 + 100 + 500 + 4 + 200 * 10 + 8 + 8 + 4 + 8 + 1 + 1 + 8;
}

/// User position in a market
#[account]
pub struct Position {
    pub market: Pubkey,
    pub user: Pubkey,
    pub shares: Vec<u64>, // Shares for each option
    pub total_cost: u64,
    pub total_fees_paid: u64,
    pub has_claimed: bool,
    pub bump: u8,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Position {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 8 * 10 + 8 + 8 + 1 + 1 + 8 + 8;
}

/// Fee collection account
#[account]
pub struct FeeAccount {
    pub authority: Pubkey,
    pub total_fees: u64,
    pub bump: u8,
}

impl FeeAccount {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}

/// Initialize context
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = AdminConfig::LEN,
        seeds = [b"admin"],
        bump
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    #[account(
        init,
        payer = payer,
        space = FeeAccount::LEN,
        seeds = [b"fees"],
        bump
    )]
    pub fee_account: Account<'info, FeeAccount>,
    
    pub system_program: Program<'info, System>,
}

/// Market creation context
#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// Market ID parameter
    pub market_id: String,
    
    #[account(
        init,
        payer = creator,
        space = Market::LEN,
        seeds = [b"market", market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        seeds = [b"admin"],
        bump = admin_config.bump,
        has_one = creator @ OpinionMarketError::InvalidAdmin
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

/// Buy shares context
#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// Market ID parameter
    pub market_id: String,
    
    #[account(
        mut,
        seeds = [b"market", market_id.as_bytes()],
        bump = market.bump,
        constraint = !market.is_resolved @ OpinionMarketError::MarketResolved,
        constraint = market.end_time > Clock::get()?.unix_timestamp @ OpinionMarketError::MarketClosed
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = Position::LEN,
        seeds = [b"position", market.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    
    #[account(
        mut,
        associated_token::mint = spl_token::native_mint::ID,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"fees"],
        bump = fee_account.bump
    )]
    pub fee_account: Account<'info, FeeAccount>,
    
    #[account(
        seeds = [b"admin"],
        bump = admin_config.bump
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
}

/// Sell shares context
#[derive(Accounts)]
pub struct SellShares<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    /// Market ID parameter
    pub market_id: String,
    
    #[account(
        mut,
        seeds = [b"market", market_id.as_bytes()],
        bump = market.bump,
        constraint = !market.is_resolved @ OpinionMarketError::MarketResolved,
        constraint = market.end_time > Clock::get()?.unix_timestamp @ OpinionMarketError::MarketClosed
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"position", market.key().as_ref(), seller.key().as_ref()],
        bump = position.bump,
        has_one = user @ OpinionMarketError::Unauthorized
    )]
    pub position: Account<'info, Position>,
    
    #[account(
        mut,
        associated_token::mint = spl_token::native_mint::ID,
        associated_token::authority = seller
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"fees"],
        bump = fee_account.bump
    )]
    pub fee_account: Account<'info, FeeAccount>,
    
    #[account(
        seeds = [b"admin"],
        bump = admin_config.bump
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Resolve market context
#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// Market ID parameter
    pub market_id: String,
    
    #[account(
        mut,
        seeds = [b"market", market_id.as_bytes()],
        bump = market.bump,
        constraint = !market.is_resolved @ OpinionMarketError::MarketResolved,
        constraint = market.end_time <= Clock::get()?.unix_timestamp @ OpinionMarketError::MarketNotResolved
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        seeds = [b"admin"],
        bump = admin_config.bump,
        has_one = admin @ OpinionMarketError::InvalidAdmin
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

/// Claim winnings context
#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// Market ID parameter
    pub market_id: String,
    
    #[account(
        mut,
        seeds = [b"market", market_id.as_bytes()],
        bump = market.bump,
        constraint = market.is_resolved @ OpinionMarketError::MarketNotResolved
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"position", market.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        has_one = user @ OpinionMarketError::Unauthorized,
        constraint = !position.has_claimed @ OpinionMarketError::AlreadyClaimed
    )]
    pub position: Account<'info, Position>,
    
    #[account(
        mut,
        associated_token::mint = spl_token::native_mint::ID,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"fees"],
        bump = fee_account.bump
    )]
    pub fee_account: Account<'info, FeeAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
} 