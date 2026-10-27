const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real YYYY-MM-DD calendar day. Month/day overflow is rejected. */
export function isOpsIsoDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Kitchen day in Asia/Riyadh, matching the Daily Ops API default. */
export function todayKsa(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

/**
 * Selected ops day from the URL.
 * `date` is the Daily Ops param. `delivery_date` is accepted when `date` is absent.
 * Anything that is not a calendar day falls back to today.
 */
export function opsDateFromSearchParams(
  params: { get(name: string): string | null },
  today: string
): string {
  const date = params.get('date');
  if (isOpsIsoDate(date)) return date;
  const deliveryDate = params.get('delivery_date');
  if (isOpsIsoDate(deliveryDate)) return deliveryDate;
  return today;
}

export function shiftOpsDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** Query string for GET /daily-ops and GET /daily-ops/issues. */
export function dailyOpsQueryParams(date: string): { date: string } {
  return { date };
}

/**
 * Keep the address bar on the selected day.
 * Today omits `date` so `/ops` stays the default day. `delivery_date` is cleared
 * so a later read does not fight the `date` param.
 */
export function withOpsDateParam(
  current: URLSearchParams,
  isoDate: string,
  today: string
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete('delivery_date');
  if (isoDate === today) next.delete('date');
  else next.set('date', isoDate);
  return next;
}
