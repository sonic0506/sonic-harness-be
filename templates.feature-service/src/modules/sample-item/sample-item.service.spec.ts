import { Test } from '@nestjs/testing';

import { SampleItemService } from './sample-item.service.js';

describe('SampleItemService', () => {
  let service: SampleItemService;

  beforeEach(async () => {
    // 다른 feature service에 기대면 그 service만 overrideProvider로 바꿔요(harness.md 7절).
    const moduleRef = await Test.createTestingModule({
      providers: [SampleItemService],
    }).compile();
    service = moduleRef.get(SampleItemService);
  });

  it('이름을 보내면 응답 DTO로 돌려줘요', async () => {
    await expect(service.create({ name: '하나' })).resolves.toEqual({
      name: '하나',
    });
  });
});
