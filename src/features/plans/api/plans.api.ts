import { client } from '@/shared/lib/api/client';
import { ApiError, unwrap } from '@/shared/types/api';
import {
  PlanSchema,
  PlansListSchema,
  type UpdatePlanPricingInput,
} from '../model/plans.schema';

export async function getPlansApi() {
  const res = await client.get('/admin/plans');
  const parsed = PlansListSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new ApiError('Invalid plans list response', 422, parsed.error.issues);
  }
  return parsed.data.plans;
}

export async function updatePlanPricingApi(planId: string, input: UpdatePlanPricingInput) {
  const res = await client.patch(`/admin/plans/${planId}`, input);
  return unwrap(res.data, PlanSchema);
}
