import { Module } from '@nestjs/common';

import { CommonCodesModule } from '@/modules/common-codes/index.js';

import { ProductFormController } from './product-form.controller.js';
import { ProductFormService } from './product-form.service.js';

@Module({
  imports: [CommonCodesModule],
  controllers: [ProductFormController],
  providers: [ProductFormService],
})
export class ProductFormModule {}
