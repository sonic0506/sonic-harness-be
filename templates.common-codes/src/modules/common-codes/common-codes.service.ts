import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { OptionDto } from '@/common/options/option.dto.js';

import {
  type CommonCodeGroup,
  isCommonCodeGroup,
} from './common-code-groups.constants.js';
import {
  CommonCodeDuplicateException,
  CommonCodeGroupNotFoundException,
  CommonCodeNotFoundException,
} from './common-codes.exception.js';
import { CommonCodesRepository } from './common-codes.repository.js';
import { CommonCodeResponseDto } from './dto/common-code-response.dto.js';
import type { CreateCommonCodeDto } from './dto/create-common-code.dto.js';
import type { UpdateCommonCodeDto } from './dto/update-common-code.dto.js';
import type { CommonCode } from './entities/common-code.entity.js';

const cacheKey = (group: CommonCodeGroup): string => `common-codes:${group}`;

// 다른 feature는 이 service(또는 @IsCommonCode)로만 공통 코드를 써요. repository에 직접 가지 않아요.
@Injectable()
export class CommonCodesService {
  constructor(
    private readonly commonCodesRepository: CommonCodesRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /** 선택 목록: 활성 코드만, 정렬 순서대로 */
  async findOptions(groupId: string): Promise<OptionDto[]> {
    const codes = await this.codesOf(this.group(groupId));
    return codes
      .filter((code) => code.isActive)
      .map((code) => OptionDto.of(code.code, code.name));
  }

  /** 관리용: 비활성 코드까지 */
  async findAll(groupId: string): Promise<CommonCodeResponseDto[]> {
    const codes = await this.codesOf(this.group(groupId));
    return codes.map((code) => CommonCodeResponseDto.from(code));
  }

  /**
   * 저장·수정 API의 검증용이에요(@IsCommonCode가 불러요). DB 오류는 잡지 않고 그대로 던져요.
   * allowInactive: 이미 연결된 비활성 코드를 그대로 다시 보내는 수정 요청을 받아 줄 때만 켜요.
   */
  async isUsable(
    groupId: string,
    code: string,
    allowInactive = false,
  ): Promise<boolean> {
    if (!isCommonCodeGroup(groupId)) return false;
    const found = (await this.codesOf(groupId)).find(
      (item) => item.code === code,
    );
    return Boolean(found && (allowInactive || found.isActive));
  }

  async create(
    groupId: string,
    dto: CreateCommonCodeDto,
  ): Promise<CommonCodeResponseDto> {
    const group = this.group(groupId);
    if (await this.commonCodesRepository.findOne(group, dto.code))
      throw new CommonCodeDuplicateException(group, dto.code);
    const saved = await this.commonCodesRepository.insert({
      groupId: group,
      code: dto.code,
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
    });
    await this.cache.del(cacheKey(group));
    return CommonCodeResponseDto.from(saved);
  }

  async update(
    groupId: string,
    code: string,
    dto: UpdateCommonCodeDto,
  ): Promise<CommonCodeResponseDto> {
    const group = this.group(groupId);
    const entity = await this.commonCodesRepository.findOne(group, code);
    if (!entity) throw new CommonCodeNotFoundException(group, code);
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder;
    const saved = await this.commonCodesRepository.save(entity);
    await this.cache.del(cacheKey(group));
    return CommonCodeResponseDto.from(saved);
  }

  private group(groupId: string): CommonCodeGroup {
    if (!isCommonCodeGroup(groupId))
      throw new CommonCodeGroupNotFoundException(groupId);
    return groupId;
  }

  private async codesOf(group: CommonCodeGroup): Promise<CommonCode[]> {
    const cached = await this.cache.get<CommonCode[]>(cacheKey(group));
    if (cached) return cached;
    const codes = await this.commonCodesRepository.findByGroup(group);
    await this.cache.set(cacheKey(group), codes);
    return codes;
  }
}
