// expect: sonic-be/transactional-writes
import { Injectable } from '@nestjs/common';

import type { CreateUserDto } from './dto/create-user.dto.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class BadTxService {
  constructor(private readonly userRepository: UserRepository) {}

  async createAndRename(dto: CreateUserDto, name: string): Promise<void> {
    const user = await this.userRepository.create(dto.name, dto.password);
    await this.userRepository.rename(user.id, name);
  }
}
