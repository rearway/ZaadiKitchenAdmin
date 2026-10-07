import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  getCustomersApi,
  getCustomerDetailApi,
  getCustomerHistoryApi,
  deactivateCustomerApi,
  creditWalletApi,
  type GetCustomersParams,
} from './customers.api';
import type { CreditWalletInput } from '../model/customers.schema';

export function useCustomers(params: GetCustomersParams = {}) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => getCustomersApi(params),
  });
}

export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getCustomerDetailApi(id),
    enabled: !!id,
  });
}

export function useCustomerHistory(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.history(id),
    queryFn: () => getCustomerHistoryApi(id),
    enabled: !!id,
  });
}

export function useDeactivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCustomerApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}

export function useCreditWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreditWalletInput }) =>
      creditWalletApi(id, input),
    onSuccess: (_, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.customers.all }),
        qc.invalidateQueries({ queryKey: queryKeys.customers.detail(id) }),
      ]),
  });
}
