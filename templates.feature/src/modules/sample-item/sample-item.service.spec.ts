import { Test } from '@nestjs/testing';

import { SampleItem } from './entities/sample-item.entity.js';
import { SampleItemNotFoundException } from './sample-item.exception.js';
import { SampleItemRepository } from './sample-item.repository.js';
import { SampleItemService } from './sample-item.service.js';

const item = (id: number, name: string): SampleItem =>
  Object.assign(new SampleItem(), {
    id,
    name,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

describe('SampleItemService', () => {
  let service: SampleItemService;
  const repository = {
    findById: vi.fn<SampleItemRepository['findById']>(),
    save: vi.fn<SampleItemRepository['save']>(),
    delete: vi.fn<SampleItemRepository['delete']>(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    // service 단위 테스트는 repository만 바꿔요(overrideProvider). 다른 모듈은 mock하지 않아요.
    const moduleRef = await Test.createTestingModule({
      providers: [SampleItemService, SampleItemRepository],
    })
      .overrideProvider(SampleItemRepository)
      .useValue(repository)
      .compile();
    service = moduleRef.get(SampleItemService);
  });

  it('없는 id를 조회하면 SampleItemNotFoundException을 던져요', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toBeInstanceOf(
      SampleItemNotFoundException,
    );
  });

  it('이름을 보내면 그 필드만 바꿔요', async () => {
    repository.findById.mockResolvedValue(item(1, '이전'));
    repository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await service.update(1, { name: '새 이름' });

    expect(result).toMatchObject({ id: 1, name: '새 이름' });
  });

  it('필드를 보내지 않으면 기존 값을 그대로 둬요', async () => {
    repository.findById.mockResolvedValue(item(1, '그대로'));
    repository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await service.update(1, {});

    expect(result.name).toBe('그대로');
  });

  it('지울 대상이 없으면 SampleItemNotFoundException을 던져요', async () => {
    repository.delete.mockResolvedValue(false);

    await expect(service.delete(1)).rejects.toBeInstanceOf(
      SampleItemNotFoundException,
    );
  });
});
