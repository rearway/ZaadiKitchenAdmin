import { z } from 'zod';

/** Calendar date in Asia/Riyadh (`YYYY-MM-DD`). The kitchen ops day is KSA, not the browser zone. */
export function formatDateKsa(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function todayKsa(now: Date = new Date()): string {
  return formatDateKsa(now);
}

const OPS_DAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** `Mon 26 Oct` or `Mon 26 Oct (today)` when `isoDate` is the KSA ops day. */
export function formatOpsDayLabel(isoDate: string, today: string = todayKsa()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const formatted = OPS_DAY_FORMAT.format(date).replace(',', '');
  return isoDate === today ? `${formatted} (today)` : formatted;
}

/** Admin label from Backend PR #24. `scheduled` and `past_cutoff` are pending. No out-for-delivery state. */
export const DELIVERY_MEAL_STATUSES = ['pending', 'delivered', 'skipped', 'paused'] as const;
export type DeliveryMealStatus = (typeof DELIVERY_MEAL_STATUSES)[number];

export function normalizeDeliveryStatus(raw: string): DeliveryMealStatus {
  const value = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (value === 'delivered') return 'delivered';
  if (value === 'skipped') return 'skipped';
  if (value === 'paused') return 'paused';
  return 'pending';
}

export function deliveryStatusLabel(status: DeliveryMealStatus): string {
  if (status === 'pending') return 'Pending';
  if (status === 'delivered') return 'Delivered';
  if (status === 'paused') return 'Paused';
  return 'Skipped';
}

export function mealTypeLabel(mealType: string): string {
  if (mealType === 'salad') return 'Salad';
  if (mealType === 'executive') return 'Executive';
  if (!mealType) return '—';
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

export type DriverDeliveryReview = {
  stars: number | null;
  text: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readStars(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function readTags(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const tags = value
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter((tag) => tag.length > 0);
  return tags.length > 0 ? tags.join(', ') : null;
}

function reviewFrom(source: Record<string, unknown>): DriverDeliveryReview | null {
  const stars = readStars(source.stars ?? source.rating);
  const text =
    readString(source.text) ??
    readString(source.comment) ??
    readString(source.body) ??
    readString(source.review) ??
    readString(source.review_text) ??
    readString(source.reviewText) ??
    readTags(source.tags);
  if (stars == null && !text) return null;
  return { stars, text: text ?? '' };
}

function readReview(row: Record<string, unknown>): DriverDeliveryReview | null {
  const nestedReview = asRecord(row.review);
  const nestedRating = asRecord(row.rating);
  const fromNested =
    (nestedReview ? reviewFrom(nestedReview) : null) ??
    (nestedRating ? reviewFrom(nestedRating) : null);
  if (fromNested) return fromNested;
  return reviewFrom({
    stars: row.stars,
    rating: typeof row.rating === 'number' ? row.rating : undefined,
    text: row.text,
    comment: row.comment,
    body: row.body,
    review: typeof row.review === 'string' ? row.review : undefined,
    review_text: row.review_text ?? row.reviewText,
    tags: row.tags,
  });
}

function normalizeMealType(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'salad') return 'salad';
  if (value === 'executive' || value === 'exec') return 'executive';
  return value;
}

const DriverDeliverySchema = z
  .object({
    id: z.string().optional(),
    delivery_id: z.string().optional(),
    deliveryId: z.string().optional(),
    customer_name: z.string().nullable().optional(),
    customerName: z.string().nullable().optional(),
    customer_phone: z.string().nullable().optional(),
    customerPhone: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    meal_name: z.string().nullable().optional(),
    mealName: z.string().nullable().optional(),
    meal_type: z.string().nullable().optional(),
    mealType: z.string().nullable().optional(),
    status: z.string().optional(),
    domain_status: z.string().nullable().optional(),
    domainStatus: z.string().nullable().optional(),
    stars: z.number().nullable().optional(),
    review_text: z.string().nullable().optional(),
    reviewText: z.string().nullable().optional(),
    review: z.unknown().optional(),
    rating: z.unknown().optional(),
    customer: z.unknown().optional(),
    meal: z.unknown().optional(),
    tags: z.array(z.string()).optional(),
    text: z.string().nullable().optional(),
    comment: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => {
    const customer = asRecord(row.customer);
    const meal = asRecord(row.meal);
    const customerName =
      readString(row.customer_name) ??
      readString(row.customerName) ??
      readString(customer?.name) ??
      readString(customer?.full_name) ??
      readString(customer?.fullName) ??
      '';
    const phone =
      readString(row.customer_phone) ??
      readString(row.customerPhone) ??
      readString(row.phone) ??
      readString(customer?.phone) ??
      '';
    const mealName =
      readString(row.meal_name) ??
      readString(row.mealName) ??
      readString(meal?.name_en) ??
      readString(meal?.nameEn) ??
      readString(meal?.name) ??
      '';
    const mealType = normalizeMealType(
      row.meal_type ?? row.mealType ?? meal?.meal_type ?? meal?.mealType ?? meal?.type
    );
    const domainStatus = readString(row.domain_status ?? row.domainStatus)?.toLowerCase() ?? null;
    const status = normalizeDeliveryStatus(
      typeof row.status === 'string' ? row.status : (domainStatus ?? 'pending')
    );
    return {
      id: row.id ?? row.delivery_id ?? row.deliveryId ?? `${customerName}|${mealName}|${phone}`,
      customerName,
      phone,
      mealName,
      mealType,
      status,
      domainStatus,
      review: status === 'delivered' ? readReview(row as Record<string, unknown>) : null,
    };
  });
export type DriverDelivery = z.infer<typeof DriverDeliverySchema>;

export const DriverDeliveriesSchema = z.union([
  z.array(DriverDeliverySchema).transform((deliveries) => ({
    date: null as string | null,
    deliveries,
  })),
  z
    .object({
      date: z.string().nullable().optional(),
      deliveries: z.array(DriverDeliverySchema).optional(),
      meals: z.array(DriverDeliverySchema).optional(),
    })
    .transform((payload) => ({
      date: payload.date ?? null,
      deliveries: payload.deliveries ?? payload.meals ?? [],
    })),
]);
export type DriverDeliveries = z.infer<typeof DriverDeliveriesSchema>;

/**
 * Review column. Delivered meals show stars and text. Anything else is an em dash,
 * including a review payload that arrived on a meal that is not delivered yet.
 */
export function deliveryReviewView(delivery: Pick<DriverDelivery, 'status' | 'review'>): string {
  if (delivery.status !== 'delivered') return '—';
  if (!delivery.review || (delivery.review.stars == null && delivery.review.text.length === 0)) {
    return '(no review yet)';
  }
  const stars = delivery.review.stars == null ? '—' : String(delivery.review.stars);
  if (!delivery.review.text) return `${stars}★`;
  return `${stars}★ · ${delivery.review.text}`;
}

export type AreaChoice = { id: string; name: string | null };

const AssignableAreaSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable().optional(),
  })
  .transform((area) => ({
    id: area.id,
    name: area.name?.trim() ? area.name.trim() : null,
  }));

/** `GET /admin/drivers/unassigned-areas` — `{ areas }` or a bare array, inside the usual envelope. */
export const UnassignedAreasSchema = z.union([
  z.array(AssignableAreaSchema),
  z.object({ areas: z.array(AssignableAreaSchema) }).transform((row) => row.areas),
]);

/**
 * Areas with no driver. Pass `includeDriverId` on the edit form so that driver's
 * current areas stay selectable. A driver may hold several areas; an area may not.
 */
export function unassignedAreas(
  areas: AreaChoice[],
  drivers: { id: string; areas: { id: string }[] }[],
  options?: { includeDriverId?: string }
): AreaChoice[] {
  const taken = new Set<string>();
  for (const driver of drivers) {
    if (options?.includeDriverId && driver.id === options.includeDriverId) continue;
    for (const area of driver.areas) taken.add(area.id);
  }
  return areas.filter((area) => !taken.has(area.id));
}

/** API 409 message for a taken area. Other failures stay on their own path. */
export function areaAssignErrorMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const statusCode = (err as { statusCode?: unknown }).statusCode;
  if (statusCode !== 409) return null;
  const message = err.message.trim();
  return message || 'This area is already assigned to another driver.';
}
