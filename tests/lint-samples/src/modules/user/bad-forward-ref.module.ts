// expect: no-restricted-imports
import { forwardRef, Module } from '@nestjs/common';

import { OrderModule } from '@/modules/order/index.js';

@Module({ imports: [forwardRef(() => OrderModule)] })
export class BadForwardRefModule {}
