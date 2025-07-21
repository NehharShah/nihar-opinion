use anchor_lang::prelude::*;

/// Maximum number of options per market
pub const MAX_OPTIONS: usize = 10;

/// Maximum length for market ID string
pub const MAX_MARKET_ID_LENGTH: usize = 100;

/// Maximum length for question string
pub const MAX_QUESTION_LENGTH: usize = 500;

/// Maximum length for option string
pub const MAX_OPTION_LENGTH: usize = 200;

/// Maximum fee rate in basis points (100% = 10000)
pub const MAX_FEE_RATE: u64 = 1000; // 10%

/// Minimum fee rate in basis points
pub const MIN_FEE_RATE: u64 = 0;

/// Default liquidity parameter for LS-LMSR
pub const DEFAULT_LIQUIDITY_PARAM: f64 = 100.0;

/// Minimum liquidity required for market creation
pub const MIN_LIQUIDITY: u64 = 1_000_000; // 1 SOL in lamports

/// Maximum liquidity allowed
pub const MAX_LIQUIDITY: u64 = 1_000_000_000_000; // 1000 SOL in lamports

/// Minimum cost for buy/sell operations
pub const MIN_COST: u64 = 10_000; // 0.00001 SOL in lamports

/// Maximum cost for buy/sell operations
pub const MAX_COST: u64 = 1_000_000_000; // 1000 SOL in lamports

/// Minimum shares for buy/sell operations
pub const MIN_SHARES: u64 = 1;

/// Maximum shares for buy/sell operations
pub const MAX_SHARES: u64 = 1_000_000_000;

/// Slippage tolerance in basis points (1% = 100)
pub const SLIPPAGE_TOLERANCE: u64 = 100;

/// Minimum time difference for market end time (24 hours in seconds)
pub const MIN_MARKET_DURATION: i64 = 86400;

/// Maximum time difference for market end time (1 year in seconds)
pub const MAX_MARKET_DURATION: i64 = 31536000;

/// Program seeds
pub const PROGRAM_SEED: &[u8] = b"opinion_market";
pub const MARKET_SEED: &[u8] = b"market";
pub const POSITION_SEED: &[u8] = b"position";
pub const ADMIN_SEED: &[u8] = b"admin";
pub const FEES_SEED: &[u8] = b"fees"; 