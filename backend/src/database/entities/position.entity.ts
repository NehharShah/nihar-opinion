import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Market } from './market.entity';

@Entity('positions')
@Index(['marketId', 'user'])
@Index(['user'])
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  marketId: string;

  @Column()
  user: string;

  @Column('simple-array')
  shares: string[];

  @Column('bigint')
  totalCost: string;

  @Column('bigint')
  totalFeesPaid: string;

  @Column({ default: false })
  hasClaimed: boolean;

  @Column()
  programId: string;

  @Column()
  bump: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Market, (market) => market.positions)
  @JoinColumn({ name: 'marketId' })
  market: Market;

  // Computed properties
  get totalShares(): number {
    return this.shares.reduce((sum, shares) => sum + parseInt(shares), 0);
  }

  get hasWinningShares(): boolean {
    if (!this.market?.isResolved || this.market.winningOption === undefined) {
      return false;
    }
    return parseInt(this.shares[this.market.winningOption]) > 0;
  }

  get winningShares(): number {
    if (!this.market?.isResolved || this.market.winningOption === undefined) {
      return 0;
    }
    return parseInt(this.shares[this.market.winningOption]);
  }

  get estimatedWinnings(): number {
    if (!this.hasWinningShares) return 0;
    
    const winningShares = this.winningShares;
    const totalWinningShares = parseInt(this.market.totalShares[this.market.winningOption]);
    const totalMarketValue = parseInt(this.market.liquidity);
    
    if (totalWinningShares === 0) return 0;
    return (totalMarketValue * winningShares) / totalWinningShares;
  }
} 