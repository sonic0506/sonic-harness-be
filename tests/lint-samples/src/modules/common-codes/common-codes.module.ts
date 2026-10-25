import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonCodesRepository } from './common-codes.repository';
import { CommonCodesService } from './common-codes.service';
import { CommonCode } from './entities/common-code.entity';
import { IsCommonCodeConstraint } from './is-common-code.validator';

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
