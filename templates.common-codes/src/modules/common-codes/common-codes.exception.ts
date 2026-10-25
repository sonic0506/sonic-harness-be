import { HttpStatus } from '@nestjs/common';

import { AppException } from '@/common/exceptions/app.exception.js';

export class CommonCodeGroupNotFoundException extends AppException {
  constructor(groupId: string) {
    super(
      'COMMON_CODE_GROUP_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `공통 코드 그룹 ${groupId}이(가) 없어요.`,
    );
  }
}

export class CommonCodeNotFoundException extends AppException {
  constructor(groupId: string, code: string) {
    super(
      'COMMON_CODE_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `공통 코드 ${groupId}.${code}이(가) 없어요.`,
    );
  }
}

export class CommonCodeDuplicateException extends AppException {
  constructor(groupId: string, code: string) {
    super(
      'COMMON_CODE_DUPLICATE',
      HttpStatus.CONFLICT,
      `공통 코드 ${groupId}.${code}이(가) 이미 있어요.`,
    );
  }
}
