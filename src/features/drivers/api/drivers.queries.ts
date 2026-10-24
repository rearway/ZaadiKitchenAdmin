import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  createDriverApi,
  deleteDriverApi,
  getDriverApi,
  getDriversApi,
  updateDriverApi,
} from './drivers.api';
import type { CreateDriverInput, UpdateDriverInput } from '../model/drivers.schema';

export function useDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers.all,
    queryFn: getDriversApi,
  });
}

export function useDriver(driverId: string | null) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(driverId ?? ''),
    queryFn: () => getDriverApi(driverId as string),
    enabled: driverId !== null,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDriverInput) => createDriverApi(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, input }: { driverId: string; input: UpdateDriverInput }) =>
      updateDriverApi(driverId, input),
    onSuccess: (_driver, { driverId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.detail(driverId) });
    },
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => deleteDriverApi(driverId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}
