import { z } from 'zod';

const ChangeDirectionSchema = z.enum(['up', 'down', 'flat']);

const MrrSchema = z
  .object({
    amount_sar: z.number().optional(),
    amountSar: z.number().optional(),
    change_pct: z.number().optional(),
    changePct: z.number().optional(),
    change_direction: ChangeDirectionSchema.optional(),
    changeDirection: ChangeDirectionSchema.optional(),
    comparison_label: z.string().optional(),
    comparisonLabel: z.string().optional(),
  })
  .transform((m) => ({
    amount_sar: m.amount_sar ?? m.amountSar ?? 0,
    change_pct: m.change_pct ?? m.changePct ?? 0,
    change_direction: m.change_direction ?? m.changeDirection ?? 'flat',
    comparison_label: m.comparison_label ?? m.comparisonLabel ?? 'vs last month',
  }));

const SubscriberCountsSchema = z
  .object({
    active: z.number(),
    new_today: z.number().optional(),
    newToday: z.number().optional(),
    churned: z.number(),
  })
  .transform((s) => ({
    active: s.active,
    new_today: s.new_today ?? s.newToday ?? 0,
    churned: s.churned,
  }));

const PlanBreakdownSchema = z
  .object({
    plan_id: z.string().optional(),
    planId: z.string().optional(),
    plan_label: z.string().optional(),
    planLabel: z.string().optional(),
    count: z.number(),
  })
  .transform((p) => ({
    plan_id: p.plan_id ?? p.planId ?? '',
    plan_label: p.plan_label ?? p.planLabel ?? '',
    count: p.count,
  }));

const MetricDeltaSchema = z
  .object({
    value: z.number(),
    change: z.number().optional(),
    change_direction: ChangeDirectionSchema.optional(),
    changeDirection: ChangeDirectionSchema.optional(),
    comparison_label: z.string().optional(),
    comparisonLabel: z.string().optional(),
    label: z.string().optional(),
  })
  .transform((m) => ({
    value: m.value,
    change: m.change ?? 0,
    change_direction: m.change_direction ?? m.changeDirection ?? 'flat',
    comparison_label: m.comparison_label ?? m.comparisonLabel ?? '',
    label: m.label ?? '',
  }));

const KeyMetricsSchema = z
  .object({
    avg_skip_rate: MetricDeltaSchema.optional(),
    avgSkipRate: MetricDeltaSchema.optional(),
    salad_meal_pct: MetricDeltaSchema.optional(),
    saladMealPct: MetricDeltaSchema.optional(),
  })
  .transform((k) => ({
    avg_skip_rate: k.avg_skip_rate ?? k.avgSkipRate ?? { value: 0, change: 0, change_direction: 'flat', comparison_label: 'vs last week', label: '' },
    salad_meal_pct: k.salad_meal_pct ?? k.saladMealPct ?? { value: 0, change: 0, change_direction: 'flat', comparison_label: '', label: 'of active subs' },
  }));

export const RevenueSummarySchema = z
  .object({
    mrr: MrrSchema,
    subscriber_counts: SubscriberCountsSchema.optional(),
    subscriberCounts: SubscriberCountsSchema.optional(),
    subscribers_by_plan: z.array(PlanBreakdownSchema).optional(),
    subscribersByPlan: z.array(PlanBreakdownSchema).optional(),
    key_metrics: KeyMetricsSchema.optional(),
    keyMetrics: KeyMetricsSchema.optional(),
    as_of: z.string().optional(),
    asOf: z.string().optional(),
  })
  .transform((r) => ({
    mrr: r.mrr,
    subscriber_counts: r.subscriber_counts ?? r.subscriberCounts ?? { active: 0, new_today: 0, churned: 0 },
    subscribers_by_plan: r.subscribers_by_plan ?? r.subscribersByPlan ?? [],
    key_metrics: r.key_metrics ?? r.keyMetrics ?? {
      avg_skip_rate: { value: 0, change: 0, change_direction: 'flat', comparison_label: 'vs last week', label: '' },
      salad_meal_pct: { value: 0, change: 0, change_direction: 'flat', comparison_label: '', label: 'of active subs' },
    },
    as_of: r.as_of ?? r.asOf ?? null,
  }));
export type RevenueSummary = z.infer<typeof RevenueSummarySchema>;

const DailyRevenueDaySchema = z
  .object({
    date: z.string(),
    day_label: z.string().optional(),
    dayLabel: z.string().optional(),
    revenue_sar: z.number().optional(),
    revenueSar: z.number().optional(),
    is_today: z.boolean().optional(),
    isToday: z.boolean().optional(),
  })
  .transform((d) => ({
    date: d.date,
    day_label: d.day_label ?? d.dayLabel ?? '',
    revenue_sar: d.revenue_sar ?? d.revenueSar ?? 0,
    is_today: d.is_today ?? d.isToday ?? false,
  }));

const AvailableMonthSchema = z
  .object({
    value: z.string(),
    label: z.string(),
  });

export const RevenueDailySchema = z
  .object({
    month: z.string(),
    month_label: z.string().optional(),
    monthLabel: z.string().optional(),
    days: z.array(DailyRevenueDaySchema),
    available_months: z.array(AvailableMonthSchema).optional(),
    availableMonths: z.array(AvailableMonthSchema).optional(),
  })
  .transform((r) => ({
    month: r.month,
    month_label: r.month_label ?? r.monthLabel ?? r.month,
    days: r.days,
    available_months: r.available_months ?? r.availableMonths ?? [],
  }));
export type RevenueDaily = z.infer<typeof RevenueDailySchema>;

export const PLAN_BAR_COLORS = [
  'var(--danger)',
  'var(--red)',
  'var(--ops)',
  'var(--danger)',
] as const;

export function formatRevenueSar(amount: number): string {
  return `SAR ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatMrrChangeBadge(
  changePct: number,
  direction: 'up' | 'down' | 'flat',
  comparisonLabel: string,
): string {
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const sign = changePct > 0 ? '+' : '';
  return `${arrow} ${sign}${changePct}% ${comparisonLabel}`;
}

export function formatSkipRateChange(
  change: number,
  direction: 'up' | 'down' | 'flat',
  comparisonLabel: string,
): string {
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const sign = change > 0 ? '+' : '';
  return `${arrow} ${sign}${change} ${comparisonLabel}`;
}

/** Current calendar month in Asia/Riyadh as YYYY-MM. */
export function currentMonthKsa(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  return `${year}-${month}`;
}
