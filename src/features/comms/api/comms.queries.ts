import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import {
  getAutomationsApi,
  updateAutomationApi,
  getBroadcastSegmentsApi,
  sendBroadcastApi,
} from './comms.api';
import type { AutomationId } from '../model/comms.schema';

export function useAutomations() {
  return useQuery({
    queryKey: queryKeys.comms.automations,
    queryFn: getAutomationsApi,
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: AutomationId; isEnabled: boolean }) =>
      updateAutomationApi(id, isEnabled),
    onMutate: async ({ id, isEnabled }) => {
      await qc.cancelQueries({ queryKey: queryKeys.comms.automations });
      const previous = qc.getQueryData(queryKeys.comms.automations);
      qc.setQueryData(queryKeys.comms.automations, (old: Awaited<ReturnType<typeof getAutomationsApi>> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          automations: old.automations.map((a) =>
            a.id === id ? { ...a, is_enabled: isEnabled } : a,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.comms.automations, context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comms.automations });
    },
  });
}

export function useBroadcastSegments() {
  return useQuery({
    queryKey: queryKeys.comms.broadcastSegments,
    queryFn: getBroadcastSegmentsApi,
  });
}

export function useSendBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendBroadcastApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comms.broadcastSegments });
    },
  });
}
