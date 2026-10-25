// expect: sonic-be/no-manual-instantiation
import { Injectable } from '@nestjs/common';

import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Injectable()
export class BadNewService {
  constructor(private readonly userRepository: UserRepository) {}

  make(): UserService {
    return new UserService(this.userRepository);
  }
}
