// expect: boundaries/dependencies
import { Injectable } from '@nestjs/common';

import { UserService } from '@/modules/user/user.service.js';

@Injectable()
export class BadDeepService {
  constructor(private readonly userService: UserService) {}
}
