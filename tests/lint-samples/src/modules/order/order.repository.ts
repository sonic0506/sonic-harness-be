import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './entities/order.entity.js';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  findRecent(userId: number, size: number): Promise<Order[]> {
    return this.orders.find({
      where: { user: { id: userId } },
      relations: { user: true },
      order: { id: 'DESC' },
      take: size,
    });
  }
}
