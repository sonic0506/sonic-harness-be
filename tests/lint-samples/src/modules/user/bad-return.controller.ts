// expect: sonic-be/handler-return-dto
import { Controller, Get } from '@nestjs/common';

import { UserService } from './user.service.js';

@Controller('bad-return')
export class BadReturnController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findOne() {
    return this.userService.findOne(1);
  }

  @Get('name')
  async name(): Promise<string> {
    const user = await this.userService.findOne(1);
    return user.name;
  }
}
