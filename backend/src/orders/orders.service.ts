import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto, OrderType, OrderStatus } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from '../database/entities/order.entity';

@Injectable()
export class OrdersService {
  // Mock data for demonstration - in real implementation, this would use TypeORM repository
  private orders: Order[] = [
    {
      id: '1753123456800',
      marketId: 'bitcoin-100k-2025',
      user: '11111111111111111111111111111112',
      type: OrderType.BUY,
      optionIndex: 0,
      amount: '450000000',
      expectedAmount: '1000000000',
      actualAmount: '1000000000',
      fees: '9000000',
      status: OrderStatus.EXECUTED,
      transactionSignature: '5j7s1QzqC9JoyT1accuUUMQDvE7oKy7fU6Z8gF4qW2v9vQf3hE8rN6mK9pL4sT2wX1yA3bC5dE7fG8hI9jK0lM2nO3pQ4r',
      errorMessage: null,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      createdAt: new Date('2025-07-21T19:50:00.000Z'),
      updatedAt: new Date('2025-07-21T19:50:00.000Z'),
      market: null,
      get isBuy() { return this.type === OrderType.BUY; },
      get isSell() { return this.type === OrderType.SELL; },
      get isExecuted() { return this.status === OrderStatus.EXECUTED; },
      get isPending() { return this.status === OrderStatus.PENDING; },
      get slippage() { return 0; },
      get amountInSol() { return parseInt(this.amount) / 1_000_000_000; },
      get feesInSol() { return parseInt(this.fees) / 1_000_000_000; }
    },
    {
      id: '1753123456801',
      marketId: 'bitcoin-100k-2025',
      user: '22222222222222222222222222222223',
      type: OrderType.BUY,
      optionIndex: 1,
      amount: '275000000',
      expectedAmount: '500000000',
      actualAmount: '500000000',
      fees: '5500000',
      status: OrderStatus.EXECUTED,
      transactionSignature: '4k6r0PypB8InyS0zbbsUTLQCuD6nJx6eT5Y7fE3pV1u8uPe2gD7qM5lJ8oK3rS1vW0xZ2aB4cD6eF7gH8iJ9kL1mN2oP3q',
      errorMessage: null,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      createdAt: new Date('2025-07-21T19:45:00.000Z'),
      updatedAt: new Date('2025-07-21T19:45:00.000Z'),
      market: null,
      get isBuy() { return this.type === OrderType.BUY; },
      get isSell() { return this.type === OrderType.SELL; },
      get isExecuted() { return this.status === OrderStatus.EXECUTED; },
      get isPending() { return this.status === OrderStatus.PENDING; },
      get slippage() { return 0; },
      get amountInSol() { return parseInt(this.amount) / 1_000_000_000; },
      get feesInSol() { return parseInt(this.fees) / 1_000_000_000; }
    },
    {
      id: '1753123456802',
      marketId: 'eth-5k-2025',
      user: '11111111111111111111111111111112',
      type: OrderType.SELL,
      optionIndex: 0,
      amount: '200000000',
      expectedAmount: '70000000',
      actualAmount: '0',
      fees: '1400000',
      status: OrderStatus.PENDING,
      transactionSignature: null,
      errorMessage: null,
      programId: '2BeTz2C9kxK4acaxrAjPwH9Y9KBFGGRzkE3zXr3MwG6h',
      createdAt: new Date('2025-07-21T19:40:00.000Z'),
      updatedAt: new Date('2025-07-21T19:40:00.000Z'),
      market: null,
      get isBuy() { return this.type === OrderType.BUY; },
      get isSell() { return this.type === OrderType.SELL; },
      get isExecuted() { return this.status === OrderStatus.EXECUTED; },
      get isPending() { return this.status === OrderStatus.PENDING; },
      get slippage() { return 0; },
      get amountInSol() { return parseInt(this.amount) / 1_000_000_000; },
      get feesInSol() { return parseInt(this.fees) / 1_000_000_000; }
    },
  ];

  create(createOrderDto: CreateOrderDto): Order {
    const newOrder: Order = {
      id: Date.now().toString(),
      marketId: createOrderDto.marketId,
      user: createOrderDto.user,
      type: createOrderDto.type,
      optionIndex: createOrderDto.optionIndex,
      amount: createOrderDto.amount,
      expectedAmount: createOrderDto.expectedAmount,
      actualAmount: createOrderDto.actualAmount || '0',
      fees: createOrderDto.fees || '0',
      status: createOrderDto.status || OrderStatus.PENDING,
      transactionSignature: createOrderDto.transactionSignature || null,
      errorMessage: null,
      programId: createOrderDto.programId,
      createdAt: new Date(),
      updatedAt: new Date(),
      market: null,
      get isBuy() { return this.type === OrderType.BUY; },
      get isSell() { return this.type === OrderType.SELL; },
      get isExecuted() { return this.status === OrderStatus.EXECUTED; },
      get isPending() { return this.status === OrderStatus.PENDING; },
      get slippage() { return 0; },
      get amountInSol() { return parseInt(this.amount) / 1_000_000_000; },
      get feesInSol() { return parseInt(this.fees) / 1_000_000_000; }
    };
    
    this.orders.push(newOrder);
    return newOrder;
  }

  findAll(filters?: { 
    user?: string; 
    marketId?: string; 
    orderType?: OrderType;
    status?: OrderStatus;
  }): Order[] {
    let filteredOrders = [...this.orders];

    if (filters?.user) {
      filteredOrders = filteredOrders.filter(
        order => order.user === filters.user
      );
    }

    if (filters?.marketId) {
      filteredOrders = filteredOrders.filter(
        order => order.marketId === filters.marketId
      );
    }

    if (filters?.orderType) {
      filteredOrders = filteredOrders.filter(
        order => order.type === filters.orderType
      );
    }

    if (filters?.status) {
      filteredOrders = filteredOrders.filter(
        order => order.status === filters.status
      );
    }

    return filteredOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  findByUser(user: string): Order[] {
    const orders = this.orders.filter(order => order.user === user);
    
    if (orders.length === 0) {
      throw new NotFoundException(`No orders found for user ${user}`);
    }
    
    return orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  findByMarket(marketId: string): Order[] {
    const orders = this.orders.filter(order => order.marketId === marketId);
    
    if (orders.length === 0) {
      throw new NotFoundException(`No orders found for market ${marketId}`);
    }
    
    return orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  findOne(id: string): Order {
    const order = this.orders.find(order => order.id === id);
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    
    return order;
  }

  update(id: string, updateOrderDto: UpdateOrderDto): Order {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const existingOrder = this.orders[orderIndex];
    const updatedOrder = {
      ...existingOrder,
      marketId: updateOrderDto.marketId || existingOrder.marketId,
      user: updateOrderDto.user || existingOrder.user,
      type: updateOrderDto.type || existingOrder.type,
      optionIndex: updateOrderDto.optionIndex !== undefined ? updateOrderDto.optionIndex : existingOrder.optionIndex,
      amount: updateOrderDto.amount || existingOrder.amount,
      expectedAmount: updateOrderDto.expectedAmount || existingOrder.expectedAmount,
      actualAmount: updateOrderDto.actualAmount || existingOrder.actualAmount,
      fees: updateOrderDto.fees || existingOrder.fees,
      status: updateOrderDto.status || existingOrder.status,
      transactionSignature: updateOrderDto.transactionSignature !== undefined ? updateOrderDto.transactionSignature : existingOrder.transactionSignature,
      errorMessage: existingOrder.errorMessage,
      programId: updateOrderDto.programId || existingOrder.programId,
      updatedAt: new Date(),
      get isBuy() { return this.type === OrderType.BUY; },
      get isSell() { return this.type === OrderType.SELL; },
      get isExecuted() { return this.status === OrderStatus.EXECUTED; },
      get isPending() { return this.status === OrderStatus.PENDING; },
      get slippage() { return 0; },
      get amountInSol() { return parseInt(this.amount) / 1_000_000_000; },
      get feesInSol() { return parseInt(this.fees) / 1_000_000_000; }
    };
    
    this.orders[orderIndex] = updatedOrder;
    return updatedOrder;
  }

  remove(id: string): { message: string } {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    
    this.orders.splice(orderIndex, 1);
    return { message: `Order with ID ${id} has been deleted` };
  }

  getStats() {
    const totalOrders = this.orders.length;
    const uniqueUsers = new Set(this.orders.map(o => o.user)).size;
    
    const totalVolume = this.orders
      .filter(order => order.status === OrderStatus.EXECUTED)
      .reduce((sum, order) => sum + parseInt(order.amount), 0)
      .toString();
    
    const totalFees = this.orders
      .filter(order => order.status === OrderStatus.EXECUTED)
      .reduce((sum, order) => sum + parseInt(order.fees || '0'), 0)
      .toString();

    const ordersByType = this.orders.reduce((acc, order) => {
      acc[order.type] = (acc[order.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus = this.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMarkets = Object.values(
      this.orders.reduce((acc, order) => {
        if (!acc[order.marketId]) {
          acc[order.marketId] = {
            marketId: order.marketId,
            orderCount: 0,
            totalVolume: 0
          };
        }
        acc[order.marketId].orderCount++;
        if (order.status === OrderStatus.EXECUTED) {
          acc[order.marketId].totalVolume += parseInt(order.amount);
        }
        return acc;
      }, {} as Record<string, any>)
    ).sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 5);

    return {
      totalOrders,
      uniqueUsers,
      totalVolume,
      totalFees,
      ordersByType,
      ordersByStatus,
      topMarkets
    };
  }

  // Additional utility methods for order management
  executeOrder(id: string, transactionSignature: string): Order {
    const order = this.findOne(id);
    return this.update(id, {
      status: OrderStatus.EXECUTED,
      transactionSignature
    });
  }

  cancelOrder(id: string): Order {
    const order = this.findOne(id);
    if (order.status === OrderStatus.EXECUTED) {
      throw new Error('Cannot cancel an executed order');
    }
    return this.update(id, { status: OrderStatus.CANCELLED });
  }

  failOrder(id: string): Order {
    const order = this.findOne(id);
    return this.update(id, { status: OrderStatus.FAILED });
  }
}
