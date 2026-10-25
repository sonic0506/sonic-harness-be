// expect: sonic-be/require-find-take
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity.js';

@Injectable()
export class BadFindRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.users.find({ order: { id: 'ASC' } });
  }

  findByName(name: string): Promise<User[]> {
    return this.users.findBy({ name });
  }

  search(name: string): Promise<User[]> {
    return this.users
      .createQueryBuilder('user')
      .where('user.name = :name', { name })
      .getMany();
  }
}
