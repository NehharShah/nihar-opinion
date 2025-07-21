import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderType, OrderStatus } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from '../database/entities/order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Creates a new buy or sell order for a market. This tracks user trading intentions and execution status.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: Order,
    example: {
      id: '1753123456800',
      marketId: 'bitcoin-100k-2025',
      user: '11111111111111111111111111111112',
      orderType: 'buy',
      optionIndex: 0,
      shares: '1000000000',
      price: '450000',
      totalCost: '450000000',
      fees: '9000000',
      status: 'pending',
      transactionSignature: null,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      createdAt: '2025-07-21T19:50:00.000Z',
      updatedAt: '2025-07-21T19:50:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all orders',
    description: 'Retrieves all orders with optional filtering by user, market, type, or status.'
  })
  @ApiQuery({ 
    name: 'user', 
    required: false, 
    description: 'Filter orders by user wallet address',
    example: '11111111111111111111111111111112'
  })
  @ApiQuery({ 
    name: 'marketId', 
    required: false, 
    description: 'Filter orders by market ID',
    example: 'bitcoin-100k-2025'
  })
  @ApiQuery({ 
    name: 'orderType', 
    required: false, 
    description: 'Filter orders by type',
    enum: OrderType,
    example: OrderType.BUY
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Filter orders by status',
    enum: OrderStatus,
    example: OrderStatus.EXECUTED
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of orders retrieved successfully',
    type: [Order],
    example: [{
      id: '1753123456800',
      marketId: 'bitcoin-100k-2025',
      user: '11111111111111111111111111111112',
      orderType: 'buy',
      optionIndex: 0,
      shares: '1000000000',
      price: '450000',
      totalCost: '450000000',
      fees: '9000000',
      status: 'executed',
      transactionSignature: '5j7s1QzqC9JoyT1accuUUMQDvE7oKy7fU6Z8gF4qW2v9vQf3hE8rN6mK9pL4sT2wX1yA3bC5dE7fG8hI9jK0lM2nO3pQ4r',
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      createdAt: '2025-07-21T19:50:00.000Z',
      updatedAt: '2025-07-21T19:50:00.000Z'
    }]
  })
  findAll(
    @Query('user') user?: string,
    @Query('marketId') marketId?: string,
    @Query('orderType') orderType?: OrderType,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll({ user, marketId, orderType, status });
  }

  @Get('user/:user')
  @ApiOperation({ 
    summary: 'Get orders by user',
    description: 'Retrieves all orders for a specific user wallet address across all markets.'
  })
  @ApiParam({ 
    name: 'user', 
    description: 'Solana wallet address',
    example: '11111111111111111111111111111112'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User orders retrieved successfully',
    type: [Order]
  })
  @ApiResponse({ status: 404, description: 'No orders found for user' })
  findByUser(@Param('user') user: string) {
    return this.ordersService.findByUser(user);
  }

  @Get('market/:marketId')
  @ApiOperation({ 
    summary: 'Get orders by market ID',
    description: 'Retrieves all orders for a specific market across all users.'
  })
  @ApiParam({ 
    name: 'marketId', 
    description: 'Market identifier',
    example: 'bitcoin-100k-2025'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Market orders retrieved successfully',
    type: [Order]
  })
  @ApiResponse({ status: 404, description: 'No orders found for market' })
  findByMarket(@Param('marketId') marketId: string) {
    return this.ordersService.findByMarket(marketId);
  }

  @Get('stats/summary')
  @ApiOperation({ 
    summary: 'Get order statistics',
    description: 'Retrieves summary statistics for all orders including volume, fees, and distribution by type/status.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order statistics retrieved successfully',
    example: {
      totalOrders: 250,
      uniqueUsers: 75,
      totalVolume: '125000000000',
      totalFees: '2500000000',
      ordersByType: {
        buy: 150,
        sell: 100
      },
      ordersByStatus: {
        pending: 25,
        executed: 200,
        failed: 15,
        cancelled: 10
      },
      topMarkets: [
        { marketId: 'bitcoin-100k-2025', orderCount: 50, totalVolume: 45000000000 },
        { marketId: 'eth-5k-2025', orderCount: 40, totalVolume: 35000000000 }
      ]
    }
  })
  getStats() {
    return this.ordersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get order by ID',
    description: 'Retrieves a specific order by its database ID.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Order database ID',
    example: '1753123456800'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order retrieved successfully',
    type: Order
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update order',
    description: 'Updates an existing order. Typically used to update status, transaction signature, or other order details.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Order database ID',
    example: '1753123456800'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order updated successfully',
    type: Order
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete order',
    description: 'Deletes an order. Usually called for cleanup or cancellation purposes.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Order database ID',
    example: '1753123456800'
  })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Patch(':id/execute')
  @ApiOperation({ 
    summary: 'Execute order',
    description: 'Marks an order as executed and records the transaction signature.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Order database ID',
    example: '1753123456800'
  })
  @ApiQuery({ 
    name: 'transactionSignature', 
    required: true, 
    description: 'Solana transaction signature',
    example: '5j7s1QzqC9JoyT1accuUUMQDvE7oKy7fU6Z8gF4qW2v9vQf3hE8rN6mK9pL4sT2wX1yA3bC5dE7fG8hI9jK0lM2nO3pQ4r'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order executed successfully',
    type: Order
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  executeOrder(
    @Param('id') id: string,
    @Query('transactionSignature') transactionSignature: string
  ) {
    return this.ordersService.executeOrder(id, transactionSignature);
  }

  @Patch(':id/cancel')
  @ApiOperation({ 
    summary: 'Cancel order',
    description: 'Cancels a pending order. Cannot cancel already executed orders.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Order database ID',
    example: '1753123456800'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order cancelled successfully',
    type: Order
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel executed order' })
  cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  @Patch(':id/fail')
  @ApiOperation({ 
    summary: 'Mark order as failed',
    description: 'Marks an order as failed due to execution issues.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Order database ID',
    example: '1753123456800'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order marked as failed successfully',
    type: Order
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  failOrder(@Param('id') id: string) {
    return this.ordersService.failOrder(id);
  }
}
