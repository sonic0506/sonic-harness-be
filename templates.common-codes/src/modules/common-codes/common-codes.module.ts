import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { COMMON_CODE_CACHE_TTL_MS } from './common-code-groups.constants.js';
import { CommonCodesController } from './common-codes.controller.js';
import { CommonCodesRepository } from './common-codes.repository.js';
import { CommonCodesService } from './common-codes.service.js';
import { CommonCode } from './entities/common-code.entity.js';
import { CommonCodeGroup } from './entities/common-code-group.entity.js';
import { IsCommonCodeConstraint } from './is-common-code.validator.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommonCode, CommonCodeGroup]),
    CacheModule.register({ ttl: COMMON_CODE_CACHE_TTL_MS }),
  ],
  controllers: [CommonCodesController],
  providers: [
    CommonCodesService,
    CommonCodesRepository,
    IsCommonCodeConstraint,
  ],
  exports: [CommonCodesService, IsCommonCodeConstraint],
})
export class CommonCodesModule {}
