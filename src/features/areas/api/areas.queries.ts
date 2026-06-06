import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { getAreasApi, createAreaApi, getBuildingsApi, addBuildingApi } from './areas.api';
import type { CreateAreaInput, CreateBuildingInput } from '../model/areas.schema';

export function useAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: getAreasApi,
  });
}

export function useBuildings(areaId: string) {
  return useQuery({
    queryKey: queryKeys.areas.buildings(areaId),
    queryFn: () => getBuildingsApi(areaId),
    enabled: !!areaId,
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAreaInput) => createAreaApi(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}

export function useAddBuilding(areaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBuildingInput) => addBuildingApi(areaId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.areas.buildings(areaId) }),
  });
}
