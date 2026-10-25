import { type CustomDecorator, SetMetadata } from '@nestjs/common';

import type { Role } from './roles.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

// 모든 API는 기본으로 로그인이 필요해요(전역 JwtAuthGuard). 열어 둘 API에만 붙여요.
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: Role[]): CustomDecorator =>
  SetMetadata(ROLES_KEY, roles);
