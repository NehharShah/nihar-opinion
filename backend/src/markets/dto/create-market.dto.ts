import { IsString, IsArray, IsNumber, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarketDto {
  @ApiProperty({ 
    description: 'Unique market identifier',
    example: 'bitcoin-100k-2025',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  marketId: string;

  @ApiProperty({ 
    description: 'Market question - the prediction to be resolved',
    example: 'Will Bitcoin reach $100,000 by end of 2025?',
    minLength: 10,
    maxLength: 200
  })
  @IsString()
  question: string;

  @ApiProperty({ 
    description: 'Market options (2-10 choices for binary/multiple choice)',
    example: ['Yes', 'No'],
    type: [String],
    minItems: 2,
    maxItems: 10
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ 
    description: 'Market end time (Unix timestamp) - must be at least 24 hours in future',
    example: 1735689599,
    minimum: Date.now() / 1000 + 86400
  })
  @IsNumber()
  @Min(Date.now() / 1000 + 86400) // At least 24 hours from now
  endTime: number;

  @ApiProperty({ 
    description: 'Initial liquidity in lamports (1 SOL = 1,000,000,000 lamports)',
    example: 1000000000,
    minimum: 1000000
  })
  @IsNumber()
  @Min(1000000) // 0.001 SOL
  liquidity: number;

  @ApiProperty({ 
    description: 'Creator wallet address (Solana public key)',
    example: '11111111111111111111111111111112',
    minLength: 32,
    maxLength: 44
  })
  @IsString()
  creator: string;

  @ApiProperty({ 
    description: 'Smart contract program ID on Solana devnet',
    example: 'kbw7VTqhEDFctqGzSF5zZB3ux66amS5mEM88PyyY5s5',
    minLength: 32,
    maxLength: 44
  })
  @IsString()
  programId: string;

  @ApiProperty({ 
    description: 'Account bump seed for PDA generation',
    example: 255,
    minimum: 0,
    maximum: 255
  })
  @IsNumber()
  bump: number;
} 