// expect: sonic-be/no-internal-mock
vi.mock('./user.repository.js');

describe('UserService', () => {
  it('사용자를 찾아요', () => {
    expect(true).toBe(true);
  });
});
