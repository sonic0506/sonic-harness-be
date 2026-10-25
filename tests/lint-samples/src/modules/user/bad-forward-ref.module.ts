// expect: no-restricted-imports
import { forwardRef, Module } from '@nestjs/common';

import { OrderModule } from '@/modules/order';

@Module({ imports: [forwardRef(() => OrderModule)] })
export class BadForwardRefModule {}
