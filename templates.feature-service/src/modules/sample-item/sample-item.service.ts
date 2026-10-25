import { Injectable } from '@nestjs/common';

import type { CreateSampleItemDto } from './dto/create-sample-item.dto.js';
import { SampleItemResponseDto } from './dto/sample-item-response.dto.js';

// 다른 feature는 그 index.ts의 service를 생성자로 받아 조합해요(DB는 그 feature의 repository가 다뤄요).
@Injectable()
export class SampleItemService {
  create(dto: CreateSampleItemDto): Promise<SampleItemResponseDto> {
    return Promise.resolve(SampleItemResponseDto.of(dto.name));
  }
}
