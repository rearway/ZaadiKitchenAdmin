import type { GetCustomersParams } from '@/features/customers/api/customers.api';

export const queryKeys = {
  areas: {
    all: ['areas'] as const,
    buildings: (areaId: string) => ['areas', areaId, 'buildings'] as const,
  },
  menu: {
    weeks: ['menu', 'weeks'] as const,
    weekDetail: (weekId: string) => ['menu', 'weeks', weekId] as const,
    meals: ['menu', 'meals'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params: GetCustomersParams) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', id] as const,
    history: (id: string) => ['customers', id, 'history'] as const,
  },
} as const;
