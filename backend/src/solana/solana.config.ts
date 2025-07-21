import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Solana Program ID (deployed on devnet)
export const PROGRAM_ID = new PublicKey('JChzkJVqVwCBcUpKpGQN7mj6EkWo1TjMNHyVCTV6PjcN');

// Solana Cluster Configuration
export const CLUSTER = 'devnet';
export const ENDPOINT = clusterApiUrl(CLUSTER);

// Create connection instance
export const connection = new Connection(ENDPOINT, 'confirmed');

// Program Derived Addresses (PDAs)
export const ADMIN_CONFIG_SEED = 'admin_config';
export const FEE_ACCOUNT_SEED = 'fee_account';

// Market configuration
export const DEFAULT_FEE_RATE = 500; // 5% (500 basis points)
export const MIN_LIQUIDITY = 1000000; // 1 SOL in lamports 