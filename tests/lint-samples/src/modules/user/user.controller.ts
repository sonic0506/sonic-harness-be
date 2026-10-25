import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
} from '@nestjs/common';

import { PageDto } from '@/common/pagination/page.dto';
import { PageQueryDto } from '@/common/pagination/page-query.dto';

import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findPage(@Query() query: PageQueryDto): Promise<PageDto<UserResponseDto>> {
    return this.userService.findPage(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(dto);
  }

  @Post(':id/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  uploadAvatar(
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Buffer,
  ): void {
    void file;
  }
}
