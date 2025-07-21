import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { Market } from '../database/entities/market.entity';

@ApiTags('markets')
@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for markets service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'markets-api',
    };
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new prediction market',
    description: 'Creates a new prediction market with LS-LMSR AMM integration on Solana devnet. The market will be deployed to the smart contract and indexed in the backend database.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Market created successfully with smart contract integration',
    type: Market,
    example: {
      id: '1753122701188',
      marketId: 'bitcoin-100k-2025',
      question: 'Will Bitcoin reach $100,000 by end of 2025?',
      options: ['Yes', 'No'],
      endTime: 1735689599,
      liquidity: 1000000000,
      creator: '11111111111111111111111111111112',
      programId: 'kbw7VTqhEDFctqGzSF5zZB3ux66amS5mEM88PyyY5s5',
      bump: 255,
      totalShares: ['0', '0'],
      createdAt: '2025-07-21T18:31:41.188Z',
      isResolved: false
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    example: {
      message: ['marketId must be a string', 'endTime must not be less than current time + 24h'],
      error: 'Bad Request',
      statusCode: 400
    }
  })
  create(@Body() createMarketDto: CreateMarketDto) {
    return this.marketsService.create(createMarketDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all prediction markets',
    description: 'Retrieves all prediction markets from the database. Use ?active=true to filter only active markets.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all markets with smart contract integration',
    type: [Market],
    example: [
      {
        id: '1753122701188',
        marketId: 'bitcoin-100k-2025',
        question: 'Will Bitcoin reach $100,000 by end of 2025?',
        options: ['Yes', 'No'],
        endTime: 1735689599,
        liquidity: 1000000000,
        creator: '11111111111111111111111111111112',
        programId: 'kbw7VTqhEDFctqGzSF5zZB3ux66amS5mEM88PyyY5s5',
        bump: 255,
        totalShares: ['500000000', '300000000'],
        createdAt: '2025-07-21T18:31:41.188Z',
        isResolved: false
      }
    ]
  })
  findAll(@Query('active') active?: boolean) {
    if (active) {
      return this.marketsService.findActive();
    }
    return this.marketsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get market statistics',
    description: 'Retrieves comprehensive statistics about all markets including totals, active/resolved counts, and volume metrics.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Market statistics with smart contract integration data',
    example: {
      totalMarkets: 5,
      activeMarkets: 3,
      resolvedMarkets: 2,
      totalVolume: 15000000000,
      totalLiquidity: 8000000000,
      averageMarketSize: 1600000000
    }
  })
  getStats() {
    return this.marketsService.getMarketStats();
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search markets by question text',
    description: 'Search for markets using keywords in the question field. Case-insensitive partial matching.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Markets matching the search query',
    type: [Market],
    example: [
      {
        id: '1753122701188',
        marketId: 'bitcoin-100k-2025',
        question: 'Will Bitcoin reach $100,000 by end of 2025?',
        options: ['Yes', 'No'],
        endTime: 1735689599,
        liquidity: 1000000000,
        creator: '11111111111111111111111111111112',
        programId: 'kbw7VTqhEDFctqGzSF5zZB3ux66amS5mEM88PyyY5s5',
        bump: 255,
        totalShares: ['500000000', '300000000'],
        createdAt: '2025-07-21T18:31:41.188Z',
        isResolved: false
      }
    ]
  })
  search(@Query('q') query: string) {
    return this.marketsService.searchMarkets(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get market by database ID',
    description: 'Retrieves a specific market using its internal database ID (auto-generated timestamp).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Market found with smart contract integration data',
    type: Market,
    example: {
      id: '1753122701188',
      marketId: 'bitcoin-100k-2025',
      question: 'Will Bitcoin reach $100,000 by end of 2025?',
      options: ['Yes', 'No'],
      endTime: 1735689599,
      liquidity: 1000000000,
      creator: '11111111111111111111111111111112',
      programId: 'kbw7VTqhEDFctqGzSF5zZB3ux66amS5mEM88PyyY5s5',
      bump: 255,
      totalShares: ['500000000', '300000000'],
      createdAt: '2025-07-21T18:31:41.188Z',
      isResolved: false
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Market not found',
    example: {
      message: 'Market with ID 1234567890 not found',
      error: 'Not Found',
      statusCode: 404
    }
  })
  findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }

  @Get('by-market-id/:marketId')
  @ApiOperation({ 
    summary: 'Get market by custom market ID',
    description: 'Retrieves a specific market using its custom marketId (user-defined identifier like "bitcoin-100k-2025").'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Market found with smart contract integration data',
    type: Market,
    example: {
      id: '1753122701188',
      marketId: 'bitcoin-100k-2025',
      question: 'Will Bitcoin reach $100,000 by end of 2025?',
      options: ['Yes', 'No'],
      endTime: 1735689599,
      liquidity: 1000000000,
      creator: '11111111111111111111111111111112',
      programId: 'kbw7VTqhEDFctqGzSF5zZB3ux66amS5mEM88PyyY5s5',
      bump: 255,
      totalShares: ['500000000', '300000000'],
      createdAt: '2025-07-21T18:31:41.188Z',
      isResolved: false
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Market not found',
    example: {
      message: 'Market with marketId bitcoin-200k-2025 not found',
      error: 'Not Found',
      statusCode: 404
    }
  })
  findByMarketId(@Param('marketId') marketId: string) {
    return this.marketsService.findByMarketId(marketId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update market' })
  @ApiResponse({ status: 200, description: 'Market updated successfully', type: Market })
  @ApiResponse({ status: 404, description: 'Market not found' })
  update(@Param('id') id: string, @Body() updateMarketDto: UpdateMarketDto) {
    return this.marketsService.update(id, updateMarketDto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve market with winning option' })
  @ApiResponse({ status: 200, description: 'Market resolved successfully', type: Market })
  @ApiResponse({ status: 404, description: 'Market not found' })
  resolve(
    @Param('id') id: string,
    @Body('winningOption') winningOption: number,
  ) {
    return this.marketsService.resolve(id, winningOption);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete market' })
  @ApiResponse({ status: 200, description: 'Market deleted successfully' })
  @ApiResponse({ status: 404, description: 'Market not found' })
  remove(@Param('id') id: string) {
    return this.marketsService.remove(id);
  }
} 