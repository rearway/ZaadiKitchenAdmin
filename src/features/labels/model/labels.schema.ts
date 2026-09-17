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
    day: LabelDayFilterSchema.optional(),
    total_count: z.number(),
    filtered_count: z.number(),
    bulk_download_label: z.string().optional(),
    areas: z.array(LabelAreaGroupSchema),
  })
  .transform((r) => ({
    date: r.date,
    date_label: r.date_label ?? r.dateLabel ?? null,
    day: r.day ?? 'today',
    total_count: r.total_count,
    filtered_count: r.filtered_count,
    bulk_download_label: r.bulk_download_label,
    areas: r.areas,
  }));
export type LabelsResponse = z.infer<typeof LabelsResponseSchema>;

export type MealTypeFilter = 'all' | 'executive' | 'salad';

export function parseLabelDayParam(value: string | null | undefined): LabelDayFilter {
  return value === 'tomorrow' ? 'tomorrow' : 'today';
}
