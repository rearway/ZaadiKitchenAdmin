import { z } from 'zod';

/** Saudi mobile in E.164, matching backend `isAllowedAuthPhone` (+966 + 9 digits). */
const SAUDI_PHONE = /^\+966[0-9]{9}$/;

const LanguageSchema = z.enum(['EN', 'AR']);
export type DriverLanguage = z.infer<typeof LanguageSchema>;

const DriverAreaSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
  })
  .transform((area) => ({
    id: area.id,
    name: area.name?.trim() ? area.name : null,
  }));

const DriverAreaValueSchema = z.union([
  z
    .string()
    .min(1)
    .transform((id) => ({ id, name: null as string | null })),
  DriverAreaSchema,
]);

function normalizeLanguage(value: string | null | undefined): DriverLanguage {
  return value?.toUpperCase() === 'AR' ? 'AR' : 'EN';
}

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

export const DriverSchema = z
  .object({
    id: z.string(),
    full_name: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    phone: z.string(),
    language_preference: z.string().optional().nullable(),
    languagePreference: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
    areas: z.array(DriverAreaValueSchema).optional(),
    area_ids: z.array(z.string()).optional(),
    areaIds: z.array(z.string()).optional(),
    created_at: z.string().optional().nullable(),
    createdAt: z.string().optional().nullable(),
  })
  .transform((driver) => ({
    id: driver.id,
    fullName: (driver.full_name ?? driver.fullName ?? driver.name ?? '').trim(),
    phone: driver.phone,
    language: normalizeLanguage(driver.language_preference ?? driver.languagePreference),
    isActive: driver.is_active ?? driver.isActive ?? true,
    areas: mergeAreas(driver.areas, [...(driver.area_ids ?? []), ...(driver.areaIds ?? [])]),
    createdAt: driver.created_at ?? driver.createdAt ?? null,
  }));
export type Driver = z.infer<typeof DriverSchema>;

const PaginationSchema = z
  .object({
    page: z.number().optional(),
    perPage: z.number().optional(),
    per_page: z.number().optional(),
    total: z.number().optional(),
    totalPages: z.number().optional(),
    total_pages: z.number().optional(),
  })
  .partial();

function readPage(
  source: z.infer<typeof PaginationSchema> | undefined,
  fallbackCount: number
): { page: number; perPage: number; total: number; totalPages: number } {
  const page = source?.page ?? 1;
  const perPage = source?.perPage ?? source?.per_page ?? (fallbackCount || 20);
  const total = source?.total ?? fallbackCount;
  const totalPages =
    source?.totalPages ??
    source?.total_pages ??
    Math.max(1, Math.ceil(total / Math.max(perPage, 1)));
  return { page, perPage, total, totalPages };
}

export const DriverListSchema = z.union([
  z.array(DriverSchema).transform((drivers) => ({
    drivers,
    ...readPage({ total: drivers.length, per_page: drivers.length || 20 }, drivers.length),
  })),
  z
    .object({
      drivers: z.array(DriverSchema).optional(),
      items: z.array(DriverSchema).optional(),
      pagination: PaginationSchema.optional(),
      page: z.number().optional(),
      perPage: z.number().optional(),
      per_page: z.number().optional(),
      total: z.number().optional(),
      totalPages: z.number().optional(),
      total_pages: z.number().optional(),
    })
    .transform((list) => {
      const drivers = list.drivers ?? list.items ?? [];
      return {
        drivers,
        ...readPage(
          {
            page: list.page ?? list.pagination?.page,
            perPage: list.perPage ?? list.pagination?.perPage,
            per_page: list.per_page ?? list.pagination?.per_page,
            total: list.total ?? list.pagination?.total,
            totalPages: list.totalPages ?? list.pagination?.totalPages,
            total_pages: list.total_pages ?? list.pagination?.total_pages,
          },
          drivers.length
        ),
      };
    }),
]);
export type DriverList = z.infer<typeof DriverListSchema>;

/** Single-resource body: the driver, or `{ driver }` if the handler wraps it. */
export const DriverResponseSchema = z.union([
  z.object({ driver: DriverSchema }).transform((body) => body.driver),
  DriverSchema,
]);

/** Strip spaces/dashes and expand a local Saudi mobile (`05…`) to E.164. */
export function normalizeDriverPhone(raw: string): string {
  const compact = raw.replace(/[\s-]/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00966')) return `+${compact.slice(2)}`;
  if (compact.startsWith('966')) return `+${compact}`;
  if (/^0[0-9]{9}$/.test(compact)) return `+966${compact.slice(1)}`;
  return compact;
}

export const DriverWriteSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be 80 characters or fewer'),
  phone: z
    .string()
    .trim()
    .transform(normalizeDriverPhone)
    .pipe(z.string().regex(SAUDI_PHONE, 'Phone must be in Saudi format: +966XXXXXXXXX')),
  language_preference: LanguageSchema,
  is_active: z.boolean(),
  area_ids: z.array(z.string().min(1)).transform((ids) => [...new Set(ids)]),
});
export type DriverWriteInput = z.output<typeof DriverWriteSchema>;

export function driverLanguageLabel(language: DriverLanguage): string {
  return language === 'AR' ? 'Arabic' : 'English';
}

export function driverAreaLabels(
  driver: Pick<Driver, 'areas'>,
  areaNameById: ReadonlyMap<string, string>
): string[] {
  return driver.areas.map((area) => area.name ?? areaNameById.get(area.id) ?? area.id);
}
