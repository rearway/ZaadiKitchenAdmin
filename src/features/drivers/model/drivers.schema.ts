import { z } from 'zod';

/** Saudi +966 and 9 digits, or India +91 and 10 digits (backend OTP phone rules). */
const DRIVER_PHONE = /^\+966[0-9]{9}$|^\+91[0-9]{10}$/;

const DriverAreaSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
  })
  .transform((area) => ({
    id: area.id,
    name: area.name?.trim() ? area.name : null,
  }));

function mergeAreas(
  areas: { id: string; name: string | null }[] | undefined,
  areaIds: string[] | undefined
): { id: string; name: string | null }[] {
  const byId = new Map<string, { id: string; name: string | null }>();
  for (const id of areaIds ?? []) {
    if (!byId.has(id)) byId.set(id, { id, name: null });
  }
  for (const area of areas ?? []) {
    const existing = byId.get(area.id);
    byId.set(area.id, {
      id: area.id,
      name: area.name ?? existing?.name ?? null,
    });
  }
  return [...byId.values()];
}

/** Admin driver from Backend PR #18 (`fullName`, `isActive`, `areas`). */
export const DriverSchema = z
  .object({
    id: z.string(),
    fullName: z.string().optional().nullable(),
    full_name: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    phone: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    areas: z.array(DriverAreaSchema).optional(),
    areaIds: z.array(z.string()).optional(),
    area_ids: z.array(z.string()).optional(),
    createdAt: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
  })
  .transform((driver) => ({
    id: driver.id,
    fullName: (driver.fullName ?? driver.full_name ?? driver.name ?? '').trim(),
    phone: driver.phone ?? '',
    isActive: driver.isActive ?? driver.is_active ?? true,
    areas: mergeAreas(driver.areas, [...(driver.areaIds ?? []), ...(driver.area_ids ?? [])]),
    createdAt: driver.createdAt ?? driver.created_at ?? null,
    updatedAt: driver.updatedAt ?? driver.updated_at ?? null,
  }));
export type Driver = z.infer<typeof DriverSchema>;

export const DriverListSchema = z
  .object({
    drivers: z.array(DriverSchema),
  })
  .transform((list) => ({ drivers: list.drivers }));
export type DriverList = z.infer<typeof DriverListSchema>;

export const DriverResponseSchema = DriverSchema;

/** Strip spaces/dashes and expand a local Saudi mobile (`05…`) to E.164. */
export function normalizeDriverPhone(raw: string): string {
  const compact = raw.replace(/[\s-]/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (compact.startsWith('966') || compact.startsWith('91')) return `+${compact}`;
  if (/^0[0-9]{9}$/.test(compact)) return `+966${compact.slice(1)}`;
  return compact;
}

const areaIdsSchema = z
  .array(z.string().uuid('Select a valid delivery area'))
  .transform((ids) => [...new Set(ids)]);

const driverNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(120, 'Name must be 120 characters or fewer');

const driverPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeDriverPhone)
  .pipe(z.string().regex(DRIVER_PHONE, 'Phone must be +966XXXXXXXXX or +91XXXXXXXXXX'));

/** POST /admin/drivers. `area_ids` may be empty. Do not send other fields. */
export const CreateDriverSchema = z.object({
  full_name: driverNameSchema,
  phone: driverPhoneSchema,
  area_ids: areaIdsSchema,
});
export type CreateDriverInput = z.output<typeof CreateDriverSchema>;

/**
 * PATCH /admin/drivers/:driver_id.
 * `area_ids` replaces the assignment. Send [] to clear. `is_active` is optional on the API;
 * the edit form always sends the chosen value.
 */
export const UpdateDriverSchema = CreateDriverSchema.extend({
  is_active: z.boolean(),
});
export type UpdateDriverInput = z.output<typeof UpdateDriverSchema>;

export function driverAreaLabels(
  driver: Pick<Driver, 'areas'>,
  areaNameById: ReadonlyMap<string, string>
): string[] {
  return driver.areas.map((area) => area.name ?? areaNameById.get(area.id) ?? area.id);
}

/** The list endpoint returns every driver. Search stays in the browser. */
export function filterDrivers(drivers: Driver[], query: string): Driver[] {
  const q = query.trim().toLowerCase();
  if (!q) return drivers;
  return drivers.filter(
    (driver) => driver.fullName.toLowerCase().includes(q) || driver.phone.toLowerCase().includes(q)
  );
}
