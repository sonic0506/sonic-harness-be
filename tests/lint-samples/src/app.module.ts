import { Module } from '@nestjs/common';

import { ProductFormModule } from './compositions/product-form/product-form.module';
import { CommonCodesModule } from './modules/common-codes';
import { OrderModule } from './modules/order';
import { UserModule } from './modules/user';

@Module({
  imports: [UserModule, OrderModule, CommonCodesModule, ProductFormModule],
})
export class AppModule {}
