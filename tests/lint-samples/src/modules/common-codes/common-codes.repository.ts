import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommonCode } from './entities/common-code.entity';

@Injectable()
export class CommonCodesRepository {
  constructor(
    @InjectRepository(CommonCode)
    private readonly codes: Repository<CommonCode>,
  ) {}

  findActive(groupId: string, code: string): Promise<CommonCode | null> {
    return this.codes.findOne({ where: { groupId, code, isActive: true } });
  }
}
