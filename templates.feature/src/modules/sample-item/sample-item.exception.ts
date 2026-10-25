import { HttpStatus } from '@nestjs/common';

import { AppException } from '@/common/exceptions/app.exception.js';

export class SampleItemNotFoundException extends AppException {
  constructor(id: number) {
    super(
      'SAMPLE_ITEM_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `sample-item ${id}을(를) 찾을 수 없어요.`,
    );
  }
}
