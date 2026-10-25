// expect: sonic-be/no-direct-env
import { Injectable } from '@nestjs/common';

@Injectable()
export class BadEnvService {
  secret(): string | undefined {
    return process.env.JWT_SECRET;
  }
}
