// supertest 대신 같은 모양의 가짜예요(샘플 폴더에는 supertest가 없어요).
const request = (url: string) => ({
  post: (path: string) => ({
    expect: (status: number) => Promise.resolve(`${url}${path} ${status}`),
  }),
});

// 도우미로 감싼 .expect(...)도 단언으로 쳐요(vitest/expect-expect).
const create = () => request('http://localhost').post('/v1/users');

describe('도우미', () => {
  it('이름을 보내면 201을 돌려줘요', async () => {
    await create().expect(201);
  });
});
