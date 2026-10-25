import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError, parseSoftDeleteResponse } from '../src/shared/types/api.ts';

describe('soft-delete response', () => {
  it('reads deleted and deletedAt from the admin envelope', () => {
    const parsed = parseSoftDeleteResponse({
      message: 'Meal deleted successfully',
      data: {
        id: 'meal-1',
        deleted: true,
        deletedAt: '2026-10-25T02:00:00.000Z',
      },
    });
    assert.equal(parsed.id, 'meal-1');
    assert.equal(parsed.deleted, true);
    assert.equal(parsed.deletedAt, '2026-10-25T02:00:00.000Z');
  });

  it('accepts snake_case deleted_at and area ids', () => {
    const parsed = parseSoftDeleteResponse({
      data: {
        area_id: 'area-9',
        deleted: true,
        deleted_at: '2026-10-25T02:00:00.000Z',
      },
    });
    assert.equal(parsed.id, 'area-9');
    assert.equal(parsed.deletedAt, '2026-10-25T02:00:00.000Z');
  });

  it('treats an empty body as a successful delete', () => {
    assert.deepEqual(parseSoftDeleteResponse(''), {
      id: null,
      deleted: true,
      deletedAt: null,
    });
    assert.deepEqual(parseSoftDeleteResponse(null), {
      id: null,
      deleted: true,
      deletedAt: null,
    });
  });

  it('keeps an explicit deleted:false so the caller can leave the row', () => {
    const parsed = parseSoftDeleteResponse({
      data: { id: 'meal-1', deleted: false },
    });
    assert.equal(parsed.deleted, false);
  });

  it('rejects a payload that is not an object', () => {
    assert.throws(() => parseSoftDeleteResponse('nope'), ApiError);
  });
});
