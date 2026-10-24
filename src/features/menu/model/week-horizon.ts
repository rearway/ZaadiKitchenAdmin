/**
 * Menu Manager horizon for the Saudi work week (Sun–Thu, Asia/Riyadh).
 *
 * Before Thursday 18:00 KSA the planner may open the current week and the next
 * one only. At and after that cutoff — including Friday and Saturday, when the
 * work week has rolled forward — the week after next is available as well, so
 * two weeks ahead are open. An API lock / unlock-at signal overrides the clock.
 */

export const RIYADH_TIME_ZONE = 'Asia/Riyadh';

/** KSA is UTC+3 year-round (no daylight saving). */
const KSA_OFFSET_MS = 3 * 60 * 60 * 1000;

export type WeekAheadSignal = {
  /** Explicit gate. `null` when the payload did not say. */
  locked: boolean | null;
  /** ISO timestamp when the extra week opens. `null` when absent. */
  unlockAt: string | null;
};

export type WeekAheadAccess = {
  locked: boolean;
  /** How many Saudi work weeks past the current one may be opened. */
  weeksAhead: 1 | 2;
  /** `GET /admin/menu/weeks?count=` — current week plus `weeksAhead`. */
  listCount: 2 | 3;
  /** Sunday of the current Saudi work week. Friday and Saturday roll forward. */
  currentStartDate: string;
  /** Latest week Sunday the planner may open (inclusive). */
  maxStartDate: string;
  unlockAt: Date;
  source: 'client' | 'api';
};

type KsaClock = {
  ymd: string;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
};

export function addDaysIso(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function ksaClock(now: Date): KsaClock {
  const shifted = new Date(now.getTime() + KSA_OFFSET_MS);
  return {
    ymd: shifted.toISOString().slice(0, 10),
    weekday: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

/** Sunday of the Saudi work week that contains `now`, matching the backend Fri/Sat roll. */
export function currentSaudiWeekStart(now: Date): string {
  const clock = ksaClock(now);
  if (clock.weekday === 5) return addDaysIso(clock.ymd, 2);
  if (clock.weekday === 6) return addDaysIso(clock.ymd, 1);
  return addDaysIso(clock.ymd, -clock.weekday);
}

/**
 * Thursday whose 18:00 KSA opens the extra week.
 * Sun–Thu use this work week's Thursday. Fri/Sat use the Thursday that just passed,
 * so the horizon stays open after the week rolls forward.
 */
export function weekAheadUnlockThursday(now: Date): string {
  const clock = ksaClock(now);
  if (clock.weekday === 5) return addDaysIso(clock.ymd, -1);
  if (clock.weekday === 6) return addDaysIso(clock.ymd, -2);
  return addDaysIso(addDaysIso(clock.ymd, -clock.weekday), 4);
}

/** Thursday 18:00 Asia/Riyadh as an absolute instant (15:00 UTC). */
export function weekAheadUnlockInstant(thursdayYmd: string): Date {
  const [year, month, day] = thursdayYmd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 15, 0, 0));
}

export function clientWeekAheadAccess(now: Date): WeekAheadAccess {
  const thursday = weekAheadUnlockThursday(now);
  const unlockAt = weekAheadUnlockInstant(thursday);
  const locked = now.getTime() < unlockAt.getTime();
  const currentStartDate = currentSaudiWeekStart(now);
  const weeksAhead = locked ? 1 : 2;
  return {
    locked,
    weeksAhead,
    listCount: locked ? 2 : 3,
    currentStartDate,
    maxStartDate: addDaysIso(currentStartDate, weeksAhead * 7),
    unlockAt,
    source: 'client',
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asBool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function invertBool(value: boolean | null): boolean | null {
  return value === null ? null : !value;
}

function asIso(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/** Reads a locked / unlock-at gate from a weeks payload. Returns null when absent. */
export function parseWeekAheadSignal(payload: unknown): WeekAheadSignal | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nav = asRecord(root.nav);
  const nested =
    asRecord(root.week_ahead) ??
    asRecord(root.next_week_gate) ??
    asRecord(root.add_next_week) ??
    asRecord(root.next_week_lock);

  const locked =
    asBool(root.next_week_locked) ??
    asBool(root.add_week_locked) ??
    asBool(root.week_ahead_locked) ??
    invertBool(asBool(root.can_add_next_week)) ??
    invertBool(asBool(root.can_add_week)) ??
    asBool(nav?.next_week_locked) ??
    invertBool(asBool(nav?.can_add_next_week)) ??
    asBool(nested?.locked) ??
    invertBool(asBool(nested?.can_add)) ??
    invertBool(asBool(nested?.available)) ??
    null;

  const unlockAt =
    asIso(root.next_week_unlock_at) ??
    asIso(root.add_week_unlock_at) ??
    asIso(root.unlock_at) ??
    asIso(nav?.next_week_unlock_at) ??
    asIso(nav?.unlock_at) ??
    asIso(nested?.unlock_at) ??
    asIso(nested?.unlockAt) ??
    null;

  if (locked === null && unlockAt === null) return null;
  return { locked, unlockAt };
}

function accessFromLocked(
  client: WeekAheadAccess,
  locked: boolean,
  unlockAtIso: string | null
): WeekAheadAccess {
  const parsed = unlockAtIso ? new Date(unlockAtIso) : client.unlockAt;
  const unlockAt = Number.isNaN(parsed.getTime()) ? client.unlockAt : parsed;
  const weeksAhead = locked ? 1 : 2;
  return {
    locked,
    weeksAhead,
    listCount: locked ? 2 : 3,
    currentStartDate: client.currentStartDate,
    maxStartDate: addDaysIso(client.currentStartDate, weeksAhead * 7),
    unlockAt,
    source: 'api',
  };
}

/** API gate wins when present. Otherwise Thursday 18:00 Asia/Riyadh. */
export function resolveWeekAheadAccess(now: Date, signal: WeekAheadSignal | null): WeekAheadAccess {
  const client = clientWeekAheadAccess(now);
  if (!signal) return client;

  if (signal.locked !== null) {
    return accessFromLocked(client, signal.locked, signal.unlockAt);
  }

  if (signal.unlockAt) {
    const unlockMs = Date.parse(signal.unlockAt);
    if (!Number.isNaN(unlockMs)) {
      return accessFromLocked(client, now.getTime() < unlockMs, signal.unlockAt);
    }
  }

  return client;
}

export function isWeekBeyondHorizon(startDate: string, access: WeekAheadAccess): boolean {
  if (!startDate) return false;
  return startDate > access.maxStartDate;
}

export function weeksWithinHorizon<T extends { start_date: string }>(
  weeks: readonly T[],
  access: WeekAheadAccess
): T[] {
  return weeks
    .filter((week) => !isWeekBeyondHorizon(week.start_date, access))
    .slice()
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function formatWeekAheadUnlock(unlockAt: Date): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: RIYADH_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(unlockAt);
  return `${formatted} (KSA)`;
}

export function weekAheadLockMessage(access: WeekAheadAccess): string {
  return `The week after next is locked until ${formatWeekAheadUnlock(access.unlockAt)}.`;
}
