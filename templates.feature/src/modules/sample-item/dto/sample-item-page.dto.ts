import { PageMetaDto } from '@/common/pagination/page.dto.js';

import { SampleItemResponseDto } from './sample-item-response.dto.js';

// 목록 응답이에요. 제네릭 PageDto<T>는 Swagger가 items 타입을 몰라서 feature마다 구체 클래스로 적어요.
export class SampleItemPageDto {
  items: SampleItemResponseDto[];
  meta: PageMetaDto;
}
