import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { ApiError, parseSoftDeleteResponse, unwrap } from '@/shared/types/api';
import {
  AreaSchema,
  BuildingSchema,
  type CreateAreaInput,
  type CreateBuildingInput,
  type AreaStatus,
} from '../model/areas.schema';
import { OutOfZoneRequestsSchema } from '../model/out-of-zone.schema';

export const OUT_OF_ZONE_REQUESTS_PAGE_SIZE = 20;

export type GetOutOfZoneRequestsParams = {
  page?: number;
  perPage?: number;
};

export async function getAreasApi() {
  const res = await client.get('/admin/areas');
  return unwrap(
    res.data,
    z.object({ areas: z.array(AreaSchema) }).transform((d) => d.areas)
  );
}

export async function getOutOfZoneRequestsApi(params: GetOutOfZoneRequestsParams = {}) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? OUT_OF_ZONE_REQUESTS_PAGE_SIZE;
  const res = await client.get('/admin/areas/out-of-zone-requests', {
    params: { page, per_page: perPage },
  });
  return unwrap(res.data, OutOfZoneRequestsSchema);
}

export async function createAreaApi(input: CreateAreaInput) {
  const res = await client.post('/admin/areas', input);
  return unwrap(res.data, AreaSchema);
}

export async function updateAreaApi(areaId: string, input: { name?: string; status?: AreaStatus }) {
  const body = input.status === 'active' ? { ...input, confirm_activation: true } : input;
  const res = await client.patch(`/admin/areas/${areaId}`, body);
  return unwrap(res.data, AreaSchema);
}

/**
 * DELETE /admin/areas/:area_id
 * Soft-delete. Response data includes `deleted` and `deletedAt`.
 * List endpoints omit the area after success.
 */
export async function deleteAreaApi(areaId: string) {
  const res = await client.delete(`/admin/areas/${areaId}`);
  const result = parseSoftDeleteResponse(res.data);
  if (!result.deleted) {
    throw new ApiError('Area was not deleted.', res.status, res.data);
  }
  return result;
}

export async function getBuildingsApi(areaId: string) {
  const res = await client.get(`/delivery/areas/${areaId}/buildings`);
  return unwrap(
    res.data,
    z.object({ buildings: z.array(BuildingSchema) }).transform((d) => d.buildings)
  );
}

export async function addBuildingApi(areaId: string, input: CreateBuildingInput) {
  const res = await client.post(`/admin/areas/${areaId}/buildings`, input);
  return unwrap(res.data, BuildingSchema);
}

export async function updateBuildingApi(areaId: string, buildingId: string, name: string) {
  const res = await client.patch(`/admin/areas/${areaId}/buildings/${buildingId}`, { name });
  return unwrap(res.data, BuildingSchema);
}

export async function deleteBuildingApi(areaId: string, buildingId: string) {
  await client.delete(`/admin/areas/${areaId}/buildings/${buildingId}`);
}
