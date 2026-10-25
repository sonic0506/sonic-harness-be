import { z } from 'zod';

export const ROLES = ['admin', 'user'] as const;
export type Role = (typeof ROLES)[number];

// JWT payload에서 꺼내 request.user에 두는 값이에요.
export const authUserSchema = z.object({
  sub: z.string(),
  roles: z.array(z.enum(ROLES)),
});
export type AuthUser = z.infer<typeof authUserSchema>;
