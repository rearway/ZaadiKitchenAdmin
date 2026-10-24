import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clientWeekAheadAccess,
  formatWeekAheadUnlock,
  isWeekBeyondHorizon,
  ksaClock,
  parseWeekAheadSignal,
  resolveWeekAheadAccess,
  weeksWithinHorizon,
  weekAheadLockMessage,
} from '../src/features/menu/model/week-horizon.ts';

const WED_BEFORE = new Date('2026-10-21T09:00:00.000Z'); // Wed 12:00 KSA
const THU_1759 = new Date('2026-10-22T14:59:59.000Z'); // Thu 17:59:59 KSA
const THU_1800 = new Date('2026-10-22T15:00:00.000Z'); // Thu 18:00:00 KSA
const FRI_OPEN = new Date('2026-10-22T21:30:00.000Z'); // Fri 00:30 KSA
const SAT_NOON = new Date('2026-10-24T09:00:00.000Z'); // Sat 12:00 KSA
const SUN_OPEN = new Date('2026-10-24T21:00:00.000Z'); // Sun 00:00 KSA

describe('Saudi week horizon', () => {
  it('keeps KSA wall time on UTC+3', () => {
    const clock = ksaClock(THU_1759);
    assert.equal(clock.ymd, '2026-10-22');
    assert.equal(clock.hour, 17);
    assert.equal(clock.minute, 59);
    assert.equal(clock.weekday, 4);
  });

  it('locks the week after next before Thursday 18:00 KSA', () => {
    for (const now of [WED_BEFORE, THU_1759]) {
      const access = clientWeekAheadAccess(now);
      assert.equal(access.locked, true);
      assert.equal(access.weeksAhead, 1);
      assert.equal(access.listCount, 2);
      assert.equal(access.currentStartDate, '2026-10-18');
      assert.equal(access.maxStartDate, '2026-10-25');
      assert.equal(access.unlockAt.toISOString(), '2026-10-22T15:00:00.000Z');
    }
  });

  it('opens two weeks ahead at Thursday 18:00 KSA', () => {
    const access = clientWeekAheadAccess(THU_1800);
    assert.equal(access.locked, false);
    assert.equal(access.weeksAhead, 2);
    assert.equal(access.listCount, 3);
    assert.equal(access.currentStartDate, '2026-10-18');
    assert.equal(access.maxStartDate, '2026-11-01');
  });

  it('shows two weeks ahead once Friday opens', () => {
    for (const now of [FRI_OPEN, SAT_NOON]) {
      const access = clientWeekAheadAccess(now);
      assert.equal(access.locked, false);
      assert.equal(access.listCount, 3);
      assert.equal(access.currentStartDate, '2026-10-25');
      assert.equal(access.maxStartDate, '2026-11-08');
    }
  });

  it('locks again on Sunday until the new Thursday 18:00', () => {
    const access = clientWeekAheadAccess(SUN_OPEN);
    assert.equal(access.locked, true);
    assert.equal(access.listCount, 2);
    assert.equal(access.currentStartDate, '2026-10-25');
    assert.equal(access.maxStartDate, '2026-11-01');
    assert.equal(access.unlockAt.toISOString(), '2026-10-29T15:00:00.000Z');
  });

  it('rolls the unlock Thursday across the new year', () => {
    const friday = new Date('2026-12-31T21:30:00.000Z'); // Fri 1 Jan 2027 00:30 KSA
    const access = clientWeekAheadAccess(friday);
    assert.equal(access.locked, false);
    assert.equal(access.currentStartDate, '2027-01-03');
    assert.equal(access.maxStartDate, '2027-01-17');
    assert.equal(access.unlockAt.toISOString(), '2026-12-31T15:00:00.000Z');
  });
});

describe('week list filtering', () => {
  const weeks = [
    { id: 'current', start_date: '2026-10-18' },
    { id: 'next', start_date: '2026-10-25' },
    { id: 'after', start_date: '2026-11-01' },
  ];

  it('hides the week after next while locked and keeps it once unlocked', () => {
    const locked = clientWeekAheadAccess(WED_BEFORE);
    const open = clientWeekAheadAccess(THU_1800);
    assert.deepEqual(
      weeksWithinHorizon(weeks, locked).map((week) => week.id),
      ['current', 'next']
    );
    assert.deepEqual(
      weeksWithinHorizon(weeks, open).map((week) => week.id),
      ['current', 'next', 'after']
    );
    assert.equal(isWeekBeyondHorizon('2026-11-01', locked), true);
    assert.equal(isWeekBeyondHorizon('2026-10-25', locked), false);
    assert.equal(isWeekBeyondHorizon('2026-11-01', open), false);
  });
});

describe('API week gate', () => {
  it('prefers an explicit locked flag over the clock', () => {
    const access = resolveWeekAheadAccess(THU_1800, {
      locked: true,
      unlockAt: '2026-10-22T18:00:00.000Z',
    });
    assert.equal(access.locked, true);
    assert.equal(access.listCount, 2);
    assert.equal(access.source, 'api');
    assert.equal(access.unlockAt.toISOString(), '2026-10-22T18:00:00.000Z');
  });

  it('prefers an explicit unlocked flag over the clock', () => {
    const access = resolveWeekAheadAccess(WED_BEFORE, { locked: false, unlockAt: null });
    assert.equal(access.locked, false);
    assert.equal(access.listCount, 3);
    assert.equal(access.maxStartDate, '2026-11-01');
  });

  it('treats a future unlock_at as locked when no boolean is set', () => {
    const access = resolveWeekAheadAccess(THU_1800, {
      locked: null,
      unlockAt: '2026-10-22T15:00:01.000Z',
    });
    assert.equal(access.locked, true);
    assert.equal(access.listCount, 2);
  });

  it('reads locked and unlock-at fields from the weeks payload', () => {
    const signal = parseWeekAheadSignal({
      weeks: [],
      nav: { next_week_locked: true, next_week_unlock_at: '2026-10-29T15:00:00.000Z' },
    });
    assert.deepEqual(signal, {
      locked: true,
      unlockAt: '2026-10-29T15:00:00.000Z',
    });

    const open = parseWeekAheadSignal({ can_add_next_week: true });
    assert.deepEqual(open, { locked: false, unlockAt: null });

    const nested = parseWeekAheadSignal({
      week_ahead: { available: false, unlock_at: '2026-10-29T15:00:00.000Z' },
    });
    assert.deepEqual(nested, {
      locked: true,
      unlockAt: '2026-10-29T15:00:00.000Z',
    });

    assert.equal(parseWeekAheadSignal({ weeks: [], nav: { next_week: 'w2026-45' } }), null);
  });
});

describe('lock message', () => {
  it('names Thursday 18:00 KSA', () => {
    const access = clientWeekAheadAccess(WED_BEFORE);
    const message = weekAheadLockMessage(access);
    assert.match(message, /week after next is locked until/);
    assert.match(message, /18:00/);
    assert.match(message, /\(KSA\)/);
    assert.match(formatWeekAheadUnlock(access.unlockAt), /Thu/);
  });
});
