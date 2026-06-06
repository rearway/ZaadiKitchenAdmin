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
} as const;
