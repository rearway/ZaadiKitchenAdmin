import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import type { Role } from '@/shared/config/roles';
import {
  DailyOpsSchema,
  IssuesQueueSchema,
  AdvancePipelineResultSchema,
  type AdvancePipelineInput,
  type CreditIssueInput,
  type RejectIssueInput,
} from '../model/daily-ops.schema';

const basePath = (role: Role) => (role === 'admin' ? '/admin/daily-ops' : '/ops/daily-ops');

export async function getDailyOpsApi(role: Role) {
  const res = await client.get(basePath(role));
  return unwrap(res.data, DailyOpsSchema);
}

export async function advancePipelineApi(role: Role, input: AdvancePipelineInput) {
  const res = await client.post(`${basePath(role)}/pipeline/advance`, input);
  return unwrap(res.data, AdvancePipelineResultSchema);
}

/** Admin-only — the richer issues list (includes delivery_address), used for the queue UI. */
export async function getIssuesApi() {
  const res = await client.get('/admin/daily-ops/issues');
  return unwrap(res.data, IssuesQueueSchema);
}

export async function creditIssueApi(issueId: string, input: CreditIssueInput) {
  await client.post(`/admin/daily-ops/issues/${issueId}/credit`, input);
}

export async function rejectIssueApi(issueId: string, input: RejectIssueInput) {
  await client.post(`/admin/daily-ops/issues/${issueId}/reject`, input);
}
