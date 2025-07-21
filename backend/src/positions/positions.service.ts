import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from '../database/entities/position.entity';

@Injectable()
export class PositionsService {
  // Mock data for demonstration - in real implementation, this would use TypeORM repository
  private positions: Position[] = [
    {
      id: '1753123456789',
      marketId: 'bitcoin-100k-2025',
      user: '11111111111111111111111111111112',
      shares: ['1000000000', '0'],
      totalCost: '450000000',
      totalFeesPaid: '9000000',
      hasClaimed: false,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      bump: 255,
      createdAt: new Date('2025-07-21T19:50:00.000Z'),
      updatedAt: new Date('2025-07-21T19:50:00.000Z'),
      market: null,
      get totalShares() { return this.shares.reduce((sum, shares) => sum + parseInt(shares), 0); },
      get hasWinningShares() { return false; },
      get winningShares() { return 0; },
      get estimatedWinnings() { return 0; }
    },
    {
      id: '1753123456790',
      marketId: 'bitcoin-100k-2025',
      user: '22222222222222222222222222222223',
      shares: ['0', '500000000'],
      totalCost: '275000000',
      totalFeesPaid: '5500000',
      hasClaimed: false,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      bump: 254,
      createdAt: new Date('2025-07-21T19:45:00.000Z'),
      updatedAt: new Date('2025-07-21T19:45:00.000Z'),
      market: null,
      get totalShares() { return this.shares.reduce((sum, shares) => sum + parseInt(shares), 0); },
      get hasWinningShares() { return false; },
      get winningShares() { return 0; },
      get estimatedWinnings() { return 0; }
    },
    {
      id: '1753123456791',
      marketId: 'eth-5k-2025',
      user: '11111111111111111111111111111112',
      shares: ['2000000000', '0'],
      totalCost: '700000000',
      totalFeesPaid: '14000000',
      hasClaimed: false,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      bump: 253,
      createdAt: new Date('2025-07-21T19:40:00.000Z'),
      updatedAt: new Date('2025-07-21T19:40:00.000Z'),
      market: null,
      get totalShares() { return this.shares.reduce((sum, shares) => sum + parseInt(shares), 0); },
      get hasWinningShares() { return false; },
      get winningShares() { return 0; },
      get estimatedWinnings() { return 0; }
    },
  ];

  create(createPositionDto: CreatePositionDto): Position {
    const newPosition: Position = {
      id: Date.now().toString(),
      marketId: createPositionDto.marketId,
      user: createPositionDto.user,
      shares: createPositionDto.shares,
      totalCost: createPositionDto.totalCost,
      totalFeesPaid: createPositionDto.totalFeesPaid || '0',
      hasClaimed: false,
      programId: createPositionDto.programId,
      bump: createPositionDto.bump,
      createdAt: new Date(),
      updatedAt: new Date(),
      market: null,
      get totalShares() { return this.shares.reduce((sum, shares) => sum + parseInt(shares), 0); },
      get hasWinningShares() { return false; },
      get winningShares() { return 0; },
      get estimatedWinnings() { return 0; }
    };
    
    this.positions.push(newPosition);
    return newPosition;
  }

  findAll(filters?: { walletAddress?: string; marketId?: string }): Position[] {
    let filteredPositions = [...this.positions];

    if (filters?.walletAddress) {
      filteredPositions = filteredPositions.filter(
        position => position.user === filters.walletAddress
      );
    }

    if (filters?.marketId) {
      filteredPositions = filteredPositions.filter(
        position => position.marketId === filters.marketId
      );
    }

    return filteredPositions;
  }

  findByWallet(walletAddress: string): Position[] {
    const positions = this.positions.filter(
      position => position.user === walletAddress
    );
    
    if (positions.length === 0) {
      throw new NotFoundException(`No positions found for wallet ${walletAddress}`);
    }
    
    return positions;
  }

  findByMarket(marketId: string): Position[] {
    const positions = this.positions.filter(
      position => position.marketId === marketId
    );
    
    if (positions.length === 0) {
      throw new NotFoundException(`No positions found for market ${marketId}`);
    }
    
    return positions;
  }

  findOne(id: string): Position {
    const position = this.positions.find(p => p.id === id);
    
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    
    return position;
  }

  update(id: string, updatePositionDto: UpdatePositionDto): Position {
    const positionIndex = this.positions.findIndex(p => p.id === id);
    
    if (positionIndex === -1) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }

    const existingPosition = this.positions[positionIndex];
    const updatedPosition = {
      ...existingPosition,
      marketId: updatePositionDto.marketId || existingPosition.marketId,
      user: updatePositionDto.user || existingPosition.user,
      shares: updatePositionDto.shares || existingPosition.shares,
      totalCost: updatePositionDto.totalCost || existingPosition.totalCost,
      totalFeesPaid: updatePositionDto.totalFeesPaid || existingPosition.totalFeesPaid,
      programId: updatePositionDto.programId || existingPosition.programId,
      bump: updatePositionDto.bump !== undefined ? updatePositionDto.bump : existingPosition.bump,
      updatedAt: new Date(),
      get totalShares() { return this.shares.reduce((sum, shares) => sum + parseInt(shares), 0); },
      get hasWinningShares() { return false; },
      get winningShares() { return 0; },
      get estimatedWinnings() { return 0; }
    };
    
    this.positions[positionIndex] = updatedPosition;
    return updatedPosition;
  }

  remove(id: string): { message: string } {
    const positionIndex = this.positions.findIndex(p => p.id === id);
    
    if (positionIndex === -1) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }

    this.positions.splice(positionIndex, 1);
    return { message: `Position with ID ${id} deleted successfully` };
  }

  getStats() {
    const totalPositions = this.positions.length;
    const uniqueHolders = new Set(this.positions.map(p => p.user)).size;
    const totalValueLocked = this.positions.reduce(
      (sum, position) => sum + parseInt(position.totalCost), 0
    ).toString();
    
    const averagePositionSize = totalPositions > 0 
      ? Math.floor(parseInt(totalValueLocked) / totalPositions).toString()
      : '0';

    // Group by market for top markets
    const marketStats = this.positions.reduce((acc, position) => {
      if (!acc[position.marketId]) {
        acc[position.marketId] = {
          marketId: position.marketId,
          positionCount: 0,
          totalValue: 0,
        };
      }
      acc[position.marketId].positionCount++;
      acc[position.marketId].totalValue += parseInt(position.totalCost);
      return acc;
    }, {} as Record<string, any>);

    const topMarkets = Object.values(marketStats)
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map((market: any) => ({
        ...market,
        totalValue: market.totalValue.toString(),
      }));

    return {
      totalPositions,
      totalValueLocked,
      uniqueHolders,
      averagePositionSize,
      topMarkets,
    };
  }
}
