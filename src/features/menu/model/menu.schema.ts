import { z } from 'zod';

export const MealTypeSchema = z
  .string()
  .transform((t, ctx) => {
    const lower = t.toLowerCase();
    if (lower !== 'executive' && lower !== 'salad') {
      ctx.addIssue({ code: z.ZodIssueCode.invalid_value, values: ['executive', 'salad'], received: t } as Parameters<typeof ctx.addIssue>[0]);
      return z.NEVER;
    }
    return lower as 'executive' | 'salad';
  });
export type MealType = 'executive' | 'salad';

export const MealStatusSchema = z
  .enum(['active', 'draft', 'ACTIVE', 'DRAFT'])
  .transform((s) => s.toLowerCase() as 'active' | 'draft');
export type MealStatus = 'active' | 'draft';

export const MacrosSchema = z
  .object({
    protein_g: z.number().optional(),
    proteinG: z.number().optional(),
    carbs_g: z.number().optional(),
    carbsG: z.number().optional(),
    fat_g: z.number().optional(),
    fatG: z.number().optional(),
  })
  .transform((m) => ({
    protein_g: m.protein_g ?? m.proteinG ?? 0,
    carbs_g: m.carbs_g ?? m.carbsG ?? 0,
    fat_g: m.fat_g ?? m.fatG ?? 0,
  }));
export type Macros = z.infer<typeof MacrosSchema>;

export const MealSchema = z
  .object({
    id: z.string().optional(),
    meal_id: z.string().optional(),
    name_en: z.string().optional(),
    nameEn: z.string().optional(),
    name_ar: z.string().nullable().optional(),
    nameAr: z.string().nullable().optional(),
    meal_type: MealTypeSchema.optional(),
    mealType: MealTypeSchema.optional(),
    kcal: z.number().nullable().optional(),
    macros: MacrosSchema.optional(),
    status: MealStatusSchema.optional(),
    chef_note: z.string().nullable().optional(),
    key_ingredients: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    emoji: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    already_used: z.boolean().nullable().optional(),
    used_on_day: z.string().nullable().optional(),
  })
  .transform((m) => ({
    id: m.id ?? m.meal_id ?? '',
    name_en: m.name_en ?? m.nameEn ?? '',
    name_ar: m.name_ar ?? m.nameAr ?? null,
    meal_type: m.meal_type ?? m.mealType,
    kcal: m.kcal ?? null,
    macros: m.macros,
    status: (m.status ?? 'active') as MealStatus,
    chef_note: m.chef_note ?? null,
    key_ingredients: Array.isArray(m.key_ingredients)
      ? m.key_ingredients.join(', ')
      : (m.key_ingredients ?? null),
    emoji: m.emoji ?? null,
    photo_url: m.photo_url ?? null,
    already_used: m.already_used ?? false,
    used_on_day: m.used_on_day ?? null,
  }));
export type Meal = z.infer<typeof MealSchema>;

// Flat slot shape used throughout the UI
export const SlotSchema = z.object({
  id: z.string(),
  day: z.string(),
  day_label: z.string().optional(),
  date_label: z.string().optional(),
  delivery_date: z.string().optional(),
  meal_type: z.enum(['executive', 'salad']),
  meal_type_label: z.string().optional(),
  meal: MealSchema.nullable(),
  is_filled: z.boolean(),
  is_editable: z.boolean(),
});
export type Slot = z.infer<typeof SlotSchema>;

// Internal schemas for parsing the week detail API response
const RawApiSlotSchema = z.object({
  slot_id: z.string(),
  meal_type: MealTypeSchema,
  meal_type_label: z.string().optional(),
  meal: MealSchema.nullable(),
  is_filled: z.boolean().optional(),
  is_editable: z.boolean().optional(),
});

const WeekDaySchema = z.object({
  delivery_date: z.string(),
  day_label: z.string(),
  date_label: z.string(),
  slots: z.array(RawApiSlotSchema),
});

export const WeekDetailApiSchema = z.object({
  week_id: z.string(),
  week_number: z.number().optional(),
  status: z
    .enum(['draft', 'published', 'DRAFT', 'PUBLISHED'])
    .optional()
    .transform((s) => s?.toLowerCase() as 'draft' | 'published' | undefined),
  is_editable: z.boolean().optional(),
  days: z.array(WeekDaySchema),
  publish_ready: z.boolean().optional(),
  publish_blocked_reason: z.string().nullable().optional(),
});

export type WeekDetail = {
  weekId: string;
  status: 'draft' | 'published' | undefined;
  isEditable: boolean;
  publishReady: boolean;
  publishBlockedReason: string | null;
  slots: Slot[];
};

// Week list item (no slots — those come from the detail endpoint)
export const WeekSchema = z
  .object({
    id: z.string().optional(),
    week_id: z.string().optional(),
    label: z.string().optional(),
    date_range: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z
      .enum(['draft', 'published', 'DRAFT', 'PUBLISHED'])
      .optional()
      .transform((s) => s?.toLowerCase() as 'draft' | 'published' | undefined),
    is_current_week: z.boolean().optional(),
    is_editable: z.boolean().optional(),
    fill_status: z
      .object({ filled_days: z.number(), total_days: z.number(), label: z.string() })
      .optional(),
  })
  .transform((w) => ({
    id: w.id ?? w.week_id ?? '',
    label: w.label,
    date_range: w.date_range,
    start_date: w.start_date ?? w.date_from ?? '',
    end_date: w.end_date ?? w.date_to,
    status: w.status,
    is_current_week: w.is_current_week,
    is_editable: w.is_editable,
    fill_status: w.fill_status,
  }));
export type Week = z.infer<typeof WeekSchema>;

export const CreateMealInputSchema = z.object({
  name_en: z.string().min(1, 'Meal name is required').max(80),
  name_ar: z.string().max(80).optional(),
  meal_type: z.enum(['executive', 'salad']),
  kcal: z.number().int().positive().optional(),
  macros: z
    .object({
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
    })
    .optional(),
  chef_note: z.string().optional(),
  key_ingredients: z.array(z.string()).optional(),
  emoji: z.string().optional(),
  image: z.instanceof(File).optional(),
});
export type CreateMealInput = z.infer<typeof CreateMealInputSchema>;

export const UpdateMealInputSchema = CreateMealInputSchema.partial().extend({
  photo_url: z.string().nullable().optional(),
});
export type UpdateMealInput = z.infer<typeof UpdateMealInputSchema>;

/** UI collects key ingredients as one comma-separated field; the API wants an array. */
export function toKeyIngredientsArray(text: string): string[] | undefined {
  const items = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export const PhotoUploadUrlResponseSchema = z.object({
  upload_url: z.string(),
  photo_url: z.string(),
  expires_in_seconds: z.number(),
});
export type PhotoUploadUrlResponse = z.infer<typeof PhotoUploadUrlResponseSchema>;

export const ImportRowErrorSchema = z.object({
  row: z.number(),
  field: z.string(),
  message: z.string(),
});
export const ImportResultSchema = z.object({
  imported_count: z.number(),
  skipped_count: z.number(),
  errors: z.array(ImportRowErrorSchema),
  all_saved_as: z.string().optional(),
  note: z.string().optional(),
});
export type ImportResult = z.infer<typeof ImportResultSchema>;
export type ImportRowError = z.infer<typeof ImportRowErrorSchema>;

/** Day abbreviation → display label */
export const DAY_LABEL: Record<string, string> = {
  sun: 'SUN',
  mon: 'MON',
  tue: 'TUE',
  wed: 'WED',
  thu: 'THU',
  fri: 'FRI',
  sat: 'SAT',
};
