import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from '../database/entities/position.entity';

@ApiTags('positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new position',
    description: 'Creates a new user position in a market. This tracks user holdings and shares for specific markets.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Position created successfully',
    type: Position,
    example: {
      id: '1753123456789',
      marketId: 'bitcoin-100k-2025',
      walletAddress: '11111111111111111111111111111112',
      optionIndex: 0,
      shares: '1000000000',
      averagePrice: '0.45',
      totalInvested: '450000000',
      createdAt: '2025-07-21T19:50:00.000Z',
      updatedAt: '2025-07-21T19:50:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid position data' })
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.create(createPositionDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all positions',
    description: 'Retrieves all user positions with optional filtering by wallet address or market ID.'
  })
  @ApiQuery({ 
    name: 'walletAddress', 
    required: false, 
    description: 'Filter positions by wallet address',
    example: '11111111111111111111111111111112'
  })
  @ApiQuery({ 
    name: 'marketId', 
    required: false, 
    description: 'Filter positions by market ID',
    example: 'bitcoin-100k-2025'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of positions retrieved successfully',
    type: [Position],
    example: [{
      id: '1753123456789',
      marketId: 'bitcoin-100k-2025',
      walletAddress: '11111111111111111111111111111112',
      optionIndex: 0,
      shares: '1000000000',
      averagePrice: '0.45',
      totalInvested: '450000000',
      createdAt: '2025-07-21T19:50:00.000Z',
      updatedAt: '2025-07-21T19:50:00.000Z'
    }]
  })
  findAll(
    @Query('walletAddress') walletAddress?: string,
    @Query('marketId') marketId?: string,
  ) {
    return this.positionsService.findAll({ walletAddress, marketId });
  }

  @Get('wallet/:walletAddress')
  @ApiOperation({ 
    summary: 'Get positions by wallet address',
    description: 'Retrieves all positions for a specific wallet address across all markets.'
  })
  @ApiParam({ 
    name: 'walletAddress', 
    description: 'Solana wallet address',
    example: '11111111111111111111111111111112'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet positions retrieved successfully',
    type: [Position]
  })
  @ApiResponse({ status: 404, description: 'No positions found for wallet' })
  findByWallet(@Param('walletAddress') walletAddress: string) {
    return this.positionsService.findByWallet(walletAddress);
  }

  @Get('market/:marketId')
  @ApiOperation({ 
    summary: 'Get positions by market ID',
    description: 'Retrieves all positions for a specific market across all users.'
  })
  @ApiParam({ 
    name: 'marketId', 
    description: 'Market identifier',
    example: 'bitcoin-100k-2025'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Market positions retrieved successfully',
    type: [Position]
  })
  @ApiResponse({ status: 404, description: 'No positions found for market' })
  findByMarket(@Param('marketId') marketId: string) {
    return this.positionsService.findByMarket(marketId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get position by ID',
    description: 'Retrieves a specific position by its database ID.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Position database ID',
    example: '1753123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Position retrieved successfully',
    type: Position
  })
  @ApiResponse({ status: 404, description: 'Position not found' })
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update position',
    description: 'Updates an existing position. Typically used to update shares and average price after trades.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Position database ID',
    example: '1753123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Position updated successfully',
    type: Position
  })
  @ApiResponse({ status: 404, description: 'Position not found' })
  update(@Param('id') id: string, @Body() updatePositionDto: UpdatePositionDto) {
    return this.positionsService.update(id, updatePositionDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete position',
    description: 'Deletes a position. Usually called when position shares reach zero.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Position database ID',
    example: '1753123456789'
  })
  @ApiResponse({ status: 200, description: 'Position deleted successfully' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  remove(@Param('id') id: string) {
    return this.positionsService.remove(id);
  }

  @Get('stats/summary')
  @ApiOperation({ 
    summary: 'Get position statistics',
    description: 'Retrieves summary statistics for all positions including total value, top holders, etc.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Position statistics retrieved successfully',
    example: {
      totalPositions: 150,
      totalValueLocked: '50000000000',
      uniqueHolders: 45,
      averagePositionSize: '1111111111',
      topMarkets: [
        { marketId: 'bitcoin-100k-2025', positionCount: 25, totalValue: '15000000000' },
        { marketId: 'eth-5k-2025', positionCount: 20, totalValue: '12000000000' }
      ]
    }
  })
  getStats() {
    return this.positionsService.getStats();
  }
}
