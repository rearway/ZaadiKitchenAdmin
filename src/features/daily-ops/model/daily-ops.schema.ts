import { z } from 'zod';

export type PipelineStage = 'pending' | 'locked' | 'dispatch' | 'delivered';
const PIPELINE_STAGES: PipelineStage[] = ['pending', 'locked', 'dispatch', 'delivered'];

const StageValueSchema = z.string().transform((s, ctx) => {
  const lower = s.toLowerCase();
  if (!PIPELINE_STAGES.includes(lower as PipelineStage)) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_value,
      values: PIPELINE_STAGES,
      received: s,
    } as Parameters<typeof ctx.addIssue>[0]);
    return z.NEVER;
  }
  return lower as PipelineStage;
});

const PipelineStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['done', 'active', 'pending']),
});

export const PipelineSchema = z.object({
  stage: StageValueSchema,
  stages: z.array(PipelineStepSchema),
  locked_at: z.string().nullable().optional(),
  locked_note: z.string().nullable().optional(),
  can_advance: z.boolean(),
  advance_label: z.string().nullable().optional(),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

export const MealBreakdownRowSchema = z.object({
  type: z.string(),
  label: z.string(),
  count: z.number(),
  pct: z.number().optional(),
});

export const MealBreakdownSchema = z.object({
  total: z.number(),
  rows: z.array(MealBreakdownRowSchema),
});
export type MealBreakdown = z.infer<typeof MealBreakdownSchema>;

export const IssueSchema = z.object({
  issue_id: z.string(),
  customer_id: z.string().optional(),
  customer_name: z.string(),
  customer_phone: z.string().optional().nullable(),
  delivery_address: z.string().nullable().optional(),
  issue_type: z.string().optional(),
  issue_type_label: z.string(),
  description: z.string().nullable().optional(),
  submitted_at: z.string().optional(),
  delivery_date: z.string().optional(),
  meal_name: z.string().nullable().optional(),
  meal_type: z.string().nullable().optional(),
  plan_price_sar: z.number().nullable().optional(),
  status: z.string().optional(),
  resolved_at: z.string().nullable().optional(),
  resolution: z.string().nullable().optional(),
});
export type Issue = z.infer<typeof IssueSchema>;

export const IssuesQueueSchema = z.object({
  open_count: z.number(),
  issues: z.array(IssueSchema),
});
export type IssuesQueue = z.infer<typeof IssuesQueueSchema>;

export const DailyOpsSchema = z.object({
  date: z.string(),
  date_label: z.string().optional(),
  pipeline: PipelineSchema,
  meal_breakdown: MealBreakdownSchema,
  issues_queue: IssuesQueueSchema.nullable().optional(),
});
export type DailyOps = z.infer<typeof DailyOpsSchema>;

export const AdvancePipelineResultSchema = z.object({
  date: z.string(),
  previous_stage: StageValueSchema.optional(),
  current_stage: StageValueSchema.optional(),
  advanced_at: z.string().optional(),
  advanced_by: z.string().optional(),
});
export type AdvancePipelineResult = z.infer<typeof AdvancePipelineResultSchema>;

export type AdvancePipelineInput = {
  date: string;
  from_stage: 'locked' | 'dispatch';
  to_stage: 'dispatch' | 'delivered';
};

/**
 * Dispatch and Delivered are admin status changes only.
 * The pipeline endpoint requires the loaded ops date plus the current stage.
 */
export function pipelineAdvanceInput(date: string, stage: string): AdvancePipelineInput | null {
  const day = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  if (stage === 'locked') return { date: day, from_stage: 'locked', to_stage: 'dispatch' };
  if (stage === 'dispatch') return { date: day, from_stage: 'dispatch', to_stage: 'delivered' };
  return null;
}

export type CreditIssueInput = {
  credit_sar: number;
  note?: string;
};

export type RejectIssueInput = {
  reason: string;
  note?: string;
};

const opsDeliveryDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const opsSubmittedAtFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Riyadh',
});

/** Prefill the credit field when the plan price is inside the SAR 0–30 cap. */
export function creditPrefillSar(planPriceSar: number | null | undefined): string {
  if (planPriceSar == null || !Number.isFinite(planPriceSar)) return '';
  if (planPriceSar < 0 || planPriceSar > 30) return '';
  const rounded = Math.round(planPriceSar * 100) / 100;
  return String(rounded);
}

export function mealTypeLabel(mealType: string | null | undefined): string {
  const key = mealType?.trim().toLowerCase() ?? '';
  if (key === 'executive') return 'Executive';
  if (key === 'salad') return 'Salad';
  return mealType?.trim() ?? '';
}

export function formatOpsDeliveryDate(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) return trimmed;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return trimmed;
  return opsDeliveryDateFormat.format(date);
}

export function formatOpsSubmittedAt(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return opsSubmittedAtFormat.format(date).replace(/\u202f/g, ' ');
}

/** Canned reasons shown in the Reject modal — selected option's title/desc map to reason/note. */
export const REJECT_REASONS = [
  { id: '1', title: 'Not a valid issue', desc: 'Issue does not meet support criteria' },
  { id: '2', title: 'Duplicate report', desc: 'Same issue already reported and actioned' },
  { id: '3', title: 'Outside policy', desc: 'Reported issue does not qualify for credit' },
];
