import type { User } from '../entities/user.entity';

export class UserResponseDto {
  id!: number;
  name!: string;

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    return dto;
  }
}
