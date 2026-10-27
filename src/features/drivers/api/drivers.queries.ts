import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { ApiError } from '@/shared/types/api';
import {
  assignDriverAreaApi,
  createDriverApi,
  deleteDriverApi,
  getDriverApi,
  getDriverDeliveriesApi,
  getDriversApi,
  getUnassignedDriverAreasApi,
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

export function useDriverDeliveries(driverId: string | null, date: string) {
  return useQuery({
    queryKey: queryKeys.drivers.deliveries(driverId ?? '', date),
    queryFn: () => getDriverDeliveriesApi(driverId as string, date),
    enabled: driverId !== null && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });
}

export function useUnassignedDriverAreas() {
  return useQuery({
    queryKey: queryKeys.drivers.unassignedAreas,
    queryFn: getUnassignedDriverAreasApi,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useAssignDriverArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, areaId }: { driverId: string; areaId: string }) =>
      assignDriverAreaApi(driverId, areaId),
    onSuccess: (_driver, { driverId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.detail(driverId) });
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.unassignedAreas });
    },
  });
}
