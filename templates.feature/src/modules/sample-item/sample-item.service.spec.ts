import { Test } from '@nestjs/testing';

import { PageQueryDto } from '@/common/pagination/page-query.dto.js';

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
    findPage: vi.fn<SampleItemRepository['findPage']>(),
    create: vi.fn<SampleItemRepository['create']>(),
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

  it('목록은 page·size로 건너뛸 개수를 계산하고 전체 개수를 함께 돌려줘요', async () => {
    repository.findPage.mockResolvedValue([[item(3, '셋')], 3]);
    const query = Object.assign(new PageQueryDto(), { page: 2, size: 2 });

    const result = await service.findPage(query);

    expect(repository.findPage).toHaveBeenCalledWith(2, 2);
    expect(result).toMatchObject({
      items: [{ id: 3, name: '셋' }],
      meta: { page: 2, size: 2, total: 3 },
    });
  });

  it('있는 id를 조회하면 응답 DTO로 돌려줘요', async () => {
    repository.findById.mockResolvedValue(item(1, '하나'));

    await expect(service.findOne(1)).resolves.toMatchObject({
      id: 1,
      name: '하나',
    });
  });

  it('없는 id를 조회하면 SampleItemNotFoundException을 던져요', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toBeInstanceOf(
      SampleItemNotFoundException,
    );
  });

  it('만들면 저장한 항목을 돌려줘요', async () => {
    repository.create.mockResolvedValue(item(1, '새 항목'));

    await expect(service.create({ name: '새 항목' })).resolves.toMatchObject({
      id: 1,
      name: '새 항목',
    });
    expect(repository.create).toHaveBeenCalledWith('새 항목');
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

  it('없는 항목을 수정하면 SampleItemNotFoundException을 던져요', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.update(1, { name: 'x' })).rejects.toBeInstanceOf(
      SampleItemNotFoundException,
    );
  });

  it('지우면 끝나고, 지울 대상이 없으면 SampleItemNotFoundException을 던져요', async () => {
    repository.delete.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(service.delete(1)).resolves.toBeUndefined();
    await expect(service.delete(2)).rejects.toBeInstanceOf(
      SampleItemNotFoundException,
    );
  });
});
