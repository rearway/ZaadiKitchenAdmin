import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { useSessionStore } from '@/store/useSessionStore';
import {
  getDailyOpsApi,
  advancePipelineApi,
  getIssuesApi,
  creditIssueApi,
  rejectIssueApi,
} from './daily-ops.api';
import type { AdvancePipelineInput, CreditIssueInput, RejectIssueInput } from '../model/daily-ops.schema';

function useRole() {
  return useSessionStore((s) => s.user?.role ?? 'ops');
}

export function useDailyOps() {
  const role = useRole();
  return useQuery({
    queryKey: [...queryKeys.dailyOps.detail, role],
    queryFn: () => getDailyOpsApi(role),
  });
}

export function useAdvancePipeline() {
  const role = useRole();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvancePipelineInput) => advancePipelineApi(role, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dailyOps.detail }),
  });
}

/** Admin-only — the caller gates rendering/enabling on role === 'admin'. */
export function useIssues() {
  const role = useRole();
  return useQuery({
    queryKey: queryKeys.dailyOps.issues,
    queryFn: getIssuesApi,
    enabled: role === 'admin',
  });
}

export function useCreditIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: CreditIssueInput }) =>
      creditIssueApi(issueId, input),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.dailyOps.issues }),
        qc.invalidateQueries({ queryKey: queryKeys.dailyOps.detail }),
      ]),
  });
}

export function useRejectIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: RejectIssueInput }) =>
      rejectIssueApi(issueId, input),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.dailyOps.issues }),
        qc.invalidateQueries({ queryKey: queryKeys.dailyOps.detail }),
      ]),
  });
}
