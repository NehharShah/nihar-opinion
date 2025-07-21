use anchor_lang::prelude::*;

#[error_code]
pub enum OpinionMarketError {
    #[msg("Market ID is too long")]
    MarketIdTooLong,
    
    #[msg("Question is too long")]
    QuestionTooLong,
    
    #[msg("Option text is too long")]
    OptionTooLong,
    
    #[msg("Too many options for this market")]
    TooManyOptions,
    
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    
    #[msg("Market not found")]
    MarketNotFound,
    
    #[msg("Market already exists")]
    MarketAlreadyExists,
    
    #[msg("Market is closed")]
    MarketClosed,
    
    #[msg("Market is resolved")]
    MarketResolved,
    
    #[msg("Market is not resolved")]
    MarketNotResolved,
    
    #[msg("Invalid end time")]
    InvalidEndTime,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Liquidity too low")]
    LiquidityTooLow,
    
    #[msg("Liquidity too high")]
    LiquidityTooHigh,
    
    #[msg("Cost too low")]
    CostTooLow,
    
    #[msg("Cost too high")]
    CostTooHigh,
    
    #[msg("Shares too low")]
    SharesTooLow,
    
    #[msg("Shares too high")]
    SharesTooHigh,
    
    #[msg("Insufficient shares")]
    InsufficientShares,
    
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid admin")]
    InvalidAdmin,
    
    #[msg("Position not found")]
    PositionNotFound,
    
    #[msg("Invalid winning option")]
    InvalidWinningOption,
    
    #[msg("No winnings to claim")]
    NoWinningsToClaim,
    
    #[msg("Already claimed")]
    AlreadyClaimed,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Invalid calculation")]
    InvalidCalculation,
    
    #[msg("Market end time must be in the future")]
    MarketEndTimeInPast,
    
    #[msg("Market duration too short")]
    MarketDurationTooShort,
    
    #[msg("Market duration too long")]
    MarketDurationTooLong,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    
    #[msg("Invalid mint")]
    InvalidMint,
    
    #[msg("Invalid authority")]
    InvalidAuthority,
    
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Invalid program state")]
    InvalidProgramState,
    
    #[msg("Operation not allowed")]
    OperationNotAllowed,
    
    #[msg("Invalid parameters")]
    InvalidParameters,
    
    #[msg("Price calculation failed")]
    PriceCalculationFailed,
    
    #[msg("Liquidity calculation failed")]
    LiquidityCalculationFailed,
    
    #[msg("Cost calculation failed")]
    CostCalculationFailed,
    
    #[msg("Shares calculation failed")]
    SharesCalculationFailed,
} 