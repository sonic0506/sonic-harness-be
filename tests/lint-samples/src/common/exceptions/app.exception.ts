import type { HttpStatus } from '@nestjs/common';

export class AppException extends Error {
  constructor(
    readonly code: string,
    readonly status: HttpStatus,
    message: string,
  ) {
    super(message);
  }
}
