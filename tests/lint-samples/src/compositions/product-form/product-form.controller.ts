import { Controller, Get } from '@nestjs/common';

import { ProductFormOptionsDto } from './dto/product-form-options.dto.js';
import { ProductFormService } from './product-form.service.js';

@Controller('product-form')
export class ProductFormController {
  constructor(private readonly productFormService: ProductFormService) {}

  @Get('options')
  getOptions(): Promise<ProductFormOptionsDto> {
    return this.productFormService.getOptions();
  }
}
