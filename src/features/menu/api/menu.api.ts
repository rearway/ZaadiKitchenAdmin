import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  MealRatingsResponseSchema,
  MEAL_RATINGS_MAX_PAGE_SIZE,
  MEAL_RATINGS_PAGE_SIZE,
  type GetMealRatingsParams,
} from '../model/meal-ratings.schema';
import {
  WeekSchema,
  WeekDetailApiSchema,
  MealSchema,
  PhotoUploadUrlResponseSchema,
  ImportResultSchema,
  AssignSlotResponseSchema,
  type AssignSlotResponse,
  MealStatusUpdateResponseSchema,
  parseMealDetail,
  type AssignableMealsParams,
  type CreateMealInput,
  type GetMealsParams,
  type MealDetail,
  type UpdateMealInput,
  DaySlotMutationResponseSchema,
  mapApiDayToWeekDayDetail,
  type DaySlotMutationResponse,
  type MealType,
  type Week,
  type WeekDetail,
  type Slot,
} from '../model/menu.schema';
import {
  parseWeekAheadSignal,
  resolveWeekAheadAccess,
  type WeekAheadSignal,
} from '../model/week-horizon';

const MenuWeeksPayloadSchema = z
  .object({
    weeks: z.array(WeekSchema),
  })
  .passthrough();

export type MenuWeeksResult = {
  weeks: Week[];
  signal: WeekAheadSignal | null;
};

/**
 * `count` is the number of Saudi work weeks to load, starting at the current one.
 * 2 = current + next. 3 = current + two ahead (after Thursday 18:00 Asia/Riyadh).
 */
export async function getWeeksApi(count: number): Promise<MenuWeeksResult> {
  const res = await client.get('/admin/menu/weeks', { params: { count } });
  const payload = unwrap(res.data, MenuWeeksPayloadSchema);
  return {
    weeks: payload.weeks,
    signal: parseWeekAheadSignal(payload) ?? parseWeekAheadSignal(res.data),
  };
}

/** Refetches with the API horizon when a lock signal disagrees with the requested count. */
export async function fetchMenuWeeks(count: number): Promise<MenuWeeksResult> {
  const first = await getWeeksApi(count);
  const access = resolveWeekAheadAccess(new Date(), first.signal);
  if (access.listCount === count) return first;
  const second = await getWeeksApi(access.listCount);
  return {
    weeks: second.weeks,
    signal: second.signal ?? first.signal,
  };
}

export async function getWeekDetailApi(weekId: string): Promise<WeekDetail> {
  const res = await client.get(`/admin/menu/weeks/${weekId}`);
  type RawDetail = z.infer<typeof WeekDetailApiSchema>;
  const raw = unwrap<RawDetail>(res.data, WeekDetailApiSchema);
  const days = raw.days.map(mapApiDayToWeekDayDetail);
  const slots: Slot[] = days.flatMap((day) => [...day.executive_slots, ...day.salad_slots]);
  return {
    weekId: raw.week_id,
    status: raw.status,
    isEditable: raw.is_editable ?? true,
    publishReady: raw.publish_ready ?? false,
    publishBlockedReason: raw.publish_blocked_reason ?? null,
    days,
    slots,
  };
}

export async function addDaySlotApi(
  weekId: string,
  deliveryDate: string,
  input: { meal_type: MealType; meal_id?: string },
): Promise<DaySlotMutationResponse> {
  const res = await client.post(`/admin/menu/weeks/${weekId}/days/${deliveryDate}/slots`, {
    meal_type: input.meal_type,
    ...(input.meal_id ? { meal_id: input.meal_id } : {}),
  });
  return unwrap(res.data, DaySlotMutationResponseSchema);
}

export async function setDayDefaultApi(
  weekId: string,
  deliveryDate: string,
  input: { meal_type: MealType; meal_id: string },
) {
  await client.patch(`/admin/menu/weeks/${weekId}/days/${deliveryDate}/default`, input);
}

export async function getMealsApi(params: GetMealsParams = {}) {
  const res = await client.get('/admin/meals', {
    params: {
      status: params.status ?? 'all',
      page: 1,
      per_page: 50,
      ...(params.meal_type ? { meal_type: params.meal_type } : {}),
    },
  });
  return unwrap(res.data, z.object({ meals: z.array(MealSchema) }).transform((d) => d.meals));
}

export async function getMealDetailApi(mealId: string): Promise<MealDetail> {
  const res = await client.get(`/admin/meals/${mealId}`);
  const payload = unwrap(res.data, z.unknown());
  return parseMealDetail(payload);
}

export async function getMealRatingsApi(mealId: string, params: GetMealRatingsParams = {}) {
  const page = params.page ?? 1;
  const perPage = Math.min(
    MEAL_RATINGS_MAX_PAGE_SIZE,
    Math.max(1, params.perPage ?? MEAL_RATINGS_PAGE_SIZE)
  );
  const res = await client.get(`/admin/meals/${mealId}/ratings`, {
    params: { page, per_page: perPage },
  });
  return unwrap(res.data, MealRatingsResponseSchema);
}

/** Week planner picker: active + updated meals (live version), via context=picker. */
export async function getAssignableMealsApi(params: AssignableMealsParams) {
  const res = await client.get('/admin/meals', {
    params: {
      context: 'picker',
      page: 1,
      per_page: 50,
      ...(params.q ? { q: params.q } : {}),
      ...(params.meal_type ? { meal_type: params.meal_type } : {}),
    },
  });
  return unwrap(res.data, z.object({ meals: z.array(MealSchema) }).transform((d) => d.meals));
}

export async function assignSlotApi(
  weekId: string,
  slotId: string,
  mealId: string,
): Promise<AssignSlotResponse> {
  const res = await client.post(`/admin/menu/weeks/${weekId}/slots/${slotId}/assign`, { meal_id: mealId });
  return unwrap(res.data, AssignSlotResponseSchema);
}

export async function clearSlotApi(weekId: string, slotId: string) {
  await client.delete(`/admin/menu/weeks/${weekId}/slots/${slotId}`);
}

export async function publishWeekApi(weekId: string) {
  await client.post(`/admin/menu/weeks/${weekId}/publish`);
}

export async function unpublishWeekApi(weekId: string) {
  await client.post(`/admin/menu/weeks/${weekId}/unpublish`);
}

export async function createMealApi(input: CreateMealInput) {
  const res = await client.post('/admin/meals', {
    name_en: input.name_en,
    name_ar: input.name_ar,
    meal_type: input.meal_type,
    kcal: input.kcal,
    macros: input.macros,
    chef_note: input.chef_note,
    key_ingredients: input.key_ingredients,
    emoji: input.emoji,
  });
  return unwrap(res.data, MealSchema);
}

export async function updateMealApi(mealId: string, input: UpdateMealInput) {
  const res = await client.patch(`/admin/meals/${mealId}`, input);
  return unwrap(res.data, MealSchema);
}

export async function updateMealStatusApi(
  mealId: string,
  status: 'active' | 'draft',
  confirmPublishedEdit?: boolean,
) {
  const body: { status: string; confirm_published_edit?: boolean } = { status };
  if (confirmPublishedEdit) body.confirm_published_edit = true;
  const res = await client.patch(`/admin/meals/${mealId}/status`, body);
  return unwrap(res.data, MealStatusUpdateResponseSchema);
}

/** Step 1 of 3-step S3 photo upload: get a presigned URL from the API. */
export async function getPhotoUploadUrlApi(
  mealId: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
) {
  const res = await client.get(`/admin/meals/${mealId}/photo-upload-url`, {
    params: { content_type: contentType },
  });
  return unwrap(res.data, PhotoUploadUrlResponseSchema);
}

/** Step 2 of 3-step S3 photo upload: PUT the file directly to the S3 presigned URL. */
export async function uploadToS3Api(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}

/** XLSX bulk import: POST multipart/form-data with field name "file". */
export async function importMealsApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post('/admin/meals/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(res.data, ImportResultSchema);
}
