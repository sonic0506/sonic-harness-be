import { Injectable } from '@nestjs/common';

import { UserService } from '@/modules/user/index.js';

import { OrderResponseDto } from './dto/order-response.dto.js';
import { OrderRepository } from './order.repository.js';

const RECENT_SIZE = 10;

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly userService: UserService,
  ) {}

  async findRecent(userId: number): Promise<OrderResponseDto[]> {
    await this.userService.findOne(userId);
    const orders = await this.orderRepository.findRecent(userId, RECENT_SIZE);
    return orders.map((order) => OrderResponseDto.from(order));
  }
}
