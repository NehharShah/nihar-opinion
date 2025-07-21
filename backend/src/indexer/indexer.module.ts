import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerService } from './indexer.service';
import { Market } from '../database/entities/market.entity';
import { Position } from '../database/entities/position.entity';
import { Order } from '../database/entities/order.entity';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, Position, Order]),
    WebSocketModule,
  ],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {} 