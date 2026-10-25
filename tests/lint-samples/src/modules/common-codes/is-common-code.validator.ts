import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

import type { CommonCodeGroup } from './common-code-groups.constants.js';
import { CommonCodesService } from './common-codes.service.js';

@ValidatorConstraint({ name: 'isCommonCode', async: true })
@Injectable()
export class IsCommonCodeConstraint implements ValidatorConstraintInterface {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const group: unknown = args.constraints[0];
    return this.commonCodesService.isActiveCode(group, value);
  }
}

export function IsCommonCode(
  group: CommonCodeGroup,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      target: target.constructor,
      propertyName: String(propertyName),
      constraints: [group],
      options,
      validator: IsCommonCodeConstraint,
    });
  };
}

export function NotCommonCode(): PropertyDecorator {
  return () => undefined;
}
