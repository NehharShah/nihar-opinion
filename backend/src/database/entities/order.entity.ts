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

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('orders')
@Index(['marketId', 'user'])
@Index(['user'])
@Index(['status'])
@Index(['createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  marketId: string;

  @Column()
  user: string;

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  type: OrderType;

  @Column()
  optionIndex: number;

  @Column('bigint')
  amount: string; // Cost for buy, shares for sell

  @Column('bigint')
  expectedAmount: string; // Expected shares for buy, expected cost for sell

  @Column('bigint')
  actualAmount: string; // Actual shares received for buy, actual cost for sell

  @Column('bigint')
  fees: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  transactionSignature?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column()
  programId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Market, (market) => market.orders)
  @JoinColumn({ name: 'marketId' })
  market: Market;

  // Computed properties
  get isBuy(): boolean {
    return this.type === OrderType.BUY;
  }

  get isSell(): boolean {
    return this.type === OrderType.SELL;
  }

  get isExecuted(): boolean {
    return this.status === OrderStatus.EXECUTED;
  }

  get isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  get slippage(): number {
    if (this.expectedAmount === '0' || this.actualAmount === '0') return 0;
    
    const expected = parseInt(this.expectedAmount);
    const actual = parseInt(this.actualAmount);
    const difference = Math.abs(expected - actual);
    
    return (difference / expected) * 100;
  }

  get amountInSol(): number {
    return parseInt(this.amount) / 1_000_000_000;
  }

  get feesInSol(): number {
    return parseInt(this.fees) / 1_000_000_000;
  }
} 