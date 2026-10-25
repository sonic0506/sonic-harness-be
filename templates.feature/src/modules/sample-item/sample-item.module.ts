import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleItem } from './entities/sample-item.entity.js';
import { SampleItemController } from './sample-item.controller.js';
import { SampleItemRepository } from './sample-item.repository.js';
import { SampleItemService } from './sample-item.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SampleItem])],
  controllers: [SampleItemController],
  providers: [SampleItemService, SampleItemRepository],
  exports: [SampleItemService],
})
export class SampleItemModule {}
