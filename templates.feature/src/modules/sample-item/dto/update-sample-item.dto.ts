import { PartialType } from '@nestjs/swagger';

import { CreateSampleItemDto } from './create-sample-item.dto.js';

// 수정은 보낸 필드만 검증하고 바꿔요(모든 필드가 @IsOptional이 돼요).
export class UpdateSampleItemDto extends PartialType(CreateSampleItemDto) {}
