import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  CustomerSchema,
  CustomerListResponseSchema,
  CustomerDetailSchema,
  CustomerHistorySchema,
  type CreditWalletInput,
} from '../model/customers.schema';

export type GetCustomersParams = {
  search?: string;
  status?: string;
  page?: number;
};

export async function getCustomersApi(params: GetCustomersParams = {}) {
  const res = await client.get('/admin/customers', { params });
  const envelope = z.object({ data: z.unknown() }).passthrough().safeParse(res.data);
  const payload = envelope.success ? envelope.data.data : res.data;

  if (Array.isArray(payload)) {
    const customers = z.array(CustomerSchema).parse(payload);
    return { customers, total: customers.length, page: 1, pageSize: customers.length, totalPages: 1 };
  }
  return CustomerListResponseSchema.parse(payload);
}

export async function getCustomerDetailApi(id: string) {
  const res = await client.get(`/admin/customers/${id}`);
  return unwrap(res.data, CustomerDetailSchema);
}

export async function getCustomerHistoryApi(id: string) {
  const res = await client.get(`/admin/customers/${id}/history`);
  return unwrap(res.data, CustomerHistorySchema);
}

export async function deactivateCustomerApi(id: string) {
  await client.post(`/admin/customers/${id}/deactivate`);
}

export async function creditWalletApi(id: string, input: CreditWalletInput) {
  await client.post(`/admin/customers/${id}/wallet/credit`, input);
}
