import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  getAreasApi,
  getOutOfZoneRequestsApi,
  createAreaApi,
  deleteAreaApi,
  updateAreaApi,
  getBuildingsApi,
  addBuildingApi,
  updateBuildingApi,
  deleteBuildingApi,
  OUT_OF_ZONE_REQUESTS_PAGE_SIZE,
  type GetOutOfZoneRequestsParams,
} from './areas.api';
import type { CreateAreaInput, CreateBuildingInput, AreaStatus } from '../model/areas.schema';

export function useAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: getAreasApi,
  });
}

export function useOutOfZoneRequests(params: GetOutOfZoneRequestsParams = {}) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? OUT_OF_ZONE_REQUESTS_PAGE_SIZE;
  const queryParams = { page, perPage };
  return useQuery({
    queryKey: queryKeys.areas.outOfZoneRequests(queryParams),
    queryFn: () => getOutOfZoneRequestsApi(queryParams),
    placeholderData: keepPreviousData,
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

export function useDeleteArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) => deleteAreaApi(areaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      areaId,
      input,
    }: {
      areaId: string;
      input: { name?: string; status?: AreaStatus };
    }) => updateAreaApi(areaId, input),
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

export function useUpdateBuilding(areaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ buildingId, name }: { buildingId: string; name: string }) =>
      updateBuildingApi(areaId, buildingId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.areas.buildings(areaId) }),
  });
}

export function useDeleteBuilding(areaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (buildingId: string) => deleteBuildingApi(areaId, buildingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.areas.buildings(areaId) }),
  });
}
