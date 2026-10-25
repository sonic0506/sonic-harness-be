// expect: sonic-be/validator-no-swallow
import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

import { CommonCodesService } from './common-codes.service.js';

@ValidatorConstraint({ name: 'badSwallow', async: true })
@Injectable()
export class BadSwallowConstraint implements ValidatorConstraintInterface {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  async validate(value: unknown): Promise<boolean> {
    try {
      return await this.commonCodesService.isActiveCode('PRODUCT_TYPE', value);
    } catch {
      return false;
    }
  }
}
