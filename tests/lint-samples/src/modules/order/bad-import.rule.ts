// expect: no-restricted-imports
import { Logger } from '@nestjs/common';

export function logged(value: number): number {
  new Logger('rule').log(String(value));
  return value;
}
