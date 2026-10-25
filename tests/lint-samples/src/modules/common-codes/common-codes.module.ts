import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonCodesRepository } from './common-codes.repository.js';
import { CommonCodesService } from './common-codes.service.js';
import { CommonCode } from './entities/common-code.entity.js';
import { IsCommonCodeConstraint } from './is-common-code.validator.js';

@Module({
  imports: [TypeOrmModule.forFeature([CommonCode])],
  providers: [
    CommonCodesService,
    CommonCodesRepository,
    IsCommonCodeConstraint,
  ],
  exports: [CommonCodesService, IsCommonCodeConstraint],
})
export class CommonCodesModule {}
