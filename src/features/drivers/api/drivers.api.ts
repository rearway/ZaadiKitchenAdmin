import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  DriverListSchema,
  DriverResponseSchema,
  type CreateDriverInput,
  type UpdateDriverInput,
} from '../model/drivers.schema';

/**
 * Admin drivers from ZaadiKitchenBackend PR #18. ADMIN JWT.
 * Staging needs the `driver_area_assignments` migration before these succeed.
 *
 * GET    /admin/drivers
 * GET    /admin/drivers/:driver_id
 * POST   /admin/drivers                 { full_name, phone, area_ids }
 * PATCH  /admin/drivers/:driver_id      { full_name?, phone?, is_active?, area_ids? }
 * DELETE /admin/drivers/:driver_id      soft-delete
 *
 * Sending `area_ids` replaces the whole assignment. [] clears it.
 * Create rejects any field other than full_name, phone, and area_ids.
 */

export async function getDriversApi() {
  const res = await client.get('/admin/drivers');
  return unwrap(res.data, DriverListSchema);
}

export async function getDriverApi(driverId: string) {
  const res = await client.get(`/admin/drivers/${driverId}`);
  return unwrap(res.data, DriverResponseSchema);
}

export async function createDriverApi(input: CreateDriverInput) {
  const res = await client.post('/admin/drivers', input);
  return unwrap(res.data, DriverResponseSchema);
}

export async function updateDriverApi(driverId: string, input: UpdateDriverInput) {
  const res = await client.patch(`/admin/drivers/${driverId}`, input);
  return unwrap(res.data, DriverResponseSchema);
}

export async function deleteDriverApi(driverId: string) {
  await client.delete(`/admin/drivers/${driverId}`);
}
