import { expect } from 'chai';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { OpinionMarket } from '../../contract/target/types/opinion_market';

describe('Opinion Market Integration Tests', () => {
  let connection: Connection;
  let program: Program<OpinionMarket>;
  let provider: AnchorProvider;
  let admin: Keypair;
  let user1: Keypair;
  let user2: Keypair;

  before(async () => {
    // Setup connection to devnet
    connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Create keypairs
    admin = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // Setup provider
    provider = new AnchorProvider(
      connection,
      new MockWallet(admin),
      { commitment: 'confirmed' }
    );

    // Load program
    const programId = new PublicKey('2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h');
    program = new Program(IDL, programId, provider);
  });

  describe('Program Initialization', () => {
    it('should initialize the program with admin configuration', async () => {
      const adminConfig = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin')],
        program.programId
      )[0];

      const feeAccount = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('fees')],
        program.programId
      )[0];

      await program.methods
        .initialize(admin.publicKey, 100, 1000000) // 1% fee, 1 SOL min liquidity
        .accounts({
          payer: admin.publicKey,
          adminConfig,
          feeAccount,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.adminConfig.fetch(adminConfig);
      expect(config.admin.toString()).to.equal(admin.publicKey.toString());
      expect(config.feeRate.toNumber()).to.equal(100);
      expect(config.minLiquidity.toNumber()).to.equal(1000000);
    });
  });

  describe('Market Creation', () => {
    it('should create a new market', async () => {
      const marketId = 'test-market-1';
      const question = 'Will Bitcoin reach $100k by end of 2024?';
      const options = ['Yes', 'No'];
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      const liquidity = 10000000; // 10 SOL

      const market = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('market'), Buffer.from(marketId)],
        program.programId
      )[0];

      const adminConfig = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin')],
        program.programId
      )[0];

      await program.methods
        .createMarket(marketId, question, options, new BN(endTime), new BN(liquidity))
        .accounts({
          creator: admin.publicKey,
          market,
          adminConfig,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const marketAccount = await program.account.market.fetch(market);
      expect(marketAccount.marketId).to.equal(marketId);
      expect(marketAccount.question).to.equal(question);
      expect(marketAccount.options).to.deep.equal(options);
      expect(marketAccount.endTime.toNumber()).to.equal(endTime);
      expect(marketAccount.liquidity.toNumber()).to.equal(liquidity);
      expect(marketAccount.isResolved).to.be.false;
    });
  });

  describe('Buy/Sell Operations', () => {
    let market: web3.PublicKey;
    let marketId: string;

    beforeEach(async () => {
      marketId = 'test-market-2';
      market = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('market'), Buffer.from(marketId)],
        program.programId
      )[0];

      // Create market first
      const question = 'Will Ethereum 2.0 launch in 2024?';
      const options = ['Yes', 'No'];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const liquidity = 10000000;

      const adminConfig = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin')],
        program.programId
      )[0];

      await program.methods
        .createMarket(marketId, question, options, new BN(endTime), new BN(liquidity))
        .accounts({
          creator: admin.publicKey,
          market,
          adminConfig,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();
    });

    it('should allow buying shares', async () => {
      const optionIndex = 0; // Yes
      const cost = 1000000; // 1 SOL
      const expectedShares = 1000;

      const position = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('position'), market.toBuffer(), user1.publicKey.toBuffer()],
        program.programId
      )[0];

      const feeAccount = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('fees')],
        program.programId
      )[0];

      const adminConfig = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin')],
        program.programId
      )[0];

      await program.methods
        .buyShares(marketId, optionIndex, new BN(cost), new BN(expectedShares))
        .accounts({
          buyer: user1.publicKey,
          market,
          position,
          buyerTokenAccount: user1.publicKey,
          feeAccount,
          adminConfig,
          tokenProgram: web3.TokenProgram.programId,
          systemProgram: web3.SystemProgram.programId,
          associatedTokenProgram: web3.AssociatedTokenProgram.programId,
        })
        .signers([user1])
        .rpc();

      const positionAccount = await program.account.position.fetch(position);
      expect(positionAccount.shares[optionIndex].toNumber()).to.be.greaterThan(0);
      expect(positionAccount.totalCost.toNumber()).to.equal(cost);
    });

    it('should allow selling shares', async () => {
      // First buy some shares
      const optionIndex = 0;
      const buyCost = 1000000;
      const expectedShares = 1000;

      const position = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('position'), market.toBuffer(), user1.publicKey.toBuffer()],
        program.programId
      )[0];

      const feeAccount = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('fees')],
        program.programId
      )[0];

      const adminConfig = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin')],
        program.programId
      )[0];

      await program.methods
        .buyShares(marketId, optionIndex, new BN(buyCost), new BN(expectedShares))
        .accounts({
          buyer: user1.publicKey,
          market,
          position,
          buyerTokenAccount: user1.publicKey,
          feeAccount,
          adminConfig,
          tokenProgram: web3.TokenProgram.programId,
          systemProgram: web3.SystemProgram.programId,
          associatedTokenProgram: web3.AssociatedTokenProgram.programId,
        })
        .signers([user1])
        .rpc();

      // Now sell some shares
      const sellShares = 500;
      const expectedCost = 500000;

      await program.methods
        .sellShares(marketId, optionIndex, new BN(sellShares), new BN(expectedCost))
        .accounts({
          seller: user1.publicKey,
          market,
          position,
          sellerTokenAccount: user1.publicKey,
          feeAccount,
          adminConfig,
          tokenProgram: web3.TokenProgram.programId,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const positionAccount = await program.account.position.fetch(position);
      expect(positionAccount.shares[optionIndex.toNumber()]).to.be.lessThan(expectedShares);
    });
  });

  describe('Market Resolution', () => {
    it('should allow admin to resolve market', async () => {
      const marketId = 'test-market-3';
      const market = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('market'), Buffer.from(marketId)],
        program.programId
      )[0];

      // Create market first
      const question = 'Will Solana reach $200 in 2024?';
      const options = ['Yes', 'No'];
      const endTime = Math.floor(Date.now() / 1000) + 86400;
      const liquidity = 10000000;

      const adminConfig = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin')],
        program.programId
      )[0];

      await program.methods
        .createMarket(marketId, question, options, new BN(endTime), new BN(liquidity))
        .accounts({
          creator: admin.publicKey,
          market,
          adminConfig,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      // Resolve market
      const winningOption = 0; // Yes

      await program.methods
        .resolveMarket(marketId, winningOption)
        .accounts({
          admin: admin.publicKey,
          market,
          adminConfig,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const marketAccount = await program.account.market.fetch(market);
      expect(marketAccount.isResolved).to.be.true;
      expect(marketAccount.winningOption).to.equal(winningOption);
    });
  });
});

// Mock wallet for testing
class MockWallet implements web3.Signer {
  constructor(private keypair: Keypair) {}

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  async signTransaction(tx: web3.Transaction): Promise<web3.Transaction> {
    tx.partialSign(this.keypair);
    return tx;
  }

  async signAllTransactions(txs: web3.Transaction[]): Promise<web3.Transaction[]> {
    return txs.map(tx => {
      tx.partialSign(this.keypair);
      return tx;
    });
  }
}

// Import BN from anchor
import { BN } from '@project-serum/anchor';
import { IDL } from '../../contract/target/types/opinion_market'; 