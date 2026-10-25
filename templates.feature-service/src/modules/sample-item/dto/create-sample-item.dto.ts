import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSampleItemDto {
  /** 이름 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
