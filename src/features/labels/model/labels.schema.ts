import { z } from 'zod';

export const LabelSchema = z.object({
  label_id: z.string(),
  order_ref: z.string().optional(),
  customer_name: z.string(),
  meal_type: z.string(),
  building: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  desk_area: z.string().nullable().optional(),
  gate: z.string().nullable().optional(),
  delivery_preference: z.string().nullable().optional(),
  delivery_date: z.string().optional(),
});
export type Label = z.infer<typeof LabelSchema>;

export const LabelAreaGroupSchema = z.object({
  area_id: z.string().nullable(),
  area_name: z.string(),
  count: z.number(),
  area_download_label: z.string().optional(),
  labels: z.array(LabelSchema),
});
export type LabelAreaGroup = z.infer<typeof LabelAreaGroupSchema>;

export const LabelDayFilterSchema = z.enum(['today', 'tomorrow']);
export type LabelDayFilter = z.infer<typeof LabelDayFilterSchema>;

export const LabelsResponseSchema = z
  .object({
    date: z.string(),
    date_label: z.string().optional(),
    dateLabel: z.string().optional(),
    day: LabelDayFilterSchema.nullable().optional(),
    total_count: z.number(),
    filtered_count: z.number(),
    bulk_download_label: z.string().optional(),
    areas: z.array(LabelAreaGroupSchema),
  })
  .transform((r) => ({
    date: r.date,
    date_label: r.date_label ?? r.dateLabel ?? null,
    day: r.day ?? null,
    total_count: r.total_count,
    filtered_count: r.filtered_count,
    bulk_download_label: r.bulk_download_label,
    areas: r.areas,
  }));
export type LabelsResponse = z.infer<typeof LabelsResponseSchema>;

export type MealTypeFilter = 'all' | 'executive' | 'salad';

/** Labels/export window: today through today + N days (Asia/Riyadh). */
export const DELIVERY_LABELS_MAX_DAYS_AHEAD = 7;

export type LabelsDateQuery =
  | { day: LabelDayFilter; deliveryDate?: undefined }
  | { day?: undefined; deliveryDate: string };

/** Format a Date as YYYY-MM-DD in Asia/Riyadh. */
export function formatDateKsa(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function todayKsa(): string {
  return formatDateKsa(new Date());
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return formatDateKsa(new Date(Date.UTC(y, m - 1, d + days)));
}

export function getDeliveryDateRange(): { minDate: string; maxDate: string } {
  const minDate = todayKsa();
  return {
    minDate,
    maxDate: addDaysToIsoDate(minDate, DELIVERY_LABELS_MAX_DAYS_AHEAD),
  };
}

export function isDateInDeliveryRange(isoDate: string): boolean {
  const { minDate, maxDate } = getDeliveryDateRange();
  return isoDate >= minDate && isoDate <= maxDate;
}

/** Map URL search params → API query (delivery_date wins when set). */
export function labelsDateQueryFromSearchParams(
  dayParam: string | null,
  deliveryDateParam: string | null,
): LabelsDateQuery {
  if (deliveryDateParam && isDateInDeliveryRange(deliveryDateParam)) {
    return { deliveryDate: deliveryDateParam };
  }
  if (dayParam === 'tomorrow') return { day: 'tomorrow' };
  return { day: 'today' };
}

/** Resolved ISO date for UI (picker value, pill highlight). */
export function resolvedDeliveryDateIso(
  dayParam: string | null,
  deliveryDateParam: string | null,
): string {
  const today = todayKsa();
  if (deliveryDateParam && isDateInDeliveryRange(deliveryDateParam)) {
    return deliveryDateParam;
  }
  if (dayParam === 'tomorrow') return addDaysToIsoDate(today, 1);
  return today;
}
