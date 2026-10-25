// expect: boundaries/dependencies
import { Controller, Get } from '@nestjs/common';

import { UserRepository } from './user.repository';

@Controller('bad-layer')
export class BadLayerController {
  constructor(private readonly userRepository: UserRepository) {}

  @Get()
  ping(): void {
    void this.userRepository;
  }
}
