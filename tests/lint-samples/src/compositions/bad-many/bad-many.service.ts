// expect: sonic-be/composition-max-deps
import { Injectable } from '@nestjs/common';

import { CommonCodesService } from '@/modules/common-codes/index.js';
import { COUPON_FEATURE } from '@/modules/coupon/index.js';
import { OrderService } from '@/modules/order/index.js';
import { PAYMENT_FEATURE } from '@/modules/payment/index.js';
import { ProductResponseDto } from '@/modules/product/index.js';
import { SHIPPING_FEATURE } from '@/modules/shipping/index.js';
import { UserService } from '@/modules/user/index.js';

@Injectable()
export class BadManyService {
  constructor(
    private readonly commonCodesService: CommonCodesService,
    private readonly orderService: OrderService,
    private readonly userService: UserService,
  ) {}

  features(): string[] {
    return [
      COUPON_FEATURE,
      PAYMENT_FEATURE,
      SHIPPING_FEATURE,
      ProductResponseDto.name,
    ];
  }
}
