import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

describe('UserResponseDto', () => {
  it('엔티티에서 공개 필드만 옮겨요', () => {
    const user = Object.assign(new User(), {
      id: 1,
      name: '소닉',
      passwordHash: 'hash',
    });

    expect(UserResponseDto.from(user)).toEqual({ id: 1, name: '소닉' });
  });
});
