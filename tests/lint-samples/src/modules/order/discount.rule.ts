import { MAX_DISCOUNT_RATE } from './order.constants.js';

// 순수 규칙 함수: 같은 입력이면 같은 결과예요
export function discountedPrice(price: number, rate: number): number {
  return Math.floor(price * (1 - Math.min(rate, MAX_DISCOUNT_RATE)));
}
