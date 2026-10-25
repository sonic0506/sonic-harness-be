import { Module } from '@nestjs/common';

import { SampleItemController } from './sample-item.controller.js';
import { SampleItemService } from './sample-item.service.js';

// DB 테이블이 없는 feature예요(--no-entity). 다른 feature가 필요하면 그 Module을 imports에 더해요.
@Module({
  controllers: [SampleItemController],
  providers: [SampleItemService],
  exports: [SampleItemService],
})
export class SampleItemModule {}
