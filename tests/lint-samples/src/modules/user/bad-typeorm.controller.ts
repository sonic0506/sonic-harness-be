// expect: no-restricted-imports
import { Controller } from '@nestjs/common';
import type { Repository } from 'typeorm';

@Controller('bad-typeorm')
export class BadTypeormController {
  users: Repository<object> | null = null;
}
