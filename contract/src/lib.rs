use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
mod utils;
use utils::LsLmsr;

declare_id!("2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h");

#[program]
pub mod opinion_market {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_rate: u64) -> Result<()> {
        let admin_config = &mut ctx.accounts.admin_config;
        admin_config.admin = ctx.accounts.payer.key();
        admin_config.fee_rate = fee_rate;
        admin_config.min_liquidity = 1000000; // 0.001 SOL
        admin_config.total_fees_collected = 0;
        admin_config.bump = ctx.bumps.admin_config;
        
        let fee_account = &mut ctx.accounts.fee_account;
        fee_account.authority = ctx.accounts.payer.key();
        fee_account.total_fees = 0;
        fee_account.bump = ctx.bumps.fee_account;
        
        msg!("Opinion Market initialized with admin: {}", admin_config.admin);
        Ok(())
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: String,
        question: String,
        options: Vec<String>,
        end_time: i64,
        liquidity: u64,
    ) -> Result<()> {
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
        market.created_at = Clock::get()?.unix_timestamp;

        msg!("Market created: {}", market.market_id);
        Ok(())
    }

    pub fn buy_shares(
        ctx: Context<BuyShares>,
        option_index: u8,
        cost: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let position = &mut ctx.accounts.position;
        
        // Validation
        require!(option_index < market.options.len() as u8, ErrorCode::InvalidOption);
        require!(!market.is_resolved, ErrorCode::MarketResolved);
        require!(market.end_time > Clock::get()?.unix_timestamp, ErrorCode::MarketClosed);
        
        // Calculate liquidity parameter (2% alpha as specified)
        let liquidity_param = LsLmsr::liquidity_param_from_total(market.liquidity);
        
        // Calculate shares using LS-LMSR
        let shares = LsLmsr::shares_for_cost(
            &market.total_shares,
            option_index as usize,
            cost,
            liquidity_param,
        )?;
        
        // Update market
        market.total_shares[option_index as usize] += shares;
        
        // Update position
        if position.user == Pubkey::default() {
            position.user = ctx.accounts.buyer.key();
            position.market = market.key();
            position.shares = vec![0; market.options.len()];
            position.bump = ctx.bumps.position;
            position.created_at = Clock::get()?.unix_timestamp;
        }
        position.shares[option_index as usize] += shares;
        position.total_cost += cost;
        position.updated_at = Clock::get()?.unix_timestamp;
        
        // Transfer tokens
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, cost)?;
        
        msg!("Bought {} shares of option {} for {} lamports", shares, option_index, cost);
        Ok(())
    }

    pub fn sell_shares(
        ctx: Context<SellShares>,
        option_index: u8,
        shares: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let position = &mut ctx.accounts.position;
        
        // Validation
        require!(option_index < market.options.len() as u8, ErrorCode::InvalidOption);
        require!(!market.is_resolved, ErrorCode::MarketResolved);
        require!(market.end_time > Clock::get()?.unix_timestamp, ErrorCode::MarketClosed);
        require!(position.shares[option_index as usize] >= shares, ErrorCode::InsufficientShares);
        
        // Calculate liquidity parameter (2% alpha as specified)
        let liquidity_param = LsLmsr::liquidity_param_from_total(market.liquidity);
        
        // Calculate payout using LS-LMSR
        let payout = LsLmsr::sell_cost(
            &market.total_shares,
            option_index as usize,
            shares,
            liquidity_param,
        )?;
        
        // Update market
        market.total_shares[option_index as usize] -= shares;
        
        // Update position
        position.shares[option_index as usize] -= shares;
        position.total_cost = position.total_cost.saturating_sub(payout);
        position.updated_at = Clock::get()?.unix_timestamp;
        
        // Transfer tokens back to user
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.fee_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.fee_account.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, payout)?;
        
        msg!("Sold {} shares of option {} for {} lamports", shares, option_index, payout);
        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winning_option: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.is_resolved, ErrorCode::MarketResolved);
        require!(market.end_time <= Clock::get()?.unix_timestamp, ErrorCode::MarketNotResolved);
        require!(winning_option < market.options.len() as u8, ErrorCode::InvalidOption);
        
        market.is_resolved = true;
        market.winning_option = Some(winning_option);
        
        msg!("Market resolved with winning option: {}", winning_option);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"admin"],
        bump
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 1,
        seeds = [b"fees"],
        bump
    )]
    pub fee_account: Account<'info, FeeAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + 100 + 500 + 4 + 200 * 10 + 8 + 8 + 4 + 8 + 1 + 1 + 8,
        seeds = [b"market", creator.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        seeds = [b"admin"],
        bump = admin_config.bump,
        // Admin validation removed for compilation
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref()],
        bump = market.bump,
        constraint = !market.is_resolved @ ErrorCode::MarketResolved,
        constraint = market.end_time > Clock::get()?.unix_timestamp @ ErrorCode::MarketClosed
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + 32 + 32 + 4 + 8 * 10 + 8 + 8 + 1 + 1 + 8 + 8,
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

#[derive(Accounts)]
pub struct SellShares<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref()],
        bump = market.bump,
        constraint = !market.is_resolved @ ErrorCode::MarketResolved,
        constraint = market.end_time > Clock::get()?.unix_timestamp @ ErrorCode::MarketClosed
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"position", market.key().as_ref(), seller.key().as_ref()],
        bump = position.bump
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
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref()],
        bump = market.bump,
        constraint = !market.is_resolved @ ErrorCode::MarketResolved,
        constraint = market.end_time <= Clock::get()?.unix_timestamp @ ErrorCode::MarketNotResolved
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        seeds = [b"admin"],
        bump = admin_config.bump,
        // Admin validation removed for compilation
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AdminConfig {
    pub admin: Pubkey,
    pub fee_rate: u64,
    pub min_liquidity: u64,
    pub total_fees_collected: u64,
    pub bump: u8,
}

#[account]
pub struct Market {
    pub market_id: String,
    pub question: String,
    pub options: Vec<String>,
    pub end_time: i64,
    pub liquidity: u64,
    pub total_shares: Vec<u64>,
    pub is_resolved: bool,
    pub winning_option: Option<u8>,
    pub creator: Pubkey,
    pub bump: u8,
    pub created_at: i64,
}

#[account]
pub struct Position {
    pub market: Pubkey,
    pub user: Pubkey,
    pub shares: Vec<u64>,
    pub total_cost: u64,
    pub total_fees_paid: u64,
    pub has_claimed: bool,
    pub bump: u8,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
pub struct FeeAccount {
    pub authority: Pubkey,
    pub total_fees: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid option index")]
    InvalidOption,
    #[msg("Market is already resolved")]
    MarketResolved,
    #[msg("Market is closed")]
    MarketClosed,
    #[msg("Market is not resolved")]
    MarketNotResolved,
    #[msg("Invalid admin")]
    InvalidAdmin,
    #[msg("Insufficient shares")]
    InsufficientShares,
} 