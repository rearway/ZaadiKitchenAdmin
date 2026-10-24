import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  DriverListSchema,
  DriverResponseSchema,
  type DriverWriteInput,
} from '../model/drivers.schema';

/**
 * Admin driver CRUD. Not implemented on ZaadiKitchenBackend `dev` yet
 * (DRIVER users are still pre-created in the database). Paths follow
 * `/admin/areas` and `/admin/customers`: JWT bearer, `{ message?, data }` envelope.
 *
 * GET    /admin/drivers?q=&page=&per_page=
 * POST   /admin/drivers
 * PATCH  /admin/drivers/:id
 * DELETE /admin/drivers/:id
 *
 * Write body: `{ full_name, phone, language_preference, is_active, area_ids }`.
 * `area_ids` is the full assignment set (multi-area). An empty array clears areas.
 */

export const DRIVERS_PAGE_SIZE = 20;

export type GetDriversParams = {
  q?: string;
  page?: number;
  perPage?: number;
};

export async function getDriversApi(params: GetDriversParams = {}) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? DRIVERS_PAGE_SIZE;
  const res = await client.get('/admin/drivers', {
    params: {
      q: params.q || undefined,
      page,
      per_page: perPage,
    },
  });
  return unwrap(res.data, DriverListSchema);
}

export async function createDriverApi(input: DriverWriteInput) {
  const res = await client.post('/admin/drivers', input);
  return unwrap(res.data, DriverResponseSchema);
}

export async function updateDriverApi(id: string, input: DriverWriteInput) {
  const res = await client.patch(`/admin/drivers/${id}`, input);
  return unwrap(res.data, DriverResponseSchema);
}

export async function deleteDriverApi(id: string) {
  await client.delete(`/admin/drivers/${id}`);
}
