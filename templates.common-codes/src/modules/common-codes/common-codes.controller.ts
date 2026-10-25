import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/auth/auth.decorators.js';
import { OptionDto } from '@/common/options/option.dto.js';

import { CommonCodesService } from './common-codes.service.js';
import { CommonCodeResponseDto } from './dto/common-code-response.dto.js';
import { CreateCommonCodeDto } from './dto/create-common-code.dto.js';
import { UpdateCommonCodeDto } from './dto/update-common-code.dto.js';

@ApiTags('common-codes')
@Controller('common-codes')
export class CommonCodesController {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  /** 선택 목록: 활성 코드만 정렬 순서대로 { value, label }로 돌려줘요. */
  @Get(':groupId/options')
  findOptions(@Param('groupId') groupId: string): Promise<OptionDto[]> {
    return this.commonCodesService.findOptions(groupId);
  }

  /** 관리용 목록(비활성 포함) */
  @Get(':groupId')
  @Roles('admin')
  findAll(@Param('groupId') groupId: string): Promise<CommonCodeResponseDto[]> {
    return this.commonCodesService.findAll(groupId);
  }

  /** 코드를 추가해요. */
  @Post(':groupId')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('groupId') groupId: string,
    @Body() dto: CreateCommonCodeDto,
  ): Promise<CommonCodeResponseDto> {
    return this.commonCodesService.create(groupId, dto);
  }

  /** 이름·정렬·사용 여부를 바꿔요. 코드 값은 바꿀 수 없고, 삭제 대신 isActive: false로 꺼요. */
  @Patch(':groupId/:code')
  @Roles('admin')
  update(
    @Param('groupId') groupId: string,
    @Param('code') code: string,
    @Body() dto: UpdateCommonCodeDto,
  ): Promise<CommonCodeResponseDto> {
    return this.commonCodesService.update(groupId, code, dto);
  }
}
