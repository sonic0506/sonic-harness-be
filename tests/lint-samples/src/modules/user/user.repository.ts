import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findPage(page: number, size: number): Promise<[User[], number]> {
    return this.users.findAndCount({
      skip: (page - 1) * size,
      take: size,
      order: { id: 'ASC' },
    });
  }

  searchByName(name: string, size: number): Promise<User[]> {
    return this.users
      .createQueryBuilder('user')
      .where('user.name ILIKE :name', { name: `%${name}%` })
      .take(size)
      .getMany();
  }

  countAll(): Promise<{ count: string }[]> {
    return this.users.query('SELECT count(*) AS count FROM users');
  }

  create(name: string, passwordHash: string): Promise<User> {
    return this.users.save(this.users.create({ name, passwordHash }));
  }

  rename(id: number, name: string): Promise<unknown> {
    return this.users.update({ id }, { name });
  }
}
