import { Module } from '@nestjs/common';
import { MarketWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [MarketWebSocketGateway],
  exports: [MarketWebSocketGateway],
})
export class WebSocketModule {} 