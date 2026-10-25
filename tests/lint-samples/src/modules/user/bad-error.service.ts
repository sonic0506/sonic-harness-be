// expect: sonic-be/no-generic-error
import { Injectable } from '@nestjs/common';

@Injectable()
export class BadErrorService {
  fail(): never {
    throw new Error('실패했어요');
  }
}
