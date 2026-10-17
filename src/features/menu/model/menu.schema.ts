import { z } from 'zod';
import { ApiError } from '@/shared/types/api';

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
  .enum(['active', 'draft', 'updated', 'ACTIVE', 'DRAFT', 'UPDATED'])
  .transform((s) => s.toLowerCase() as MealStatus);
export type MealStatus = 'active' | 'draft' | 'updated';

export type MealLibraryStatusFilter = 'all' | MealStatus;

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
    photoUrl: z.string().nullable().optional(),
    has_pending_changes: z.boolean().optional(),
    hasPendingChanges: z.boolean().optional(),
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
    photo_url: m.photo_url ?? m.photoUrl ?? null,
    has_pending_changes: m.has_pending_changes ?? m.hasPendingChanges ?? false,
  }));
export type Meal = z.infer<typeof MealSchema>;

const MealPendingSchema = z
  .object({
    name_en: z.string().optional(),
    name_ar: z.string().nullable().optional(),
    kcal: z.number().nullable().optional(),
    macros: MacrosSchema.optional(),
    chef_note: z.string().nullable().optional(),
    key_ingredients: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    emoji: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
  })
  .nullable()
  .optional()
  .transform((p) => {
    if (!p) return null;
    return {
      name_en: p.name_en,
      name_ar: p.name_ar ?? null,
      kcal: p.kcal ?? null,
      macros: p.macros,
      chef_note: p.chef_note ?? null,
      key_ingredients: Array.isArray(p.key_ingredients)
        ? p.key_ingredients.join(', ')
        : (p.key_ingredients ?? null),
      emoji: p.emoji ?? null,
      photo_url: p.photo_url ?? null,
    };
  });

export type MealDetail = Meal & { pending: MealPending | null };
export type MealPending = {
  name_en?: string;
  name_ar?: string | null;
  kcal?: number | null;
  macros?: Macros;
  chef_note?: string | null;
  key_ingredients?: string | null;
  emoji?: string | null;
  photo_url?: string | null;
};

export type GetMealsParams = {
  status?: MealLibraryStatusFilter;
  meal_type?: MealType;
};

export function parseMealDetail(payload: unknown): MealDetail {
  const base = MealSchema.parse(payload);
  const pendingEnvelope = z.object({ pending: MealPendingSchema }).safeParse(payload);
  return {
    ...base,
    pending: pendingEnvelope.success ? pendingEnvelope.data.pending : null,
  };
}

export const MealStatusUpdateResponseSchema = z
  .object({
    meal_id: z.string().optional(),
    previous_status: MealStatusSchema.optional(),
    status: MealStatusSchema.optional(),
    updated_at: z.string().optional(),
    pending_applied: z.boolean().optional(),
    affects_live_menu: z.boolean().optional(),
    affected_weeks: z.array(z.string()).optional(),
  })
  .passthrough();
export type MealStatusUpdateResponse = z.infer<typeof MealStatusUpdateResponseSchema>;

export const MEAL_STATUS_ERROR = {
  MEAL_IN_PUBLISHED_WEEK: 'MEAL_IN_PUBLISHED_WEEK',
} as const;

/** 409 when activating updated meals or drafting from a published week — retry status PATCH with confirm_published_edit. */
export function parseMealPublishedWeekConflict(err: unknown): {
  message: string;
  affectedWeeks: string[];
} | null {
  if (!(err instanceof ApiError) || err.statusCode !== 409) return null;
  if (err.errorCode !== MEAL_STATUS_ERROR.MEAL_IN_PUBLISHED_WEEK) return null;
  return {
    message: err.message,
    affectedWeeks: err.affectedWeeks,
  };
}

/** Form defaults: pending values when present (meal is active/updated with saved edits). */
export function mealEditableFields(detail: MealDetail) {
  const p = detail.pending;
  return {
    name_en: p?.name_en ?? detail.name_en,
    name_ar: p?.name_ar ?? detail.name_ar ?? '',
    meal_type: (detail.meal_type ?? 'executive') as MealType,
    kcal: p?.kcal ?? detail.kcal,
    macros: p?.macros ?? detail.macros,
    chef_note: p?.chef_note ?? detail.chef_note ?? '',
    key_ingredients: p?.key_ingredients ?? detail.key_ingredients ?? '',
    emoji: p?.emoji ?? detail.emoji,
    photo_url: p?.photo_url ?? detail.photo_url,
  };
}

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

export type WeekStatus = 'draft' | 'published' | 'past';

const WeekStatusSchema = z
  .enum(['draft', 'published', 'past', 'DRAFT', 'PUBLISHED', 'PAST'])
  .optional()
  .transform((s) => s?.toLowerCase() as WeekStatus | undefined);

export const WeekDetailApiSchema = z.object({
  week_id: z.string(),
  week_number: z.number().optional(),
  status: WeekStatusSchema,
  is_editable: z.boolean().optional(),
  days: z.array(WeekDaySchema),
  publish_ready: z.boolean().optional(),
  publish_blocked_reason: z.string().nullable().optional(),
});

export type WeekDetail = {
  weekId: string;
  status: WeekStatus | undefined;
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
    status: WeekStatusSchema,
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

/** Only draft weeks accept slot changes; published and past weeks are read-only. */
export function isWeekEditable(week: WeekDetail | undefined): boolean {
  if (!week) return false;
  return week.isEditable && week.status !== 'published' && week.status !== 'past';
}

export const AssignSlotResponseSchema = z.object({
  slot_id: z.string(),
  meal_type: MealTypeSchema.optional(),
  delivery_date: z.string().optional(),
  meal: MealSchema,
  week_fill_status: z.object({
    filled_slots: z.number(),
    total_slots: z.number(),
    publish_ready: z.boolean(),
  }),
});
export type AssignSlotResponse = z.infer<typeof AssignSlotResponseSchema>;

export type AssignableMealsParams = {
  q?: string;
  meal_type?: MealType;
};

const DaySaladConflictDetailsSchema = z.object({
  delivery_date: z.string().optional(),
  existing_slot_id: z.string().optional(),
  existing_meal_name: z.string().optional(),
});

export const ASSIGN_ERROR = {
  DAY_SALAD_ALREADY_ASSIGNED: 'DAY_SALAD_ALREADY_ASSIGNED',
  MEAL_IS_DRAFT: 'MEAL_IS_DRAFT',
  SLOT_NOT_EDITABLE: 'SLOT_NOT_EDITABLE',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
} as const;

export type AssignError =
  | { kind: 'day_salad_conflict'; message: string; existingSlotId: string | null }
  | { kind: 'meal_is_draft'; message: string }
  | { kind: 'slot_not_editable'; message: string }
  | { kind: 'not_found'; message: string }
  | { kind: 'unknown'; message: string };

/** Maps an assign-slot failure to the UI handling the backend contract prescribes. */
export function classifyAssignError(err: unknown): AssignError {
  const errorCode = err instanceof ApiError ? err.errorCode : null;
  const message = err instanceof Error ? err.message : '';
  switch (errorCode) {
    case ASSIGN_ERROR.DAY_SALAD_ALREADY_ASSIGNED: {
      const parsed = DaySaladConflictDetailsSchema.safeParse(err instanceof ApiError ? err.details : undefined);
      return {
        kind: 'day_salad_conflict',
        message,
        existingSlotId: parsed.success ? (parsed.data.existing_slot_id ?? null) : null,
      };
    }
    case ASSIGN_ERROR.MEAL_IS_DRAFT:
      return { kind: 'meal_is_draft', message: 'Activate this meal before assigning it.' };
    case ASSIGN_ERROR.SLOT_NOT_EDITABLE:
      return { kind: 'slot_not_editable', message: message || 'This week is published or past and can no longer be edited.' };
    case ASSIGN_ERROR.RESOURCE_NOT_FOUND:
      return { kind: 'not_found', message: message || 'This week, slot or meal no longer exists. The week has been refreshed.' };
    default:
      return { kind: 'unknown', message: message || 'Failed to assign meal' };
  }
}

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

export const PhotoUploadUrlResponseSchema = z
  .object({
    upload_url: z.string().optional(),
    uploadUrl: z.string().optional(),
    photo_url: z.string().optional(),
    photoUrl: z.string().optional(),
    expires_in_seconds: z.number().optional(),
    expiresInSeconds: z.number().optional(),
  })
  .transform((r) => ({
    upload_url: r.upload_url ?? r.uploadUrl ?? '',
    photo_url: r.photo_url ?? r.photoUrl ?? '',
    expires_in_seconds: r.expires_in_seconds ?? r.expiresInSeconds ?? 0,
  }))
  .refine((r) => r.upload_url.length > 0 && r.photo_url.length > 0, {
    message: 'upload_url and photo_url must be non-empty',
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
