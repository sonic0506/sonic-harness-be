import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

// 목록 조회 API는 이 DTO로 page·size를 받아요. repository에는 take: size로 넘겨요.
export class PageQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size = 20;

  get skip(): number {
    return (this.page - 1) * this.size;
  }
}
