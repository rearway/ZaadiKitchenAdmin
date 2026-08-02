import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { triggerBlobDownload } from '@/shared/lib/download';
import { getLabelsApi, downloadLabelsApi, exportDailyOpsApi, type GetLabelsParams, type DownloadLabelsParams } from './labels.api';

export function useLabels(params: GetLabelsParams = {}) {
  return useQuery({
    queryKey: queryKeys.labels.list(params),
    queryFn: () => getLabelsApi(params),
  });
}

export function useDownloadLabels() {
  return useMutation({
    mutationFn: (params: DownloadLabelsParams = {}) => downloadLabelsApi(params),
    onSuccess: ({ blob, filename }) => triggerBlobDownload(blob, filename),
  });
}

export function useExportDailyOps() {
  return useMutation({
    mutationFn: () => exportDailyOpsApi(),
    onSuccess: ({ blob, filename }) => triggerBlobDownload(blob, filename),
  });
}
