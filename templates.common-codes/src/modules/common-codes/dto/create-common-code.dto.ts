import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCommonCodeDto {
  /** 코드 값. 대문자·숫자·밑줄만 쓰고, 만든 뒤에는 바꾸지 않아요. */
  @Matches(/^[A-Z0-9_]+$/)
  @MaxLength(50)
  code: string;

  /** 화면에 보이는 이름 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  /** 정렬 순서(작을수록 앞) */
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
