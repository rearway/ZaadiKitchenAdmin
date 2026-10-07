import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import { RevenueSummarySchema, RevenueDailySchema } from '../model/revenue.schema';

export async function getRevenueSummaryApi() {
  const res = await client.get('/admin/revenue/summary');
  return unwrap(res.data, RevenueSummarySchema);
}

export async function getRevenueDailyApi(month: string) {
  const res = await client.get('/admin/revenue/daily', { params: { month } });
  return unwrap(res.data, RevenueDailySchema);
}
