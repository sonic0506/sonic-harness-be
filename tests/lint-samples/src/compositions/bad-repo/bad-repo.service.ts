// expect: boundaries/dependencies
import { Injectable } from '@nestjs/common';

import { UserRepository } from '@/modules/user/user.repository.js';

@Injectable()
export class BadRepoService {
  constructor(private readonly userRepository: UserRepository) {}
}
