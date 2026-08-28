import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  WeekSchema,
  WeekDetailApiSchema,
  MealSchema,
  PhotoUploadUrlResponseSchema,
  ImportResultSchema,
  type CreateMealInput,
  type UpdateMealInput,
  type WeekDetail,
  type Slot,
} from '../model/menu.schema';

export async function getWeeksApi() {
  const res = await client.get('/admin/menu/weeks', { params: { count: 2 } });
  return unwrap(res.data, z.object({ weeks: z.array(WeekSchema) }).transform((d) => d.weeks));
}

export async function getWeekDetailApi(weekId: string): Promise<WeekDetail> {
  const res = await client.get(`/admin/menu/weeks/${weekId}`);
  type RawDetail = z.infer<typeof WeekDetailApiSchema>;
  const raw = unwrap<RawDetail>(res.data, WeekDetailApiSchema);
  const slots: Slot[] = raw.days.flatMap((day) =>
    day.slots.map((slot) => ({
      id: slot.slot_id,
      day: day.day_label.toLowerCase(),
      day_label: day.day_label,
      date_label: day.date_label,
      delivery_date: day.delivery_date,
      meal_type: slot.meal_type,
      meal_type_label: slot.meal_type_label,
      meal: slot.meal,
      is_filled: slot.is_filled ?? false,
      is_editable: slot.is_editable ?? true,
    })),
  );
  return {
    weekId: raw.week_id,
    status: raw.status,
    isEditable: raw.is_editable ?? true,
    publishReady: raw.publish_ready ?? false,
    publishBlockedReason: raw.publish_blocked_reason ?? null,
    slots,
  };
}

export async function getMealsApi(status?: string) {
  const res = await client.get('/admin/meals', { params: status ? { status } : undefined });
  return unwrap(res.data, z.object({ meals: z.array(MealSchema) }).transform((d) => d.meals));
}

/** Meal picker: returns active meals with already_used flag for the given week. */
export async function getMealsPickerApi(weekId: string) {
  const res = await client.get('/admin/meals', {
    params: { context: 'picker', exclude_week_id: weekId },
  });
  return unwrap(res.data, z.object({ meals: z.array(MealSchema) }).transform((d) => d.meals));
}

export async function assignSlotApi(weekId: string, slotId: string, mealId: string) {
  const res = await client.post(`/admin/menu/weeks/${weekId}/slots/${slotId}/assign`, { meal_id: mealId });
  return unwrap(res.data, z.object({ slot_id: z.string() }).passthrough());
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
  const formData = new FormData();
  formData.append('name_en', input.name_en);
  if (input.name_ar) formData.append('name_ar', input.name_ar);
  formData.append('meal_type', input.meal_type);
  if (input.kcal !== undefined) formData.append('kcal', String(input.kcal));
  if (input.emoji) formData.append('emoji', input.emoji);
  if (input.chef_note) formData.append('chef_note', input.chef_note);
  
  if (input.key_ingredients) {
    input.key_ingredients.forEach((ing) => formData.append('key_ingredients[]', ing));
  }
  
  if (input.macros) {
    if (input.macros.protein_g !== undefined) formData.append('macros[protein_g]', String(input.macros.protein_g));
    if (input.macros.carbs_g !== undefined) formData.append('macros[carbs_g]', String(input.macros.carbs_g));
    if (input.macros.fat_g !== undefined) formData.append('macros[fat_g]', String(input.macros.fat_g));
  }

  if (input.image) {
    formData.append('image', input.image);
  }

  const res = await client.post('/admin/meals', formData);
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
  return unwrap(res.data, MealSchema);
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
