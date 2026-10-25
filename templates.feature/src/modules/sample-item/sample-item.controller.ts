import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageDto } from '@/common/pagination/page.dto.js';
import { PageQueryDto } from '@/common/pagination/page-query.dto.js';

import { CreateSampleItemDto } from './dto/create-sample-item.dto.js';
import { SampleItemResponseDto } from './dto/sample-item-response.dto.js';
import { UpdateSampleItemDto } from './dto/update-sample-item.dto.js';
import { SampleItemService } from './sample-item.service.js';

// 권한: 뼈대는 로그인만 확인해요. 이 feature에 맞게 @Roles('admin')이나 소유자 범위(request.user.sub)를 정해요(harness.md 5절).
@ApiTags('sample-items')
@Controller('sample-items')
export class SampleItemController {
  constructor(private readonly sampleItemService: SampleItemService) {}

  /** 목록을 페이지 단위로 조회해요. */
  @Get()
  findPage(
    @Query() query: PageQueryDto,
  ): Promise<PageDto<SampleItemResponseDto>> {
    return this.sampleItemService.findPage(query);
  }

  /** 하나를 조회해요. */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SampleItemResponseDto> {
    return this.sampleItemService.findOne(id);
  }

  /** 새로 만들어요. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSampleItemDto): Promise<SampleItemResponseDto> {
    return this.sampleItemService.create(dto);
  }

  /** 보낸 필드만 바꿔요. */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSampleItemDto,
  ): Promise<SampleItemResponseDto> {
    return this.sampleItemService.update(id, dto);
  }

  /** 지워요. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sampleItemService.delete(id);
  }
}
