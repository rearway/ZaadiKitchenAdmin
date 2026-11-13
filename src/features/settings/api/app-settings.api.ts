import { client } from '@/shared/lib/api/client';
import { parseMealTypes, type MealTypeDisplay } from '../model/meal-types';

/**
 * Public GET /api/v1/app/settings (no envelope).
 * Body includes meal_types[] { slug, name_en, name_ar, short_en, short_ar, sort }.
 */
export async function getAppSettingsMealTypes(): Promise<MealTypeDisplay[]> {
  const res = await client.get('/app/settings');
  const body = res.data;
  const mealTypes =
    body && typeof body === 'object' && 'meal_types' in body
      ? (body as { meal_types: unknown }).meal_types
      : undefined;
  return parseMealTypes(mealTypes);
}
