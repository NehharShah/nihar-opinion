import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { MarketWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MarketsService {
  private markets: any[] = [];

  constructor(
    private websocketGateway: MarketWebSocketGateway,
  ) {}

  async create(createMarketDto: CreateMarketDto): Promise<any> {
    const market = {
      id: Date.now().toString(),
      ...createMarketDto,
      totalShares: new Array(createMarketDto.options.length).fill('0'),
      createdAt: new Date(),
      isResolved: false,
    };

    this.markets.push(market);
    
    // Emit to WebSocket clients
    this.websocketGateway.emitMarketCreated(market);
    
    return market;
  }

  async findAll(): Promise<any[]> {
    return this.markets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findActive(): Promise<any[]> {
    const now = Math.floor(Date.now() / 1000);
    return this.markets
      .filter(market => market.endTime > now && !market.isResolved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findOne(id: string): Promise<any> {
    const market = this.markets.find(m => m.id === id);

    if (!market) {
      throw new NotFoundException(`Market with ID ${id} not found`);
    }

    return market;
  }

  async findByMarketId(marketId: string): Promise<any> {
    const market = this.markets.find(m => m.marketId === marketId);

    if (!market) {
      throw new NotFoundException(`Market with ID ${marketId} not found`);
    }

    return market;
  }

  async update(id: string, updateMarketDto: UpdateMarketDto): Promise<any> {
    const market = await this.findOne(id);
    
    Object.assign(market, updateMarketDto);
    
    // Emit to WebSocket clients
    this.websocketGateway.emitMarketUpdated(market);
    
    return market;
  }

  async resolve(id: string, winningOption: number): Promise<any> {
    const market = await this.findOne(id);
    
    if (market.isResolved) {
      throw new Error('Market is already resolved');
    }

    if (winningOption >= market.options.length) {
      throw new Error('Invalid winning option');
    }

    market.isResolved = true;
    market.winningOption = winningOption;
    
    // Emit to WebSocket clients
    this.websocketGateway.emitMarketResolved(market);
    
    return market;
  }

  async remove(id: string): Promise<void> {
    const market = await this.findOne(id);
    const index = this.markets.findIndex(m => m.id === id);
    if (index > -1) {
      this.markets.splice(index, 1);
    }
  }

  async updateShares(marketId: string, optionIndex: number, shares: string): Promise<any> {
    const market = await this.findByMarketId(marketId);
    
    if (optionIndex >= market.totalShares.length) {
      throw new Error('Invalid option index');
    }

    market.totalShares[optionIndex] = shares;
    
    // Emit price update to WebSocket clients
    this.websocketGateway.emitPriceUpdate(market);
    
    return market;
  }

  async getMarketStats(): Promise<any> {
    const totalMarkets = this.markets.length;
    const activeMarkets = this.markets.filter(m => !m.isResolved).length;
    const resolvedMarkets = this.markets.filter(m => m.isResolved).length;

    return {
      totalMarkets,
      activeMarkets,
      resolvedMarkets,
    };
  }

  async searchMarkets(query: string): Promise<any[]> {
    return this.markets
      .filter(market => 
        market.question.toLowerCase().includes(query.toLowerCase()) ||
        market.marketId.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
} 