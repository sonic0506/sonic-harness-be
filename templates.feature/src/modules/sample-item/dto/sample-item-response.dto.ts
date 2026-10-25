import type { SampleItem } from '../entities/sample-item.entity.js';

export class SampleItemResponseDto {
  id: number;
  name: string;
  createdAt: Date;

  static from(entity: SampleItem): SampleItemResponseDto {
    const dto = new SampleItemResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
