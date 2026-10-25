import { HttpStatus } from '@nestjs/common';

import { AppException } from '@/common/exceptions/app.exception.js';

// static code·status·example은 Swagger 에러 예시(@ApiErrors)가 읽어요.
export class CommonCodeGroupNotFoundException extends AppException {
  static readonly code = 'COMMON_CODE_GROUP_NOT_FOUND';
  static readonly status = HttpStatus.NOT_FOUND;
  static readonly example = '공통 코드 그룹 EXAMPLE_TYPE이(가) 없어요.';

  constructor(groupId: string) {
    super(
      CommonCodeGroupNotFoundException.code,
      CommonCodeGroupNotFoundException.status,
      `공통 코드 그룹 ${groupId}이(가) 없어요.`,
    );
  }
}

export class CommonCodeNotFoundException extends AppException {
  static readonly code = 'COMMON_CODE_NOT_FOUND';
  static readonly status = HttpStatus.NOT_FOUND;
  static readonly example = '공통 코드 EXAMPLE_TYPE.A이(가) 없어요.';

  constructor(groupId: string, code: string) {
    super(
      CommonCodeNotFoundException.code,
      CommonCodeNotFoundException.status,
      `공통 코드 ${groupId}.${code}이(가) 없어요.`,
    );
  }
}

export class CommonCodeDuplicateException extends AppException {
  static readonly code = 'COMMON_CODE_DUPLICATE';
  static readonly status = HttpStatus.CONFLICT;
  static readonly example = '공통 코드 EXAMPLE_TYPE.A이(가) 이미 있어요.';

  constructor(groupId: string, code: string) {
    super(
      CommonCodeDuplicateException.code,
      CommonCodeDuplicateException.status,
      `공통 코드 ${groupId}.${code}이(가) 이미 있어요.`,
    );
  }
}
