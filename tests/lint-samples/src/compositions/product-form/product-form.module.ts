import { Module } from '@nestjs/common';

import { CommonCodesModule } from '@/modules/common-codes';

import { ProductFormController } from './product-form.controller';
import { ProductFormService } from './product-form.service';

@Module({
  imports: [CommonCodesModule],
  controllers: [ProductFormController],
  providers: [ProductFormService],
})
export class ProductFormModule {}
