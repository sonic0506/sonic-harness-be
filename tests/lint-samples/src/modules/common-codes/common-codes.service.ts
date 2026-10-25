import { Injectable } from '@nestjs/common';

import { CommonCodesRepository } from './common-codes.repository.js';

@Injectable()
export class CommonCodesService {
  constructor(private readonly commonCodesRepository: CommonCodesRepository) {}

  async isActiveCode(group: unknown, code: unknown): Promise<boolean> {
    if (typeof group !== 'string' || typeof code !== 'string') return false;
    const found = await this.commonCodesRepository.findActive(group, code);
    return found !== null;
  }
}
