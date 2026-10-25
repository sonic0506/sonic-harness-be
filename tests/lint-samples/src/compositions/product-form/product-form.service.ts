import { Injectable } from '@nestjs/common';

import { CommonCodesService } from '@/modules/common-codes';

import { ProductFormOptionsDto } from './dto/product-form-options.dto';

@Injectable()
export class ProductFormService {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  async getOptions(): Promise<ProductFormOptionsDto> {
    const isReady = await this.commonCodesService.isActiveCode(
      'PRODUCT_TYPE',
      'BOOK',
    );
    const dto = new ProductFormOptionsDto();
    dto.productTypes = isReady ? [{ value: 'BOOK', label: '도서' }] : [];
    return dto;
  }
}
