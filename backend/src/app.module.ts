import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketsModule } from './markets/markets.module';
import { WebSocketModule } from './websocket/websocket.module';
import { IndexerModule } from './indexer/indexer.module';
import { HealthController } from './health.controller';
import { Market } from './database/entities/market.entity';
import { Position } from './database/entities/position.entity';
import { Order } from './database/entities/order.entity';
import { PositionsModule } from './positions/positions.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   url: process.env.DATABASE_URL,
    //   entities: [Market, Position, Order],
    //   synchronize: true,
    //   logging: false,
    // }),
    MarketsModule,
    WebSocketModule,
    PositionsModule,
    OrdersModule,
    // IndexerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {} 