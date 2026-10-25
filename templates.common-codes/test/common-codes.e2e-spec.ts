import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { bearer, createTestApp, resetDatabase } from './setup/test-app.js';

describe('/v1/common-codes', () => {
  let app: INestApplication;
  let admin: string;
  let user: string;

  beforeAll(async () => {
    app = await createTestApp();
    admin = bearer(app, { sub: 'admin', roles: ['admin'] });
    user = bearer(app);
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  const create = (body: object, token = admin) =>
    request(app.getHttpServer())
      .post('/v1/common-codes/EXAMPLE_TYPE')
      .set('Authorization', token)
      .send(body);

  it('관리자가 아니면 코드를 추가할 때 403을 돌려줘요', async () => {
    const response = await create({ code: 'A', name: '가' }, user);

    expect(response.status).toBe(403);
  });

  it('같은 그룹에 같은 코드를 또 추가하면 409를 돌려줘요', async () => {
    await create({ code: 'A', name: '가' }).expect(201);

    const response = await create({ code: 'A', name: '또' }).expect(409);

    expect(response.body).toMatchObject({ code: 'COMMON_CODE_DUPLICATE' });
  });

  it('선택 목록은 활성 코드만 정렬 순서대로 { value, label }로 돌려줘요', async () => {
    await create({ code: 'B', name: '나', sortOrder: 2 }).expect(201);
    await create({ code: 'A', name: '가', sortOrder: 1 }).expect(201);
    await create({ code: 'C', name: '다', sortOrder: 3 }).expect(201);
    await request(app.getHttpServer())
      .patch('/v1/common-codes/EXAMPLE_TYPE/C')
      .set('Authorization', admin)
      .send({ isActive: false })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/v1/common-codes/EXAMPLE_TYPE/options')
      .set('Authorization', user)
      .expect(200);

    expect(response.body).toEqual([
      { value: 'A', label: '가' },
      { value: 'B', label: '나' },
    ]);
  });

  it('없는 그룹은 404를 돌려줘요', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/common-codes/NOPE/options')
      .set('Authorization', user)
      .expect(404);

    expect(response.body).toMatchObject({
      code: 'COMMON_CODE_GROUP_NOT_FOUND',
    });
  });
});
