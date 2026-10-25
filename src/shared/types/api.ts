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

const ApiErrorBodySchema = z
  .object({
    errorCode: z.string().optional(),
    error: z.string().optional(),
    details: z.unknown().optional(),
    affected_weeks: z.array(z.string()).optional(),
    affects_live_menu: z.boolean().optional(),
  })
  .passthrough();

// erasableSyntaxOnly forbids constructor parameter properties — use explicit declarations
export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: unknown;
  readonly errorCode: string | null;
  readonly details: unknown;
  readonly affectedWeeks: string[];

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
    const parsed = ApiErrorBodySchema.safeParse(body);
    const data = parsed.success ? parsed.data : null;
    this.errorCode = data ? (data.errorCode ?? data.error ?? null) : null;
    this.details = data?.details;
    this.affectedWeeks = data?.affected_weeks ?? [];
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

/**
 * Soft-delete body used by admin meal and area DELETE.
 * Accepts the `{ message, data: { deleted, deletedAt } }` envelope, snake_case
 * `deleted_at`, or an empty 204 body. A missing flag still counts as deleted
 * when the request itself succeeded.
 */
export const SoftDeleteResultSchema = z
  .object({
    id: z.string().optional(),
    meal_id: z.string().optional(),
    mealId: z.string().optional(),
    area_id: z.string().optional(),
    areaId: z.string().optional(),
    deleted: z.boolean().optional(),
    deletedAt: z.string().nullable().optional(),
    deleted_at: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id ?? row.meal_id ?? row.mealId ?? row.area_id ?? row.areaId ?? null,
    deleted: row.deleted ?? true,
    deletedAt: row.deletedAt ?? row.deleted_at ?? null,
  }));
export type SoftDeleteResult = z.infer<typeof SoftDeleteResultSchema>;

export function parseSoftDeleteResponse(responseData: unknown): SoftDeleteResult {
  if (responseData == null || responseData === '') {
    return { id: null, deleted: true, deletedAt: null };
  }
  const envelope = z.object({ data: z.unknown() }).passthrough().safeParse(responseData);
  if (envelope.success && (envelope.data.data == null || envelope.data.data === '')) {
    return { id: null, deleted: true, deletedAt: null };
  }
  return unwrap(responseData, SoftDeleteResultSchema);
}
