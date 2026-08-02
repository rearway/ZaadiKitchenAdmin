import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import { LabelsResponseSchema, type MealTypeFilter } from '../model/labels.schema';

export type GetLabelsParams = {
  mealType?: MealTypeFilter;
  areaId?: string;
};

export type DownloadLabelsParams = GetLabelsParams & {
  labelId?: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function getLabelsApi(params: GetLabelsParams = {}) {
  const res = await client.get('/admin/daily-ops/labels', {
    params: { meal_type: params.mealType, area_id: params.areaId },
  });
  return unwrap(res.data, LabelsResponseSchema);
}

export async function downloadLabelsApi(params: DownloadLabelsParams = {}) {
  const res = await client.get('/admin/daily-ops/labels/download', {
    params: { meal_type: params.mealType, area_id: params.areaId, label_id: params.labelId },
    responseType: 'blob',
  });
  const suffix = params.labelId ? 'single' : (params.mealType ?? 'all');
  return { blob: res.data as Blob, filename: `platio-labels-${todayIso()}-${suffix}.pdf` };
}

export async function exportDailyOpsApi() {
  const res = await client.get('/admin/daily-ops/export', { responseType: 'blob' });
  return { blob: res.data as Blob, filename: `daily-ops-export-${todayIso()}.xlsx` };
}
