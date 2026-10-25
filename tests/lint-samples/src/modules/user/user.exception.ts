import { HttpStatus } from '@nestjs/common';

import { AppException } from '@/common/exceptions/app.exception.js';

export class UserNotFoundException extends AppException {
  constructor(id: number) {
    super(
      'USER_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `사용자 ${id}를 찾을 수 없어요.`,
    );
  }
}
