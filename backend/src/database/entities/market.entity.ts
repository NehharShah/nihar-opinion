import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Position } from './position.entity';
import { Order } from './order.entity';

@Entity('markets')
@Index(['marketId'], { unique: true })
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  marketId: string;

  @Column()
  question: string;

  @Column('simple-array')
  options: string[];

  @Column('bigint')
  endTime: number;

  @Column('bigint')
  liquidity: string;

  @Column('simple-array')
  totalShares: string[];

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true })
  winningOption?: number;

  @Column()
  creator: string;

  @Column()
  programId: string;

  @Column()
  bump: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Position, (position) => position.market)
  positions: Position[];

  @OneToMany(() => Order, (order) => order.market)
  orders: Order[];

  // Computed properties
  get isActive(): boolean {
    return !this.isResolved && this.endTime > Date.now() / 1000;
  }

  get isClosed(): boolean {
    return this.endTime <= Date.now() / 1000;
  }

  get totalSharesSum(): number {
    return this.totalShares.reduce((sum, shares) => sum + parseInt(shares), 0);
  }

  get prices(): number[] {
    // Calculate current prices using LS-LMSR
    const liquidityParam = this.getLiquidityParam();
    return this.options.map((_, index) => {
      const shares = this.totalShares.map(s => parseInt(s));
      return this.calculatePrice(shares, index, liquidityParam);
    });
  }

  private getLiquidityParam(): number {
    const totalSol = parseInt(this.liquidity) / 1_000_000_000;
    return totalSol * 100;
  }

  private calculatePrice(quantities: number[], optionIndex: number, liquidityParam: number): number {
    if (quantities.length === 0) return 0;

    let sumExp = 0;
    for (const q of quantities) {
      sumExp += Math.exp(q / liquidityParam);
    }

    const optionQ = quantities[optionIndex];
    const optionExp = Math.exp(optionQ / liquidityParam);
    const price = optionExp / sumExp;

    return Math.round(price * 10000); // Convert to basis points
  }
} 