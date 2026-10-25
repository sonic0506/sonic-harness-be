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

export interface IsCommonCodeOptions extends ValidationOptions {
  /** 수정 DTO에서 이미 연결된 비활성 코드를 받아 줄 때만 켜요. 바뀐 값이면 service에서 활성인지 다시 확인해요. */
  allowInactive?: boolean;
}

// 존재·그룹 일치·활성 여부를 확인해요. 형식 검증(@IsString 등)은 따로 붙여요.
// 예외를 잡아 false로 바꾸지 않아요: DB 장애는 400이 아니라 500이어야 해요(lint: validator-no-swallow).
@ValidatorConstraint({ name: 'isCommonCode', async: true })
@Injectable()
export class IsCommonCodeConstraint implements ValidatorConstraintInterface {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const group: unknown = args.constraints[0];
    const allowInactive: unknown = args.constraints[1];
    if (typeof value !== 'string' || typeof group !== 'string') return false;
    return this.commonCodesService.isUsable(
      group,
      value,
      allowInactive === true,
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const group: unknown = args.constraints[0];
    return `${args.property}은(는) ${String(group)} 그룹에서 쓸 수 있는 코드가 아니에요.`;
  }
}

export function IsCommonCode(
  group: CommonCodeGroup,
  options: IsCommonCodeOptions = {},
): PropertyDecorator {
  const { allowInactive = false, ...validationOptions } = options;
  return (target, propertyName) => {
    registerDecorator({
      target: target.constructor,
      propertyName: String(propertyName),
      constraints: [group, allowInactive],
      options: validationOptions,
      validator: IsCommonCodeConstraint,
    });
  };
}

// 이름이 *Code지만 공통 코드가 아닌 필드에 붙여요(lint: code-field-explicit). 동작은 없어요.
export function NotCommonCode(): PropertyDecorator {
  return () => undefined;
}
