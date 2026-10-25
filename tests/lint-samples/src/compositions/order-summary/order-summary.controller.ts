import { Controller, Get } from '@nestjs/common';

import type { OrderResponseDto } from '@/modules/order/index.js';

import { OrderSummaryService } from './order-summary.service.js';

// 다른 feature의 응답 DTO는 타입으로만 가져와요(import type). 호출은 composition service가 해요.
@Controller('order-summary')
export class OrderSummaryController {
  constructor(private readonly orderSummaryService: OrderSummaryService) {}

  @Get()
  find(): Promise<OrderResponseDto[]> {
    return this.orderSummaryService.find();
  }
}
