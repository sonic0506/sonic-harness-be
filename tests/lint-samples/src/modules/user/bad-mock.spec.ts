// expect: sonic-be/no-internal-mock
jest.mock('./user.repository');

describe('UserService', () => {
  it('사용자를 찾아요', () => {
    expect(true).toBe(true);
  });
});
