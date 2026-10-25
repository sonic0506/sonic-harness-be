// expect: sonic-be/no-manual-instantiation
import { Injectable } from '@nestjs/common';

import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';

@Injectable()
export class BadNewService {
  constructor(private readonly userRepository: UserRepository) {}

  make(): UserService {
    return new UserService(this.userRepository);
  }
}
