import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import type { Role } from '@/shared/config/roles';
import {
  LabelsResponseSchema,
  type MealTypeFilter,
  type LabelDayFilter,
} from '../model/labels.schema';

export type GetLabelsParams = {
  mealType?: MealTypeFilter;
  areaId?: string | null;
  day?: LabelDayFilter;
  role?: Role;
};

export type DownloadLabelsParams = GetLabelsParams & {
  labelId?: string;
};

export type ExportDailyOpsParams = {
  day?: LabelDayFilter;
  role?: Role;
};

function dailyOpsBasePath(role: Role = 'admin') {
  return role === 'admin' ? '/admin/daily-ops' : '/ops/daily-ops';
}

function buildQueryParams(params: {
  mealType?: MealTypeFilter;
  areaId?: string | null;
  day?: LabelDayFilter;
  labelId?: string;
}) {
  const query: Record<string, string> = {};
  if (params.mealType && params.mealType !== 'all') query.meal_type = params.mealType;
  if (params.areaId) query.area_id = params.areaId;
  if (params.labelId) query.label_id = params.labelId;
  if (params.day) query.day = params.day;
  return query;
}

function fileDateSuffix(day?: LabelDayFilter) {
  return day === 'tomorrow' ? 'tomorrow' : 'today';
}

export async function getLabelsApi(params: GetLabelsParams = {}) {
  const role = params.role ?? 'admin';
  const res = await client.get(`${dailyOpsBasePath(role)}/labels`, {
    params: buildQueryParams(params),
  });
  return unwrap(res.data, LabelsResponseSchema);
}

export async function downloadLabelsApi(params: DownloadLabelsParams = {}) {
  const role = params.role ?? 'admin';
  const res = await client.get(`${dailyOpsBasePath(role)}/labels/download`, {
    params: buildQueryParams(params),
    responseType: 'blob',
  });
  const suffix = params.labelId ? 'single' : (params.mealType ?? 'all');
  return {
    blob: res.data as Blob,
    filename: `platio-labels-${fileDateSuffix(params.day)}-${suffix}.pdf`,
  };
}

export async function exportDailyOpsApi(params: ExportDailyOpsParams = {}) {
  const role = params.role ?? 'admin';
  const res = await client.get(`${dailyOpsBasePath(role)}/export`, {
    params: params.day ? { day: params.day } : undefined,
    responseType: 'blob',
  });
  return {
    blob: res.data as Blob,
    filename: `daily-ops-export-${fileDateSuffix(params.day)}.xlsx`,
  };
}
