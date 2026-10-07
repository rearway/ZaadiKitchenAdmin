import { z } from 'zod';
import { RoleSchema } from '@/shared/config/roles';

export const UserSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().email(),
    role: RoleSchema,
  })
  .transform((u) => ({
    id: u.id,
    name: u.name ?? u.fullName ?? '',
    email: u.email,
    role: u.role,
  }));
export type User = z.infer<typeof UserSchema>;

// erasableSyntaxOnly forbids constructor parameter properties — use explicit declarations
export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: unknown;

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

/** Unwrap the standard { message, data } envelope returned by this API. */
export function unwrap<T>(responseData: unknown, schema: z.ZodType<T>): T {
  const envelope = z.object({ data: z.unknown() }).passthrough().safeParse(responseData);
  const payload = envelope.success ? envelope.data.data : responseData;

  const result = schema.safeParse(payload);
  if (!result.success) {
    console.error('[API] Schema parse failed. Raw payload received:', payload);
    console.error('[API] Zod issues (path → message):', result.error.issues.map((i) => `${i.path.join(' → ') || 'root'}: ${i.message}`));
    const issues = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
      .join('; ');
    throw new ApiError(`Schema mismatch — ${issues}`, 422, result.error.issues);
  }
  return result.data;
}
