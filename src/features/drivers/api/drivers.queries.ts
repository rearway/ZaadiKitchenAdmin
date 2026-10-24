import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  createDriverApi,
  deleteDriverApi,
  DRIVERS_PAGE_SIZE,
  getDriversApi,
  updateDriverApi,
  type GetDriversParams,
} from './drivers.api';
import type { DriverWriteInput } from '../model/drivers.schema';

export function useDrivers(params: GetDriversParams = {}) {
  const queryParams = {
    q: params.q,
    page: params.page ?? 1,
    perPage: params.perPage ?? DRIVERS_PAGE_SIZE,
  };
  return useQuery({
    queryKey: queryKeys.drivers.list(queryParams),
    queryFn: () => getDriversApi(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DriverWriteInput) => createDriverApi(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DriverWriteInput }) =>
      updateDriverApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDriverApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}
