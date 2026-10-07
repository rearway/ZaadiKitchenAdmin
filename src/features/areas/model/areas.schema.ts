import { z } from 'zod';

export const AreaStatusSchema = z
  .enum(['active', 'coming_soon', 'paused', 'ACTIVE', 'COMING_SOON', 'PAUSED'])
  .transform((s) => s.toLowerCase() as 'active' | 'coming_soon' | 'paused');
export type AreaStatus = 'active' | 'coming_soon' | 'paused';

export const AreaSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    status: AreaStatusSchema,
    description: z.string().optional(),
  })
  .transform((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    description: a.description,
  }));
export type Area = z.infer<typeof AreaSchema>;

export const BuildingSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    area_id: z.string().optional(),
    areaId: z.string().optional(),
  })
  .transform((b) => ({
    id: b.id,
    name: b.name,
    area_id: b.area_id ?? b.areaId,
  }));
export type Building = z.infer<typeof BuildingSchema>;

export const CreateAreaInputSchema = z.object({
  name: z.string().min(1, 'Area name is required'),
  coverage: z.string().optional(),
  status: z.enum(['active', 'coming_soon', 'paused']),
});
export type CreateAreaInput = z.infer<typeof CreateAreaInputSchema>;

export const CreateBuildingInputSchema = z.object({
  name: z.string().min(1, 'Building name is required'),
});
export type CreateBuildingInput = z.infer<typeof CreateBuildingInputSchema>;

/** Map API status → display label */
export const AREA_STATUS_LABEL: Record<AreaStatus, string> = {
  active: 'Active',
  coming_soon: 'Coming Soon',
  paused: 'Paused',
};

/** Map API status → CSS token */
export const AREA_STATUS_COLOR: Record<AreaStatus, string> = {
  active: 'var(--grn)',
  coming_soon: '#F59E0B',
  paused: 'var(--soft)',
};
