import { z } from 'zod';

const CountSchema = z.number().int().nonnegative();

export const OutOfZoneRequestSchema = z
  .object({
    area_name: z.string(),
    request_count: CountSchema,
    first_requested: z.string(),
    last_requested: z.string(),
  })
  .transform((row) => ({
    areaName: row.area_name,
    requestCount: row.request_count,
    firstRequested: row.first_requested,
    lastRequested: row.last_requested,
  }));
export type OutOfZoneRequest = z.infer<typeof OutOfZoneRequestSchema>;

export const OutOfZoneRequestsSchema = z
  .object({
    total_requests: CountSchema,
    areas: z.array(OutOfZoneRequestSchema),
    pagination: z.object({
      page: CountSchema,
      per_page: CountSchema,
      total: CountSchema,
      total_pages: CountSchema,
    }),
  })
  .transform((payload) => ({
    totalRequests: payload.total_requests,
    areas: payload.areas,
    pagination: {
      page: payload.pagination.page,
      perPage: payload.pagination.per_page,
      total: payload.pagination.total,
      totalPages: payload.pagination.total_pages,
    },
  }));
export type OutOfZoneRequests = z.infer<typeof OutOfZoneRequestsSchema>;

const requestTimestampFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Riyadh',
});

/** Calendar date in Asia/Riyadh. Unparseable values are shown as returned. */
export function formatOutOfZoneTimestamp(value: string): string {
  if (!value.trim()) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return requestTimestampFormat.format(date);
}

export function formatRequestCount(count: number): string {
  return `${count} ${count === 1 ? 'request' : 'requests'}`;
}
