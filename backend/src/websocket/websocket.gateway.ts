import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MarketWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedClients: Map<string, Socket> = new Map();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);
    
    // Send welcome message
    client.emit('connected', {
      message: 'Connected to Opinion Market WebSocket',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_market')
  handleSubscribeMarket(client: Socket, marketId: string) {
    client.join(`market_${marketId}`);
    this.logger.log(`Client ${client.id} subscribed to market ${marketId}`);
    
    client.emit('subscribed', {
      marketId,
      message: `Subscribed to market ${marketId}`,
    });
  }

  @SubscribeMessage('unsubscribe_market')
  handleUnsubscribeMarket(client: Socket, marketId: string) {
    client.leave(`market_${marketId}`);
    this.logger.log(`Client ${client.id} unsubscribed from market ${marketId}`);
    
    client.emit('unsubscribed', {
      marketId,
      message: `Unsubscribed from market ${marketId}`,
    });
  }

  @SubscribeMessage('subscribe_all_markets')
  handleSubscribeAllMarkets(client: Socket) {
    client.join('all_markets');
    this.logger.log(`Client ${client.id} subscribed to all markets`);
    
    client.emit('subscribed_all', {
      message: 'Subscribed to all markets',
    });
  }

  @SubscribeMessage('unsubscribe_all_markets')
  handleUnsubscribeAllMarkets(client: Socket) {
    client.leave('all_markets');
    this.logger.log(`Client ${client.id} unsubscribed from all markets`);
    
    client.emit('unsubscribed_all', {
      message: 'Unsubscribed from all markets',
    });
  }

  // Emit market created event
  emitMarketCreated(market: any) {
    this.server.to('all_markets').emit('market_created', {
      market,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Emitted market_created event for market ${market.marketId}`);
  }

  // Emit market updated event
  emitMarketUpdated(market: any) {
    this.server.to(`market_${market.marketId}`).emit('market_updated', {
      market,
      timestamp: new Date().toISOString(),
    });
    
    this.server.to('all_markets').emit('market_updated', {
      market,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Emitted market_updated event for market ${market.marketId}`);
  }

  // Emit market resolved event
  emitMarketResolved(market: any) {
    this.server.to(`market_${market.marketId}`).emit('market_resolved', {
      market,
      timestamp: new Date().toISOString(),
    });
    
    this.server.to('all_markets').emit('market_resolved', {
      market,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Emitted market_resolved event for market ${market.marketId}`);
  }

  // Emit price update event
  emitPriceUpdate(market: any) {
    const priceData = {
      marketId: market.marketId,
      prices: market.prices,
      totalShares: market.totalShares,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`market_${market.marketId}`).emit('price_update', priceData);
    this.server.to('all_markets').emit('price_update', priceData);
    
    this.logger.log(`Emitted price_update event for market ${market.marketId}`);
  }

  // Emit order executed event
  emitOrderExecuted(order: any) {
    const orderData = {
      order,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`market_${order.marketId}`).emit('order_executed', orderData);
    this.server.to('all_markets').emit('order_executed', orderData);
    
    this.logger.log(`Emitted order_executed event for order ${order.id}`);
  }

  // Emit position updated event
  emitPositionUpdated(position: any) {
    const positionData = {
      position,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`market_${position.marketId}`).emit('position_updated', positionData);
    
    this.logger.log(`Emitted position_updated event for position ${position.id}`);
  }

  // Emit error event
  emitError(error: any) {
    this.server.emit('error', {
      error: error.message || 'An error occurred',
      timestamp: new Date().toISOString(),
    });
    
    this.logger.error('Emitted error event:', error);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients info
  getConnectedClientsInfo(): any[] {
    return Array.from(this.connectedClients.entries()).map(([id, socket]) => ({
      id,
      connectedAt: socket.handshake.time,
      rooms: Array.from(socket.rooms),
    }));
  }

  // Broadcast to all clients
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Broadcasted ${event} to all clients`);
  }

  // Broadcast to specific room
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Broadcasted ${event} to room ${room}`);
  }
} 