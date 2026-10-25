// expect: sonic-be/no-raw-sql-interpolation
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity.js';

@Injectable()
export class BadRawRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  deleteById(id: string): Promise<unknown> {
    return this.users.query(`DELETE FROM users WHERE id = ${id}`);
  }

  findByName(name: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .where("user.name = '" + name + "'")
      .getOne();
  }
}
