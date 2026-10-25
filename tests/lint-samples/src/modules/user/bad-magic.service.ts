// expect: @typescript-eslint/no-magic-numbers
import { Injectable } from '@nestjs/common';

@Injectable()
export class BadMagicService {
  isAdult(age: number): boolean {
    return age >= 19;
  }
}
