import {
  createParamDecorator,
  type CustomDecorator,
  type ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthRequest, AuthUser, Role } from './roles.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

// 모든 API는 기본으로 로그인이 필요해요(전역 JwtAuthGuard). 열어 둘 API에만 붙여요.
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: Role[]): CustomDecorator =>
  SetMetadata(ROLES_KEY, roles);

// 로그인한 사용자: handler(@CurrentUser() user: AuthUser). user.sub로 본인 데이터만 다뤄요.
// guard를 지난 요청이라 늘 있지만, @Public() API에서 쓰면 빈 값 대신 401로 끝내요.
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser => {
    const { user } = context.switchToHttp().getRequest<AuthRequest>();
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
