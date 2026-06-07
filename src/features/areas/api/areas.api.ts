import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import { AreaSchema, BuildingSchema, type CreateAreaInput, type CreateBuildingInput, type AreaStatus } from '../model/areas.schema';
import { z } from 'zod';

export async function getAreasApi() {
  const res = await client.get('/admin/areas');
  return unwrap(res.data, z.object({ areas: z.array(AreaSchema) }).transform((d) => d.areas));
}

export async function createAreaApi(input: CreateAreaInput) {
  const res = await client.post('/admin/areas', input);
  return unwrap(res.data, AreaSchema);
}

export async function updateAreaApi(areaId: string, input: { name?: string; status?: AreaStatus }) {
  const body = input.status === 'active'
    ? { ...input, confirm_activation: true }
    : input;
  const res = await client.patch(`/admin/areas/${areaId}`, body);
  return unwrap(res.data, AreaSchema);
}

export async function getBuildingsApi(areaId: string) {
  const res = await client.get(`/delivery/areas/${areaId}/buildings`);
  return unwrap(res.data, z.object({ buildings: z.array(BuildingSchema) }).transform((d) => d.buildings));
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
