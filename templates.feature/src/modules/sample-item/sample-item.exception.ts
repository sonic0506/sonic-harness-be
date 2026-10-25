import { HttpStatus } from '@nestjs/common';

import { AppException } from '@/common/exceptions/app.exception.js';

// static code·status·example은 Swagger 에러 예시(@ApiErrors)가 읽어요.
export class SampleItemNotFoundException extends AppException {
  static readonly code = 'SAMPLE_ITEM_NOT_FOUND';
  static readonly status = HttpStatus.NOT_FOUND;
  static readonly example = 'sample-item 1을(를) 찾을 수 없어요.';

  constructor(id: number) {
    super(
      SampleItemNotFoundException.code,
      SampleItemNotFoundException.status,
      `sample-item ${id}을(를) 찾을 수 없어요.`,
    );
  }
}
