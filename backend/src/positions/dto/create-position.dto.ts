import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Market identifier',
    example: 'bitcoin-100k-2025'
  })
  @IsString()
  marketId: string;

  @ApiProperty({
    description: 'Solana wallet address of the position holder',
    example: '11111111111111111111111111111112'
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'Array of shares held for each option (in lamports)',
    example: ['1000000000', '0'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  shares: string[];

  @ApiProperty({
    description: 'Total cost of the position (in lamports)',
    example: '450000000'
  })
  @IsString()
  totalCost: string;

  @ApiProperty({
    description: 'Total fees paid for this position (in lamports)',
    example: '9000000',
    required: false
  })
  @IsOptional()
  @IsString()
  totalFeesPaid?: string;

  @ApiProperty({
    description: 'Program ID of the smart contract',
    example: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h'
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: 'PDA bump seed',
    example: 255,
    minimum: 0,
    maximum: 255
  })
  @IsNumber()
  @Min(0)
  bump: number;
}
