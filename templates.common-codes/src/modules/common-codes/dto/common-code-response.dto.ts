import type { CommonCode } from '../entities/common-code.entity.js';

export class CommonCodeResponseDto {
  groupId: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;

  static from(entity: CommonCode): CommonCodeResponseDto {
    const dto = new CommonCodeResponseDto();
    dto.groupId = entity.groupId;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}
