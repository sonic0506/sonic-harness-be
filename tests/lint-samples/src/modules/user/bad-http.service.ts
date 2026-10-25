// expect: no-restricted-imports
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class BadHttpService {
  fail(): never {
    throw new NotFoundException();
  }
}
