import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import {
  CommonCodeDuplicateException,
  CommonCodeGroupNotFoundException,
  CommonCodeNotFoundException,
} from './common-codes.exception.js';
import { CommonCodesRepository } from './common-codes.repository.js';
import { CommonCodesService } from './common-codes.service.js';
import { CommonCode } from './entities/common-code.entity.js';

const code = (value: string, isActive: boolean, sortOrder = 0): CommonCode =>
  Object.assign(new CommonCode(), {
    groupId: 'EXAMPLE_TYPE',
    code: value,
    name: `${value} 이름`,
    isActive,
    sortOrder,
  });

describe('CommonCodesService', () => {
  let service: CommonCodesService;
  const repository = {
    findByGroup: vi.fn<CommonCodesRepository['findByGroup']>(),
    findOne: vi.fn<CommonCodesRepository['findOne']>(),
    insert: vi.fn<CommonCodesRepository['insert']>(),
    save: vi.fn<CommonCodesRepository['save']>(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    repository.findByGroup.mockResolvedValue([
      code('A', true),
      code('B', false),
    ]);
    repository.save.mockImplementation((entity) => Promise.resolve(entity));
    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [CommonCodesService, CommonCodesRepository],
    })
      .overrideProvider(CommonCodesRepository)
      .useValue(repository)
      .compile();
    service = moduleRef.get(CommonCodesService);
  });

  it('선택 목록은 활성 코드만 { value, label }로 돌려줘요', async () => {
    await expect(service.findOptions('EXAMPLE_TYPE')).resolves.toEqual([
      { value: 'A', label: 'A 이름' },
    ]);
  });

  it('관리용 목록은 비활성 코드까지 돌려줘요', async () => {
    const result = await service.findAll('EXAMPLE_TYPE');

    expect(result.map((item) => item.code)).toEqual(['A', 'B']);
  });

  it('없는 그룹이면 CommonCodeGroupNotFoundException을 던지고, 검증에서는 false예요', async () => {
    await expect(service.findOptions('NOPE')).rejects.toBeInstanceOf(
      CommonCodeGroupNotFoundException,
    );
    await expect(service.isUsable('NOPE', 'A')).resolves.toBe(false);
  });

  it('추가하면 정렬 순서 기본값 0으로 저장하고 그룹 캐시를 지워요', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.insert.mockImplementation((fields) =>
      Promise.resolve(
        Object.assign(new CommonCode(), { ...fields, isActive: true }),
      ),
    );
    await service.findOptions('EXAMPLE_TYPE'); // 캐시를 채워요

    await service.create('EXAMPLE_TYPE', { code: 'C', name: '다' });
    await service.findOptions('EXAMPLE_TYPE');

    expect(repository.insert).toHaveBeenCalledWith({
      groupId: 'EXAMPLE_TYPE',
      code: 'C',
      name: '다',
      sortOrder: 0,
    });
    expect(repository.findByGroup).toHaveBeenCalledTimes(2);
  });

  it('같은 코드를 또 추가하면 CommonCodeDuplicateException을 던져요', async () => {
    repository.findOne.mockResolvedValue(code('A', true));

    await expect(
      service.create('EXAMPLE_TYPE', { code: 'A', name: '가', sortOrder: 1 }),
    ).rejects.toBeInstanceOf(CommonCodeDuplicateException);
  });

  it('수정은 보낸 필드만 바꾸고, 없는 코드면 CommonCodeNotFoundException을 던져요', async () => {
    repository.findOne
      .mockResolvedValueOnce(code('A', true, 1))
      .mockResolvedValueOnce(code('A', true, 1))
      .mockResolvedValueOnce(null);

    await expect(
      service.update('EXAMPLE_TYPE', 'A', {
        name: '새 이름',
        isActive: false,
        sortOrder: 5,
      }),
    ).resolves.toMatchObject({
      name: '새 이름',
      isActive: false,
      sortOrder: 5,
    });
    await expect(
      service.update('EXAMPLE_TYPE', 'A', {}),
    ).resolves.toMatchObject({
      name: 'A 이름',
      isActive: true,
      sortOrder: 1,
    });
    await expect(
      service.update('EXAMPLE_TYPE', 'Z', {}),
    ).rejects.toBeInstanceOf(CommonCodeNotFoundException);
  });
});
