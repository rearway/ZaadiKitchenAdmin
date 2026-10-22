import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { getPlansApi, updatePlanPricingApi } from './plans.api';
import type { Plan, UpdatePlanPricingInput } from '../model/plans.schema';

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: getPlansApi,
  });
}

export function useUpdatePlanPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: UpdatePlanPricingInput }) =>
      updatePlanPricingApi(planId, input),
    onSuccess: (updated: Plan) => {
      qc.setQueryData<Plan[]>(queryKeys.plans.all, (old) =>
        old?.map((p) => (p.id === updated.id ? updated : p)),
      );
    },
  });
}
