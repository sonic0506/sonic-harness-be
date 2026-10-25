import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsCommonCode, NotCommonCode } from '@/modules/common-codes';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsCommonCode('PRODUCT_TYPE')
  productTypeCode!: string;

  @IsOptional()
  @IsString()
  @NotCommonCode()
  couponCode?: string;
}
