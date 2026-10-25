import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { Repository } from 'typeorm';

import { MAX_CODES_PER_GROUP } from './common-code-groups.constants.js';
import { CommonCode } from './entities/common-code.entity.js';

@Injectable()
export class CommonCodesRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  private get codes(): Repository<CommonCode> {
    return this.txHost.tx.getRepository(CommonCode);
  }

  // 활성·비활성을 모두 가져와요. 걸러 내는 일은 service가 해요(캐시를 하나로 쓰려고요).
  findByGroup(groupId: string): Promise<CommonCode[]> {
    return this.codes.find({
      where: { groupId },
      order: { sortOrder: 'ASC', code: 'ASC' },
      take: MAX_CODES_PER_GROUP,
    });
  }

  findOne(groupId: string, code: string): Promise<CommonCode | null> {
    return this.codes.findOne({ where: { groupId, code } });
  }

  insert(
    fields: Pick<CommonCode, 'groupId' | 'code' | 'name' | 'sortOrder'>,
  ): Promise<CommonCode> {
    return this.codes.save(this.codes.create(fields));
  }

  save(entity: CommonCode): Promise<CommonCode> {
    return this.codes.save(entity);
  }
}
