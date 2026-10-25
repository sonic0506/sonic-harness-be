// expect: boundaries/dependencies
import { Controller, Get } from '@nestjs/common';

import { OrderResponseDto } from '@/modules/order/index.js';

// 다른 feature index를 값으로 가져오면 안 돼요(타입은 import type으로).
@Controller('bad-value')
export class BadValueController {
  @Get()
  find(): Promise<OrderResponseDto[]> {
    return Promise.resolve([new OrderResponseDto()]);
  }
}
