import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '@/modules/user/index.js';

import { Order } from './entities/order.entity.js';
import { OrderRepository } from './order.repository.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), UserModule],
  providers: [OrderService, OrderRepository],
  exports: [OrderService],
})
export class OrderModule {}
