import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OutOfZoneRequestsSchema,
  formatOutOfZoneTimestamp,
  formatRequestCount,
} from '../src/features/areas/model/out-of-zone.schema.ts';

const documentedPayload = {
  total_requests: 18,
  areas: [
    {
      area_name: 'Al Zahra',
      request_count: 11,
      first_requested: '2026-10-01T08:30:00.000Z',
      last_requested: '2026-10-20T21:15:00.000Z',
    },
    {
      area_name: 'Al Nakheel',
      request_count: 7,
      first_requested: '2026-10-04T00:00:00.000Z',
      last_requested: '2026-10-18T12:00:00.000Z',
    },
  ],
  pagination: {
    page: 1,
    per_page: 20,
    total: 2,
    total_pages: 1,
  },
};

describe('OutOfZoneRequestsSchema', () => {
  it('parses the GetOutOfZoneRequests data payload into the queue model', () => {
    const parsed = OutOfZoneRequestsSchema.parse(documentedPayload);

    assert.equal(parsed.totalRequests, 18);
    assert.equal(parsed.pagination.page, 1);
    assert.equal(parsed.pagination.perPage, 20);
    assert.equal(parsed.pagination.total, 2);
    assert.equal(parsed.pagination.totalPages, 1);
    assert.deepEqual(parsed.areas[0], {
      areaName: 'Al Zahra',
      requestCount: 11,
      firstRequested: '2026-10-01T08:30:00.000Z',
      lastRequested: '2026-10-20T21:15:00.000Z',
    });
  });

  it('accepts an empty queue', () => {
    const parsed = OutOfZoneRequestsSchema.parse({
      total_requests: 0,
      areas: [],
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
    });

    assert.equal(parsed.totalRequests, 0);
    assert.deepEqual(parsed.areas, []);
    assert.equal(parsed.pagination.totalPages, 0);
  });

  it('rejects a row that is missing the documented fields', () => {
    const result = OutOfZoneRequestsSchema.safeParse({
      total_requests: 1,
      areas: [{ name: 'Al Zahra', count: 1 }],
      pagination: { page: 1, per_page: 20, total: 1, total_pages: 1 },
    });

    assert.equal(result.success, false);
  });
});

describe('out-of-zone display formatters', () => {
  it('formats request counts and Riyadh calendar dates', () => {
    assert.equal(formatRequestCount(1), '1 request');
    assert.equal(formatRequestCount(7), '7 requests');
    assert.equal(formatOutOfZoneTimestamp('2026-10-01T21:30:00.000Z'), 'Oct 2, 2026');
    assert.equal(formatOutOfZoneTimestamp(''), '—');
    assert.equal(formatOutOfZoneTimestamp('not-a-date'), 'not-a-date');
  });
});
