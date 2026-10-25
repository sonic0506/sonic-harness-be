import { Module } from '@nestjs/common';

import { ProductFormModule } from './compositions/product-form/product-form.module.js';
import { CommonCodesModule } from './modules/common-codes/index.js';
import { OrderModule } from './modules/order/index.js';
import { UserModule } from './modules/user/index.js';

@Module({
  imports: [UserModule, OrderModule, CommonCodesModule, ProductFormModule],
})
export class AppModule {}
