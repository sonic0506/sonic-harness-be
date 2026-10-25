import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { IsOptional, useContainer, validate } from 'class-validator';

import { CommonCodesRepository } from './common-codes.repository.js';
import { CommonCodesService } from './common-codes.service.js';
import { CommonCode } from './entities/common-code.entity.js';
import {
  IsCommonCode,
  IsCommonCodeConstraint,
} from './is-common-code.validator.js';

class CreateDto {
  @IsCommonCode('EXAMPLE_TYPE')
  typeCode: string;
}

class UpdateDto {
  @IsOptional()
  @IsCommonCode('EXAMPLE_TYPE', { allowInactive: true })
  typeCode?: string;
}

const code = (groupId: string, value: string, isActive: boolean): CommonCode =>
  Object.assign(new CommonCode(), {
    groupId,
    code: value,
    name: value,
    isActive,
  });

const CODES: Record<string, CommonCode[]> = {
  EXAMPLE_TYPE: [
    code('EXAMPLE_TYPE', 'A', true),
    code('EXAMPLE_TYPE', 'OLD', false),
  ],
  OTHER_TYPE: [code('OTHER_TYPE', 'B', true)],
};

describe('@IsCommonCode', () => {
  const repository = {
    findByGroup: vi.fn<CommonCodesRepository['findByGroup']>(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    repository.findByGroup.mockImplementation((group) =>
      Promise.resolve(CODES[group] ?? []),
    );
    // 앱과 같이 class-validator가 Nest DI로 검증기를 만들게 해요(DI 설정이 빠지면 여기서 실패해요).
    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        CommonCodesService,
        CommonCodesRepository,
        IsCommonCodeConstraint,
      ],
    })
      .overrideProvider(CommonCodesRepository)
      .useValue(repository)
      .compile();
    useContainer(moduleRef, { fallbackOnErrors: true });
  });

  const errorsOf = async (dto: object) => (await validate(dto)).length;

  it('그룹에 있는 활성 코드면 통과해요', async () => {
    expect(await errorsOf(plainToInstance(CreateDto, { typeCode: 'A' }))).toBe(
      0,
    );
  });

  it('다른 그룹의 코드면 실패해요', async () => {
    expect(await errorsOf(plainToInstance(CreateDto, { typeCode: 'B' }))).toBe(
      1,
    );
  });

  it('없는 코드면 실패해요', async () => {
    expect(
      await errorsOf(plainToInstance(CreateDto, { typeCode: 'NONE' })),
    ).toBe(1);
  });

  it('비활성 코드는 새로 고를 수 없지만, allowInactive면 받아 줘요', async () => {
    expect(
      await errorsOf(plainToInstance(CreateDto, { typeCode: 'OLD' })),
    ).toBe(1);
    expect(
      await errorsOf(plainToInstance(UpdateDto, { typeCode: 'OLD' })),
    ).toBe(0);
  });

  it('수정 DTO에서 필드를 보내지 않으면 검증하지 않아요', async () => {
    expect(await errorsOf(plainToInstance(UpdateDto, {}))).toBe(0);
    expect(repository.findByGroup).not.toHaveBeenCalled();
  });

  it('DB 조회가 실패하면 잘못된 값이 아니라 예외로 끝나요', async () => {
    repository.findByGroup.mockRejectedValue(new Error('connection refused'));

    await expect(
      validate(plainToInstance(CreateDto, { typeCode: 'A' })),
    ).rejects.toThrow('connection refused');
  });

  it('같은 그룹을 여러 번 검증해도 DB는 한 번만 조회해요', async () => {
    await errorsOf(plainToInstance(CreateDto, { typeCode: 'A' }));
    await errorsOf(plainToInstance(CreateDto, { typeCode: 'OLD' }));

    expect(repository.findByGroup).toHaveBeenCalledTimes(1);
  });
});
