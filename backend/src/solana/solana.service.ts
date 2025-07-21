import { Injectable, Logger } from '@nestjs/common';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PROGRAM_ID, connection, ADMIN_CONFIG_SEED, FEE_ACCOUNT_SEED } from './solana.config';

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);

  constructor() {}

  /**
   * Get the current program ID
   */
  getProgramId(): PublicKey {
    return PROGRAM_ID;
  }

  /**
   * Get the Solana connection
   */
  getConnection(): Connection {
    return connection;
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      this.logger.error(`Error getting balance for ${publicKey}:`, error);
      throw error;
    }
  }

  /**
   * Get admin config PDA
   */
  async getAdminConfigPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from(ADMIN_CONFIG_SEED)],
      PROGRAM_ID
    );
  }

  /**
   * Get fee account PDA
   */
  async getFeeAccountPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from(FEE_ACCOUNT_SEED)],
      PROGRAM_ID
    );
  }

  /**
   * Get market PDA
   */
  async getMarketPDA(marketId: string): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('market'), Buffer.from(marketId)],
      PROGRAM_ID
    );
  }

  /**
   * Get position PDA
   */
  async getPositionPDA(marketId: string, user: string, option: number): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from('position'),
        Buffer.from(marketId),
        new PublicKey(user).toBuffer(),
        Buffer.from([option])
      ],
      PROGRAM_ID
    );
  }

  /**
   * Validate transaction signature
   */
  async validateTransaction(signature: string): Promise<boolean> {
    try {
      const status = await connection.getSignatureStatus(signature);
      return status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized';
    } catch (error) {
      this.logger.error(`Error validating transaction ${signature}:`, error);
      return false;
    }
  }

  /**
   * Get recent transactions for an account
   */
  async getRecentTransactions(publicKey: string, limit: number = 10): Promise<any[]> {
    try {
      const pubKey = new PublicKey(publicKey);
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit });
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature);
            return {
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime,
              transaction: tx
            };
          } catch (error) {
            this.logger.warn(`Error fetching transaction ${sig.signature}:`, error);
            return null;
          }
        })
      );

      return transactions.filter(tx => tx !== null);
    } catch (error) {
      this.logger.error(`Error getting recent transactions for ${publicKey}:`, error);
      throw error;
    }
  }
} 