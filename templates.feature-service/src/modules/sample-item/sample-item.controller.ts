import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateSampleItemDto } from './dto/create-sample-item.dto.js';
import { SampleItemResponseDto } from './dto/sample-item-response.dto.js';
import { SampleItemService } from './sample-item.service.js';

// 에러: 던질 수 있는 비즈니스 예외는 @ApiErrors로 Swagger에 적어요(400·401·403은 자동이에요).
// 권한: 뼈대는 로그인만 확인해요. 이 feature에 맞게 @Public(), @Roles('admin'), 본인 범위(user.sub)를 정해요(harness.md 5절).
@ApiTags('sample-items')
@Controller('sample-items')
export class SampleItemController {
  constructor(private readonly sampleItemService: SampleItemService) {}

  /** 요청을 처리해요. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSampleItemDto): Promise<SampleItemResponseDto> {
    return this.sampleItemService.create(dto);
  }
}
