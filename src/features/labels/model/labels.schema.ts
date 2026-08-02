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
  area_id: z.string(),
  area_name: z.string(),
  count: z.number(),
  area_download_label: z.string().optional(),
  labels: z.array(LabelSchema),
});
export type LabelAreaGroup = z.infer<typeof LabelAreaGroupSchema>;

export const LabelsResponseSchema = z.object({
  date: z.string(),
  total_count: z.number(),
  filtered_count: z.number(),
  bulk_download_label: z.string().optional(),
  areas: z.array(LabelAreaGroupSchema),
});
export type LabelsResponse = z.infer<typeof LabelsResponseSchema>;

export type MealTypeFilter = 'all' | 'executive' | 'salad';
