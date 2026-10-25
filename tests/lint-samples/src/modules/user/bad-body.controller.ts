// expect: sonic-be/dto-param-type
import { Body, Controller, Post } from '@nestjs/common';

import { UserResponseDto } from './dto/user-response.dto';

@Controller('bad-body')
export class BadBodyController {
  @Post()
  create(@Body() body: { name: string }): UserResponseDto {
    return Object.assign(new UserResponseDto(), body);
  }
}
