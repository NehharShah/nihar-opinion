import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { Position } from './entities/position.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/opinion_market.db',
      entities: [Market, Position, Order],
      synchronize: true,
      logging: false,
      dropSchema: false,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {} 