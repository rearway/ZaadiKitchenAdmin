import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { ApiError, unwrap } from '@/shared/types/api';
import {
  DriverDeliveriesSchema,
  UnassignedAreasSchema,
  type AreaChoice,
  type DriverDeliveries,
} from '../model/driver-deliveries.schema';
import {
  DriverListSchema,
  DriverResponseSchema,
  DriverSchema,
  type CreateDriverInput,
  type Driver,
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
 *
 * Day deliveries and exclusive area assign (Backend PR #24):
 * GET    /admin/drivers/unassigned-areas
 *        Live areas with no driver. `{ areas: [{ id, name, status }] }`.
 * POST   /admin/drivers/:driver_id/areas   { area_id }
 *        409 AREA_ALREADY_ASSIGNED with `message` when another driver has the area.
 * GET    /admin/drivers/:driver_id/deliveries?date=YYYY-MM-DD
 *        Omit `date` for today in Asia/Riyadh.
 *        `{ date, deliveries }` — empty day is `deliveries: []`.
 *        Each row: customer_name, phone, meal_name, meal_type,
 *        status (pending | delivered | skipped | paused),
 *        domain_status (scheduled | past_cutoff | delivered | skipped | paused),
 *        review `{ stars, text, tags }` only when delivered and rated, else null.
 *        `scheduled` and `past_cutoff` arrive as status `pending`.
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

export async function getDriverDeliveriesApi(
  driverId: string,
  date: string
): Promise<DriverDeliveries> {
  const res = await client.get(`/admin/drivers/${driverId}/deliveries`, {
    params: { date },
  });
  return unwrap(res.data, DriverDeliveriesSchema);
}

export type UnassignedAreasResult =
  | { available: true; areas: AreaChoice[] }
  | { available: false; areas: [] };

/** 404 = the unassigned-areas route is not on this API yet. Callers fall back to the driver list. */
export async function getUnassignedDriverAreasApi(): Promise<UnassignedAreasResult> {
  try {
    const res = await client.get('/admin/drivers/unassigned-areas');
    return { available: true, areas: unwrap(res.data, UnassignedAreasSchema) };
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      return { available: false, areas: [] };
    }
    throw err;
  }
}

function responsePayload(responseData: unknown): unknown {
  const envelope = z.object({ data: z.unknown() }).passthrough().safeParse(responseData);
  return envelope.success ? envelope.data.data : responseData;
}

/**
 * Adds one free area. Does not replace the driver's other areas.
 * A taken area rejects with 409; the page shows that message.
 */
export async function assignDriverAreaApi(
  driverId: string,
  areaId: string
): Promise<Driver | null> {
  const res = await client.post(`/admin/drivers/${driverId}/areas`, { area_id: areaId });
  const parsed = DriverSchema.safeParse(responsePayload(res.data));
  return parsed.success ? parsed.data : null;
}
