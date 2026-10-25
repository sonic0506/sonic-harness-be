import { UserResponseDto } from '@/modules/user/index.js';

import type { Order } from '../entities/order.entity.js';

export class OrderResponseDto {
  id!: number;
  title!: string;
  user!: UserResponseDto;

  static from(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.title = order.title;
    dto.user = UserResponseDto.from(order.user);
    return dto;
  }
}
