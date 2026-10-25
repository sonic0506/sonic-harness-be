import { Injectable } from '@nestjs/common';

import { PageDto } from '@/common/pagination/page.dto.js';
import type { PageQueryDto } from '@/common/pagination/page-query.dto.js';

import type { CreateSampleItemDto } from './dto/create-sample-item.dto.js';
import type { SampleItemPageDto } from './dto/sample-item-page.dto.js';
import { SampleItemResponseDto } from './dto/sample-item-response.dto.js';
import type { UpdateSampleItemDto } from './dto/update-sample-item.dto.js';
import { SampleItemNotFoundException } from './sample-item.exception.js';
import { SampleItemRepository } from './sample-item.repository.js';

@Injectable()
export class SampleItemService {
  constructor(private readonly sampleItemRepository: SampleItemRepository) {}

  async findPage(query: PageQueryDto): Promise<SampleItemPageDto> {
    const [items, total] = await this.sampleItemRepository.findPage(
      query.skip,
      query.size,
    );
    return PageDto.of(
      items.map((item) => SampleItemResponseDto.from(item)),
      total,
      query,
    );
  }

  async findOne(id: number): Promise<SampleItemResponseDto> {
    const item = await this.sampleItemRepository.findById(id);
    if (!item) throw new SampleItemNotFoundException(id);
    return SampleItemResponseDto.from(item);
  }

  async create(dto: CreateSampleItemDto): Promise<SampleItemResponseDto> {
    const item = await this.sampleItemRepository.create(dto.name);
    return SampleItemResponseDto.from(item);
  }

  async update(
    id: number,
    dto: UpdateSampleItemDto,
  ): Promise<SampleItemResponseDto> {
    const item = await this.sampleItemRepository.findById(id);
    if (!item) throw new SampleItemNotFoundException(id);
    if (dto.name !== undefined) item.name = dto.name;
    return SampleItemResponseDto.from(
      await this.sampleItemRepository.save(item),
    );
  }

  async delete(id: number): Promise<void> {
    const isDeleted = await this.sampleItemRepository.delete(id);
    if (!isDeleted) throw new SampleItemNotFoundException(id);
  }
}
