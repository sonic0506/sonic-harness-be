import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { bearer, createTestApp } from './setup/test-app.js';

describe('/v1/sample-items', () => {
  let app: INestApplication;
  let auth: string;

  beforeAll(async () => {
    app = await createTestApp();
    auth = bearer(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('이름을 보내면 201과 결과를 돌려줘요', async () => {
    await request(app.getHttpServer())
      .post('/v1/sample-items')
      .set('Authorization', auth)
      .send({ name: '하나' })
      .expect(201, { name: '하나' });
  });

  it('이름이 비어 있으면 400과 필드 에러를 돌려줘요', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/sample-items')
      .set('Authorization', auth)
      .send({ name: '' })
      .expect(400);

    expect(response.body).toMatchObject({ errors: [{ field: 'name' }] });
  });
});
