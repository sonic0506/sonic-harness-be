import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';

import { PageDto } from '@/common/pagination/page.dto.js';
import type { PageQueryDto } from '@/common/pagination/page-query.dto.js';

import type { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserNotFoundException } from './user.exception.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new UserNotFoundException(id);
    return UserResponseDto.from(user);
  }

  async findPage(query: PageQueryDto): Promise<PageDto<UserResponseDto>> {
    const [users, total] = await this.userRepository.findPage(
      query.page,
      query.size,
    );
    const page = new PageDto<UserResponseDto>();
    page.items = users.map((user) => UserResponseDto.from(user));
    page.meta = { page: query.page, size: query.size, total };
    return page;
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.create(dto.name, dto.password);
    return UserResponseDto.from(user);
  }

  @Transactional()
  async createAndRename(dto: CreateUserDto, name: string): Promise<void> {
    const user = await this.userRepository.create(dto.name, dto.password);
    await this.userRepository.rename(user.id, name);
  }
}
