import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { bearer, createTestApp, resetDatabase } from './setup/test-app.js';

describe('/v1/sample-items', () => {
  let app: INestApplication;
  let auth: string;

  beforeAll(async () => {
    app = await createTestApp();
    auth = bearer(app);
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  const create = (name: string) =>
    request(app.getHttpServer())
      .post('/v1/sample-items')
      .set('Authorization', auth)
      .send({ name });

  it('이름을 보내면 201과 만든 항목을 돌려줘요', async () => {
    const response = await create('첫 항목').expect(201);

    expect(response.body).toMatchObject({ id: 1, name: '첫 항목' });
  });

  it('이름이 비어 있으면 400과 필드 에러를 돌려줘요', async () => {
    const response = await create('').expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'name' }],
    });
  });

  it('정의하지 않은 필드를 보내면 400을 돌려줘요', async () => {
    await request(app.getHttpServer())
      .post('/v1/sample-items')
      .set('Authorization', auth)
      .send({ name: '항목', role: 'admin' })
      .expect(400);
  });

  it('목록은 size만큼 나누고 전체 개수를 알려 줘요', async () => {
    for (const name of ['하나', '둘', '셋']) await create(name).expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/sample-items?page=1&size=2')
      .set('Authorization', auth)
      .expect(200);

    expect(response.body).toMatchObject({
      items: [{ name: '셋' }, { name: '둘' }],
      meta: { page: 1, size: 2, total: 3 },
    });
  });

  it('없는 항목을 조회하면 404와 에러 코드를 돌려줘요', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/sample-items/999')
      .set('Authorization', auth)
      .expect(404);

    expect(response.body).toMatchObject({ code: 'SAMPLE_ITEM_NOT_FOUND' });
  });

  it('보낸 필드만 수정하고, 지우면 다시 조회할 수 없어요', async () => {
    await create('이전').expect(201);

    await request(app.getHttpServer())
      .patch('/v1/sample-items/1')
      .set('Authorization', auth)
      .send({ name: '새 이름' })
      .expect(200, /새 이름/);
    await request(app.getHttpServer())
      .delete('/v1/sample-items/1')
      .set('Authorization', auth)
      .expect(204);
    await request(app.getHttpServer())
      .get('/v1/sample-items/1')
      .set('Authorization', auth)
      .expect(404);
  });
});
