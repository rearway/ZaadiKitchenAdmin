import { z } from 'zod';

export const PlanSlugSchema = z.enum(['try_it', 'week', 'month', 'quarterly']);
export type PlanSlug = z.infer<typeof PlanSlugSchema>;

export const PlanSchema = z.object({
  id: z.string(),
  slug: PlanSlugSchema,
  name: z.string(),
  price_sar: z.number(),
  max_price_sar: z.number().nullable(),
  discount_percent: z.number().nullable(),
  meal_count: z.number(),
  price_per_meal_sar: z.number(),
  is_most_popular: z.boolean(),
  is_active: z.boolean(),
  updated_at: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const PlansListSchema = z.object({
  plans: z.array(PlanSchema),
});

export const UpdatePlanPricingInputSchema = z.object({
  price_sar: z.number().positive().optional(),
  max_price_sar: z.number().positive().nullable().optional(),
});
export type UpdatePlanPricingInput = z.infer<typeof UpdatePlanPricingInputSchema>;

export const PLAN_SLUG_ORDER: PlanSlug[] = ['try_it', 'week', 'month', 'quarterly'];

export function sortPlans(plans: Plan[]): Plan[] {
  return [...plans].sort(
    (a, b) => PLAN_SLUG_ORDER.indexOf(a.slug) - PLAN_SLUG_ORDER.indexOf(b.slug),
  );
}

export function formatPlanSar(amount: number): string {
  return `SAR ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Whole-number discount for preview when max > price; null = no discount display. */
export function previewDiscountPercent(maxPrice: number | null, price: number): number | null {
  if (maxPrice === null || maxPrice <= price) return null;
  return Math.round(((maxPrice - price) / maxPrice) * 100);
}

export function formatDiscountLabel(discountPercent: number | null): string {
  if (discountPercent === null) return 'No discount';
  return `${discountPercent}% off`;
}

const TWO_DECIMALS = /^\d+(\.\d{1,2})?$/;

export function parsePlanMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !TWO_DECIMALS.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
