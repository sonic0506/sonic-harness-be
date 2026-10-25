import { Injectable } from '@nestjs/common';

import { type OrderResponseDto, OrderService } from '@/modules/order/index.js';

const USER_ID = 1;

@Injectable()
export class OrderSummaryService {
  constructor(private readonly orderService: OrderService) {}

  find(): Promise<OrderResponseDto[]> {
    return this.orderService.findRecent(USER_ID);
  }
}
