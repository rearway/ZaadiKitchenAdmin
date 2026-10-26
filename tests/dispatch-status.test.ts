import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AdvancePipelineResultSchema,
  DailyOpsSchema,
  nextPipelineStatusChange,
} from '../src/features/daily-ops/model/daily-ops.schema.ts';

const lockedDay = {
  date: '2026-10-26',
  date_label: 'Today — Sun 26 Oct',
  pipeline: {
    stage: 'locked',
    stages: [
      { id: 'locked', label: 'Locked', status: 'active' },
      { id: 'dispatch', label: 'Dispatch', status: 'pending' },
      { id: 'delivered', label: 'Delivered', status: 'pending' },
    ],
    locked_at: '2026-10-25T15:00:00.000Z',
    locked_note: 'Cutoff passed at 6:00 PM · Meal count frozen at 12 deliveries',
    can_advance: true,
    advance_label: 'Mark as Dispatched →',
  },
  meal_breakdown: { total: 12, rows: [] },
  issues_queue: { open_count: 0, issues: [] },
};

describe('daily ops dispatch status change', () => {
  it('posts the loaded date and locked → dispatch only', () => {
    const ops = DailyOpsSchema.parse(lockedDay);
    assert.deepEqual(
      nextPipelineStatusChange({
        date: ops.date,
        stage: ops.pipeline.stage,
        stages: ops.pipeline.stages,
      }),
      { date: '2026-10-26', from_stage: 'locked', to_stage: 'dispatch' }
    );
  });

  it('does not build a dispatch request without a delivery date', () => {
    assert.equal(
      nextPipelineStatusChange({
        date: '',
        stage: 'locked',
        stages: lockedDay.pipeline.stages,
      }),
      null
    );
  });

  it('accepts a pending day whose advance label is null', () => {
    const ops = DailyOpsSchema.parse({
      ...lockedDay,
      pipeline: {
        ...lockedDay.pipeline,
        stage: 'pending',
        can_advance: false,
        advance_label: null,
        locked_at: null,
        locked_note: null,
      },
    });
    assert.equal(ops.pipeline.stage, 'pending');
    assert.equal(
      nextPipelineStatusChange({
        date: ops.date,
        stage: ops.pipeline.stage,
        stages: ops.pipeline.stages,
      }),
      null
    );
  });

  it('accepts the status-change response after dispatch', () => {
    const result = AdvancePipelineResultSchema.parse({
      date: '2026-10-26',
      previous_stage: 'locked',
      current_stage: 'dispatch',
      advanced_at: '2026-10-26T06:00:00.000Z',
      advanced_by: 'Admin',
    });
    assert.equal(result.current_stage, 'dispatch');
  });
});
