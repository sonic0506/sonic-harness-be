// expect: sonic-be/no-repository-call-in-loop, no-await-in-loop
import { Injectable } from '@nestjs/common';

import type { User } from './entities/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class BadLoopService {
  constructor(private readonly userRepository: UserRepository) {}

  findMany(ids: number[]): Promise<(User | null)[]> {
    return Promise.all(ids.map((id) => this.userRepository.findById(id)));
  }

  async findEach(ids: number[]): Promise<number> {
    let found = 0;
    for (const id of ids) {
      const user = await this.userRepository.findById(id);
      if (user) found++;
    }
    return found;
  }
}
