import { z } from 'zod';

const CountSchema = z.number().int().nonnegative();

export const MEAL_RATINGS_PAGE_SIZE = 20;
export const MEAL_RATINGS_MAX_PAGE_SIZE = 50;

export type GetMealRatingsParams = {
  page?: number;
  perPage?: number;
};

export const MealRatingSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    phone: z.string().nullable(),
    full_name: z.string().nullable(),
    stars: z.number().int().min(1).max(5),
    tags: z.array(z.string()),
    delivery_date: z.string(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    fullName: row.full_name,
    stars: row.stars,
    tags: row.tags,
    deliveryDate: row.delivery_date,
    createdAt: row.created_at,
  }));
export type MealRating = z.infer<typeof MealRatingSchema>;

export const MealRatingsResponseSchema = z
  .object({
    meal_id: z.string(),
    average_rating: z.number().nullable(),
    rating_count: CountSchema,
    ratings: z.array(MealRatingSchema),
    pagination: z.object({
      page: CountSchema,
      per_page: CountSchema,
      total: CountSchema,
      total_pages: CountSchema,
    }),
  })
  .transform((payload) => ({
    mealId: payload.meal_id,
    averageRating: payload.average_rating,
    ratingCount: payload.rating_count,
    ratings: payload.ratings,
    pagination: {
      page: payload.pagination.page,
      perPage: payload.pagination.per_page,
      total: payload.pagination.total,
      totalPages: payload.pagination.total_pages,
    },
  }));
export type MealRatingsResponse = z.infer<typeof MealRatingsResponseSchema>;

const deliveryDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const createdAtFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Riyadh',
});

/** Calendar date from `YYYY-MM-DD`. Unparseable values are shown as returned. */
export function formatRatingDeliveryDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) return trimmed;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return trimmed;
  return deliveryDateFormat.format(date);
}

/** Timestamp in Asia/Riyadh. Unparseable values are shown as returned. */
export function formatRatingCreatedAt(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '—';
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return createdAtFormat.format(date).replace(/\u202f/g, ' ');
}

export function formatAverageRating(value: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRatingCount(count: number): string {
  return `${count} ${count === 1 ? 'rating' : 'ratings'}`;
}

export function ratingCustomerLines(rating: { fullName: string | null; phone: string | null }): {
  primary: string;
  secondary: string | null;
} {
  const name = rating.fullName?.trim() ?? '';
  const phone = rating.phone?.trim() ?? '';
  if (name && phone) return { primary: name, secondary: phone };
  if (name) return { primary: name, secondary: null };
  if (phone) return { primary: phone, secondary: null };
  return { primary: 'Unknown customer', secondary: null };
}
