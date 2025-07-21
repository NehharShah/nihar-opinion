import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Market identifier',
    example: 'bitcoin-100k-2025'
  })
  @IsString()
  marketId: string;

  @ApiProperty({
    description: 'Solana wallet address of the order creator',
    example: '11111111111111111111111111111112'
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'Type of order',
    enum: OrderType,
    example: OrderType.BUY
  })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({
    description: 'Option index (0 for YES, 1 for NO)',
    example: 0,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  optionIndex: number;

  @ApiProperty({
    description: 'Amount - cost for buy orders, shares for sell orders (in lamports)',
    example: '450000000'
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: 'Expected amount - expected shares for buy, expected cost for sell (in lamports)',
    example: '1000000000'
  })
  @IsString()
  expectedAmount: string;

  @ApiProperty({
    description: 'Actual amount received/paid (in lamports)',
    example: '0',
    required: false
  })
  @IsOptional()
  @IsString()
  actualAmount?: string;

  @ApiProperty({
    description: 'Fees paid for this order (in lamports)',
    example: '9000000',
    required: false
  })
  @IsOptional()
  @IsString()
  fees?: string;

  @ApiProperty({
    description: 'Transaction signature on Solana',
    example: '5j7s1QzqC9JoyT1accuUUMQDvE7oKy7fU6Z8gF4qW2v9vQf3hE8rN6mK9pL4sT2wX1yA3bC5dE7fG8hI9jK0lM2nO3pQ4r',
    required: false
  })
  @IsOptional()
  @IsString()
  transactionSignature?: string;

  @ApiProperty({
    description: 'Program ID of the smart contract',
    example: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h'
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    required: false
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
