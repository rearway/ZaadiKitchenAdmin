import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import { LoginResponseSchema } from '../model/auth.schema';

export async function loginApi(email: string, password: string) {
  const res = await client.post('/auth/admin/login', { email, password });
  return unwrap(res.data, LoginResponseSchema);
}

export async function logoutApi() {
  await client.post('/auth/admin/logout');
}
