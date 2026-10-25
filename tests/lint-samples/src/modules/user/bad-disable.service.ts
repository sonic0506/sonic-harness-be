// expect: @eslint-community/eslint-comments/require-description
import { Injectable } from '@nestjs/common';

@Injectable()
export class BadDisableService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(value: string): any {
    return JSON.parse(value);
  }
}
