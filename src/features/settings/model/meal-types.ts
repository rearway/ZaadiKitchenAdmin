export const MEAL_TYPE_SLUGS = ['executive', 'salad'] as const;
export type MealTypeSlug = (typeof MEAL_TYPE_SLUGS)[number];

export type MealTypeDisplay = {
  slug: MealTypeSlug;
  name_en: string;
  name_ar: string;
  short_en: string;
  short_ar: string;
  sort: number;
};

/** Used when GET /app/settings fails. Matches the backend default catalog. */
export const DEFAULT_MEAL_TYPES: MealTypeDisplay[] = [
  {
    slug: 'executive',
    name_en: 'Platio Balanced',
    name_ar: 'Platio متوازن',
    short_en: 'Balanced',
    short_ar: 'متوازن',
    sort: 1,
  },
  {
    slug: 'salad',
    name_en: 'Platio Light',
    name_ar: 'Platio لايت',
    short_en: 'Light',
    short_ar: 'لايت',
    sort: 2,
  },
];

function isSlug(value: string): value is MealTypeSlug {
  return value === 'executive' || value === 'salad';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/**
 * Reads `meal_types` from the public settings body.
 * Unknown slugs are ignored. A missing known slug is filled from the defaults.
 * Throws when `meal_types` is not an array so a bad payload is a query error.
 */
export function parseMealTypes(value: unknown): MealTypeDisplay[] {
  if (!Array.isArray(value)) {
    throw new Error('meal_types must be an array');
  }

  const parsed: MealTypeDisplay[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const slug = readString(row.slug);
    const nameEn = readString(row.name_en);
    const nameAr = readString(row.name_ar);
    const shortEn = readString(row.short_en);
    const shortAr = readString(row.short_ar);
    const sort = typeof row.sort === 'number' && Number.isFinite(row.sort) ? row.sort : null;
    if (!slug || !isSlug(slug) || !nameEn || !nameAr || !shortEn || !shortAr || sort == null) {
      continue;
    }
    parsed.push({
      slug,
      name_en: nameEn,
      name_ar: nameAr,
      short_en: shortEn,
      short_ar: shortAr,
      sort,
    });
  }

  const bySlug = new Map(parsed.map((item) => [item.slug, item]));
  return DEFAULT_MEAL_TYPES.map((item) => bySlug.get(item.slug) ?? item).sort(
    (a, b) => a.sort - b.sort || a.slug.localeCompare(b.slug)
  );
}

export type MealTypeLabelVariant = 'name' | 'short';

/** English display copy. Slugs stay executive/salad in payloads. */
export function mealTypeText(
  mealType: string | null | undefined,
  variant: MealTypeLabelVariant = 'name',
  displays: readonly MealTypeDisplay[] = DEFAULT_MEAL_TYPES
): string {
  const key = mealType?.trim().toLowerCase() ?? '';
  if (!key) return '';
  const row = displays.find((item) => item.slug === key);
  if (!row) return mealType?.trim() ?? '';
  return variant === 'short' ? row.short_en : row.name_en;
}
