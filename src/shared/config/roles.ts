import { z } from 'zod';

export const RoleSchema = z
  .enum(['admin', 'ops', 'ADMIN', 'OPS'])
  .transform((r) => r.toLowerCase() as 'admin' | 'ops');
export type Role = 'admin' | 'ops';
