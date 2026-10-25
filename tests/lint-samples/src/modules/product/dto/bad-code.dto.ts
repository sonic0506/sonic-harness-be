// expect: sonic-be/code-field-explicit
import { IsString } from 'class-validator';

export class BadCodeDto {
  @IsString()
  colorCode!: string;
}
