// expect: sonic-be/composition-max-deps
import { Injectable } from '@nestjs/common';

import { CommonCodesService } from '@/modules/common-codes';
import { COUPON_FEATURE } from '@/modules/coupon';
import { OrderService } from '@/modules/order';
import { PAYMENT_FEATURE } from '@/modules/payment';
import { ProductResponseDto } from '@/modules/product';
import { SHIPPING_FEATURE } from '@/modules/shipping';
import { UserService } from '@/modules/user';

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
