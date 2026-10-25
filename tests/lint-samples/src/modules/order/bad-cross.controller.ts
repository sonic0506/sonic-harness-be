// expect: boundaries/dependencies
import { Controller, Get } from '@nestjs/common';

import { UserResponseDto, UserService } from '@/modules/user/index.js';

@Controller('bad-cross')
export class BadCrossController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findOne(): Promise<UserResponseDto> {
    return this.userService.findOne(1);
  }
}
