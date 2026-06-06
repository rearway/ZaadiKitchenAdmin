import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  WeekSchema,
  WeekDetailApiSchema,
  MealSchema,
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

export async function assignSlotApi(weekId: string, slotId: string, mealId: string) {
  const res = await client.post(`/admin/menu/weeks/${weekId}/slots/${slotId}/assign`, { meal_id: mealId });
  return unwrap(res.data, z.object({ id: z.string() }).passthrough());
}

export async function clearSlotApi(weekId: string, slotId: string) {
  await client.delete(`/admin/menu/weeks/${weekId}/slots/${slotId}`);
}

export async function publishWeekApi(weekId: string) {
  await client.post(`/admin/menu/weeks/${weekId}/publish`);
}

export async function createMealApi(input: CreateMealInput) {
  const res = await client.post('/admin/meals', input);
  return unwrap(res.data, MealSchema);
}

export async function updateMealApi(mealId: string, input: UpdateMealInput) {
  const res = await client.patch(`/admin/meals/${mealId}`, input);
  return unwrap(res.data, MealSchema);
}

export async function updateMealStatusApi(mealId: string, status: 'active' | 'draft') {
  const res = await client.patch(`/admin/meals/${mealId}/status`, { status });
  return unwrap(res.data, MealSchema);
}
