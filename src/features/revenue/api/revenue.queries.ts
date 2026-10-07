import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { getRevenueSummaryApi, getRevenueDailyApi } from './revenue.api';

export function useRevenueSummary() {
  return useQuery({
    queryKey: queryKeys.revenue.summary,
    queryFn: getRevenueSummaryApi,
  });
}

export function useRevenueDaily(month: string) {
  return useQuery({
    queryKey: queryKeys.revenue.daily(month),
    queryFn: () => getRevenueDailyApi(month),
    enabled: !!month,
  });
}
