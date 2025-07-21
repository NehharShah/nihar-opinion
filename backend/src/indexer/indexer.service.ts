import { Injectable, Logger } from '@nestjs/common';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Market } from '../database/entities/market.entity';
import { Position } from '../database/entities/position.entity';
import { Order, OrderType, OrderStatus } from '../database/entities/order.entity';
import { MarketWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private connection: Connection;
  private programId: PublicKey;
  private isIndexing = false;

  constructor(
    @InjectRepository(Market)
    private marketsRepository: Repository<Market>,
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private websocketGateway: MarketWebSocketGateway,
  ) {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    this.programId = new PublicKey(process.env.PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
  }

  async startIndexing() {
    if (this.isIndexing) {
      this.logger.warn('Indexer is already running');
      return;
    }

    this.isIndexing = true;
    this.logger.log('Starting indexer...');

    try {
      // Get the latest slot
      const latestSlot = await this.connection.getSlot();
      this.logger.log(`Latest slot: ${latestSlot}`);

      // Subscribe to program logs
      this.connection.onLogs(
        this.programId,
        (logs, context) => {
          this.processLogs(logs, context);
        },
        'confirmed',
      );

      this.logger.log('Indexer started successfully');
    } catch (error) {
      this.logger.error('Failed to start indexer:', error);
      this.isIndexing = false;
    }
  }

  async stopIndexing() {
    this.isIndexing = false;
    this.logger.log('Indexer stopped');
  }

  private async processLogs(logs: any, context: any) {
    try {
      this.logger.debug(`Processing logs for slot ${context.slot}`);

      // Parse program logs to extract events
      const events = this.parseProgramLogs(logs);
      
      for (const event of events) {
        await this.processEvent(event, context);
      }
    } catch (error) {
      this.logger.error('Error processing logs:', error);
    }
  }

  private parseProgramLogs(logs: any): any[] {
    const events = [];
    
    for (const log of logs.logs) {
      // Parse different event types based on log messages
      if (log.includes('Market created:')) {
        events.push(this.parseMarketCreatedEvent(log));
      } else if (log.includes('Buy order executed:')) {
        events.push(this.parseBuyOrderEvent(log));
      } else if (log.includes('Sell order executed:')) {
        events.push(this.parseSellOrderEvent(log));
      } else if (log.includes('Market resolved:')) {
        events.push(this.parseMarketResolvedEvent(log));
      }
    }

    return events;
  }

  private parseMarketCreatedEvent(log: string): any {
    // Extract market creation data from log
    const marketIdMatch = log.match(/Market created: (.+)/);
    const questionMatch = log.match(/Question: (.+)/);
    const optionsMatch = log.match(/Options: \[(.+)\]/);
    const endTimeMatch = log.match(/End time: (\d+)/);
    const liquidityMatch = log.match(/Liquidity: (\d+) lamports/);

    if (marketIdMatch && questionMatch && optionsMatch && endTimeMatch && liquidityMatch) {
      return {
        type: 'market_created',
        marketId: marketIdMatch[1],
        question: questionMatch[1],
        options: JSON.parse(optionsMatch[1]),
        endTime: parseInt(endTimeMatch[1]),
        liquidity: liquidityMatch[1],
      };
    }

    return null;
  }

  private parseBuyOrderEvent(log: string): any {
    // Extract buy order data from log
    const marketMatch = log.match(/Market: (.+)/);
    const optionMatch = log.match(/Option: (\d+)/);
    const costMatch = log.match(/Cost: (\d+) lamports/);
    const sharesMatch = log.match(/Shares received: (\d+)/);
    const feeMatch = log.match(/Fee paid: (\d+) lamports/);

    if (marketMatch && optionMatch && costMatch && sharesMatch && feeMatch) {
      return {
        type: 'buy_order',
        marketId: marketMatch[1],
        optionIndex: parseInt(optionMatch[1]),
        cost: costMatch[1],
        shares: sharesMatch[1],
        fee: feeMatch[1],
      };
    }

    return null;
  }

  private parseSellOrderEvent(log: string): any {
    // Extract sell order data from log
    const marketMatch = log.match(/Market: (.+)/);
    const optionMatch = log.match(/Option: (\d+)/);
    const sharesMatch = log.match(/Shares sold: (\d+)/);
    const costMatch = log.match(/Cost received: (\d+) lamports/);
    const feeMatch = log.match(/Fee paid: (\d+) lamports/);

    if (marketMatch && optionMatch && sharesMatch && costMatch && feeMatch) {
      return {
        type: 'sell_order',
        marketId: marketMatch[1],
        optionIndex: parseInt(optionMatch[1]),
        shares: sharesMatch[1],
        cost: costMatch[1],
        fee: feeMatch[1],
      };
    }

    return null;
  }

  private parseMarketResolvedEvent(log: string): any {
    // Extract market resolution data from log
    const marketMatch = log.match(/Market resolved: (.+)/);
    const winningOptionMatch = log.match(/Winning option: (\d+)/);

    if (marketMatch && winningOptionMatch) {
      return {
        type: 'market_resolved',
        marketId: marketMatch[1],
        winningOption: parseInt(winningOptionMatch[1]),
      };
    }

    return null;
  }

  private async processEvent(event: any, context: any) {
    try {
      switch (event.type) {
        case 'market_created':
          await this.processMarketCreated(event);
          break;
        case 'buy_order':
          await this.processBuyOrder(event);
          break;
        case 'sell_order':
          await this.processSellOrder(event);
          break;
        case 'market_resolved':
          await this.processMarketResolved(event);
          break;
        default:
          this.logger.warn(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing event ${event.type}:`, error);
    }
  }

  private async processMarketCreated(event: any) {
    const market = await this.marketsRepository.findOne({
      where: { marketId: event.marketId },
    });

    if (!market) {
      const newMarket = this.marketsRepository.create({
        marketId: event.marketId,
        question: event.question,
        options: event.options,
        endTime: event.endTime,
        liquidity: event.liquidity,
        totalShares: new Array(event.options.length).fill('0'),
        creator: '', // Will be filled from transaction
        programId: this.programId.toString(),
        bump: 0, // Will be filled from transaction
      });

      await this.marketsRepository.save(newMarket);
      this.logger.log(`Market created: ${event.marketId}`);
    }
  }

  private async processBuyOrder(event: any) {
    const market = await this.marketsRepository.findOne({
      where: { marketId: event.marketId },
    });

    if (market) {
      // Update market shares
      const totalShares = [...market.totalShares];
      totalShares[event.optionIndex] = (
        parseInt(totalShares[event.optionIndex]) + parseInt(event.shares)
      ).toString();
      
      market.totalShares = totalShares;
      await this.marketsRepository.save(market);

      // Create order record
      const order = this.ordersRepository.create({
        marketId: event.marketId,
        user: '', // Will be filled from transaction
        type: OrderType.BUY,
        optionIndex: event.optionIndex,
        amount: event.cost,
        expectedAmount: event.shares,
        actualAmount: event.shares,
        fees: event.fee,
        status: OrderStatus.EXECUTED,
        programId: this.programId.toString(),
      });

      await this.ordersRepository.save(order);

      // Emit price update
      this.websocketGateway.emitPriceUpdate(market);

      this.logger.log(`Buy order processed: ${event.marketId} - ${event.shares} shares`);
    }
  }

  private async processSellOrder(event: any) {
    const market = await this.marketsRepository.findOne({
      where: { marketId: event.marketId },
    });

    if (market) {
      // Update market shares
      const totalShares = [...market.totalShares];
      totalShares[event.optionIndex] = (
        parseInt(totalShares[event.optionIndex]) - parseInt(event.shares)
      ).toString();
      
      market.totalShares = totalShares;
      await this.marketsRepository.save(market);

      // Create order record
      const order = this.ordersRepository.create({
        marketId: event.marketId,
        user: '', // Will be filled from transaction
        type: OrderType.SELL,
        optionIndex: event.optionIndex,
        amount: event.shares,
        expectedAmount: event.cost,
        actualAmount: event.cost,
        fees: event.fee,
        status: OrderStatus.EXECUTED,
        programId: this.programId.toString(),
      });

      await this.ordersRepository.save(order);

      // Emit price update
      this.websocketGateway.emitPriceUpdate(market);

      this.logger.log(`Sell order processed: ${event.marketId} - ${event.shares} shares`);
    }
  }

  private async processMarketResolved(event: any) {
    const market = await this.marketsRepository.findOne({
      where: { marketId: event.marketId },
    });

    if (market) {
      market.isResolved = true;
      market.winningOption = event.winningOption;
      await this.marketsRepository.save(market);

      // Emit market resolved event
      this.websocketGateway.emitMarketResolved(market);

      this.logger.log(`Market resolved: ${event.marketId} - Option ${event.winningOption}`);
    }
  }
} 