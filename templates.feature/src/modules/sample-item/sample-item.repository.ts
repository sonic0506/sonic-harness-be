import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { Repository } from 'typeorm';

import { SampleItem } from './entities/sample-item.entity.js';

// DB 접근은 여기서만 해요. TransactionHost를 거쳐야 @Transactional() 안에서 같은 트랜잭션을 써요.
@Injectable()
export class SampleItemRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  private get items(): Repository<SampleItem> {
    return this.txHost.tx.getRepository(SampleItem);
  }

  findById(id: number): Promise<SampleItem | null> {
    return this.items.findOne({ where: { id } });
  }

  findPage(skip: number, take: number): Promise<[SampleItem[], number]> {
    return this.items.findAndCount({ order: { id: 'DESC' }, skip, take });
  }

  create(name: string): Promise<SampleItem> {
    return this.items.save(this.items.create({ name }));
  }

  save(entity: SampleItem): Promise<SampleItem> {
    return this.items.save(entity);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.items.delete({ id });
    return Boolean(result.affected);
  }
}
