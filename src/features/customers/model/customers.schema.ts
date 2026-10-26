import { z } from 'zod';

export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled' | 'churned';

/** Users list filters. Churned is not a list filter. */
export const CUSTOMER_LIST_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'expired', label: 'Expired' },
] as const;

const KNOWN_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  'active',
  'paused',
  'expired',
  'cancelled',
  'churned',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const amount = Number(value.trim());
    return Number.isFinite(amount) ? amount : null;
  }
  return null;
}

function firstNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    if (!(key in source)) continue;
    const amount = coerceNumber(source[key]);
    if (amount != null) return amount;
  }
  return null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Live wallet is the ledger sum mobile returns as `balance_sar`
 * (`walletBalanceSar` on admin customer detail). A missing field stays null
 * so the screen does not paint a fake SAR 0.00.
 */
export function readWalletBalance(source: unknown): number | null {
  const row = asRecord(source);
  if (!row) return null;
  const direct = firstNumber(row, [
    'walletBalanceSar',
    'wallet_balance_sar',
    'walletBalance',
    'wallet_balance',
  ]);
  if (direct != null) return direct;
  const wallet = asRecord(row.wallet);
  if (!wallet) return null;
  return firstNumber(wallet, ['balance_sar', 'balanceSar', 'balance']);
}

/**
 * Status is the subscription's stored status. A past `endDate` must not turn
 * `active` into Expired — mobile keeps `active` until the row's status changes.
 * Calendar `daysRemaining` is not a status.
 */
export function resolveSubscriptionStatus(source: unknown): SubscriptionStatus {
  const row = asRecord(source);
  if (!row) return 'active';
  const subscription = asRecord(row.subscription);
  const raw =
    subscription?.status ?? row.subscriptionStatus ?? row.subscription_status ?? row.status;
  const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (KNOWN_SUBSCRIPTION_STATUSES.has(normalized as SubscriptionStatus)) {
    return normalized as SubscriptionStatus;
  }
  return 'active';
}

/**
 * Mobile days left and meals left are both
 * `max(0, totalMealDays - deliveredCount - skippedCount)`.
 * Admin `subscription.daysRemaining` is calendar days until `endDate` and is ignored.
 */
export function resolveMealAllowance(source: unknown): {
  daysLeft: number | null;
  mealsLeft: number | null;
} {
  const row = asRecord(source) ?? {};
  const subscription = asRecord(row.subscription) ?? {};
  const total =
    firstNumber(row, ['totalMealDays', 'total_meal_days']) ??
    firstNumber(subscription, ['totalMealDays', 'total_meal_days']);
  const delivered =
    firstNumber(row, ['deliveredCount', 'delivered_count']) ??
    firstNumber(subscription, ['deliveredCount', 'delivered_count']);
  const skipped =
    firstNumber(row, ['skippedCount', 'skipped_count']) ??
    firstNumber(subscription, ['skippedCount', 'skipped_count']);
  const computed =
    total != null && delivered != null && skipped != null
      ? Math.max(0, total - delivered - skipped)
      : null;
  const explicitDays =
    firstNumber(row, ['days_remaining', 'daysLeft', 'days_left']) ??
    firstNumber(subscription, ['days_remaining', 'daysLeft', 'days_left']);
  const explicitMeals =
    firstNumber(row, ['mealsLeft', 'meals_left', 'remaining_count', 'remainingCount']) ??
    firstNumber(subscription, ['mealsLeft', 'meals_left', 'remaining_count', 'remainingCount']);
  const daysLeft = explicitDays ?? computed;
  return { daysLeft, mealsLeft: explicitMeals ?? daysLeft };
}

export function formatWalletSar(amount: number | null): string {
  if (amount == null) return '—';
  return `SAR ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDaysLeft(value: number | null): string {
  if (value == null) return '— days left';
  return `${value} ${value === 1 ? 'day' : 'days'} left`;
}

export function formatMealsLeft(value: number | null): string {
  if (value == null) return '— meals left';
  return `${value} ${value === 1 ? 'meal' : 'meals'} left`;
}

function formatPrimaryAddress(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  const row = asRecord(value);
  if (!row) return '';
  const building = text(row.buildingName ?? row.building_name);
  const floor = text(row.floor);
  const area = text(row.areaName ?? row.area_name);
  const line = text(row.line ?? row.address);
  if (line && !building && !area) return line;
  return [building, floor ? `Floor ${floor}` : '', area].filter(Boolean).join(', ');
}

function readPlan(source: Record<string, unknown>): string {
  const subscription = asRecord(source.subscription);
  return (
    text(source.plan) ||
    text(source.planName) ||
    text(source.plan_name) ||
    text(subscription?.planName) ||
    text(subscription?.plan_name) ||
    text(subscription?.plan)
  );
}

function readEndDate(source: Record<string, unknown>): string | null {
  const subscription = asRecord(source.subscription);
  const value =
    text(source.endDate) ||
    text(source.end_date) ||
    text(source.planEndDate) ||
    text(source.plan_end_date) ||
    text(subscription?.endDate) ||
    text(subscription?.end_date);
  return value || null;
}

export const CustomerSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    createdAt: z.string().optional(),
  })
  .passthrough()
  .transform((c) => {
    const allowance = resolveMealAllowance(c);
    return {
      id: c.id,
      name: text(c.name) || text(c.fullName),
      phone: text(c.phone),
      email: text(c.email),
      subscriptionStatus: resolveSubscriptionStatus(c),
      plan: readPlan(c),
      endDate: readEndDate(c),
      daysLeft: allowance.daysLeft,
      mealsLeft: allowance.mealsLeft,
      walletBalance: readWalletBalance(c),
    };
  });
export type Customer = z.infer<typeof CustomerSchema>;

const PaginationSchema = z
  .object({
    page: z.number().optional(),
    perPage: z.number().optional(),
    per_page: z.number().optional(),
    total: z.number().optional(),
    totalPages: z.number().optional(),
    total_pages: z.number().optional(),
  })
  .optional();

export const CustomerListResponseSchema = z
  .object({
    customers: z.array(CustomerSchema).optional(),
    items: z.array(CustomerSchema).optional(),
    total: z.number().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    page_size: z.number().optional(),
    totalPages: z.number().optional(),
    total_pages: z.number().optional(),
    pagination: PaginationSchema,
  })
  .transform((r) => ({
    customers: r.customers ?? r.items ?? [],
    total: r.total ?? r.pagination?.total ?? 0,
    page: r.page ?? r.pagination?.page ?? 1,
    pageSize: r.pageSize ?? r.page_size ?? r.pagination?.perPage ?? r.pagination?.per_page ?? 20,
    totalPages:
      r.totalPages ?? r.total_pages ?? r.pagination?.totalPages ?? r.pagination?.total_pages ?? 1,
  }));
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;

export const CustomerDetailSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    openIssueCount: z.number().optional().nullable(),
    open_issue_count: z.number().optional().nullable(),
  })
  .passthrough()
  .transform((c) => {
    const allowance = resolveMealAllowance(c);
    const address = formatPrimaryAddress(c.primaryAddress ?? c.primary_address ?? c.address);
    return {
      id: c.id,
      name: text(c.name) || text(c.fullName),
      phone: text(c.phone),
      email: text(c.email),
      subscriptionStatus: resolveSubscriptionStatus(c),
      plan: readPlan(c),
      planEndDate: readEndDate(c),
      walletBalance: readWalletBalance(c),
      primaryAddress: address,
      openIssueCount: c.openIssueCount ?? c.open_issue_count ?? 0,
      daysLeft: allowance.daysLeft,
      mealsLeft: allowance.mealsLeft,
    };
  });
export type CustomerDetail = z.infer<typeof CustomerDetailSchema>;

export const SubscriptionHistorySchema = z
  .object({
    id: z.string().optional(),
    plan: z.string().optional(),
    startDate: z.string().optional(),
    start_date: z.string().optional(),
    endDate: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional(),
  })
  .transform((s) => ({
    id: s.id ?? '',
    plan: s.plan ?? '',
    startDate: s.startDate ?? s.start_date ?? '',
    endDate: s.endDate ?? s.end_date ?? '',
    status: s.status ?? '',
  }));
export type SubscriptionHistory = z.infer<typeof SubscriptionHistorySchema>;

export const DeliveryRecordSchema = z
  .object({
    id: z.string().optional(),
    date: z.string().optional(),
    deliveryDate: z.string().optional(),
    delivery_date: z.string().optional(),
    status: z.string().optional(),
    mealType: z.string().optional(),
    meal_type: z.string().optional(),
  })
  .transform((d) => ({
    id: d.id ?? '',
    date: d.date ?? d.deliveryDate ?? d.delivery_date ?? '',
    status: d.status ?? '',
    mealType: d.mealType ?? d.meal_type ?? '',
  }));
export type DeliveryRecord = z.infer<typeof DeliveryRecordSchema>;

const OptionalTextSchema = z.string().nullable().optional();

/** Live history sends SAR as a number; accept a numeric string without failing the row. */
const OptionalSarSchema = z
  .union([
    z.number(),
    z.null(),
    z.string().transform((value) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const amount = Number(trimmed);
      return Number.isFinite(amount) ? amount : null;
    }),
  ])
  .optional();

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

export const IssueRecordSchema = z
  .object({
    id: z.string().nullable().optional(),
    issueType: OptionalTextSchema,
    issue_type: OptionalTextSchema,
    type: OptionalTextSchema,
    deliveryDate: OptionalTextSchema,
    delivery_date: OptionalTextSchema,
    creditedAmountSar: OptionalSarSchema,
    credited_amount_sar: OptionalSarSchema,
    rejectionReason: OptionalTextSchema,
    rejection_reason: OptionalTextSchema,
    rejectionNotes: OptionalTextSchema,
    rejection_notes: OptionalTextSchema,
    description: OptionalTextSchema,
    status: OptionalTextSchema,
    createdAt: OptionalTextSchema,
    created_at: OptionalTextSchema,
    resolvedAt: OptionalTextSchema,
    resolved_at: OptionalTextSchema,
  })
  .transform((issue) => ({
    id: issue.id ?? '',
    issueType: (issue.issueType ?? issue.issue_type ?? issue.type ?? '').trim(),
    deliveryDate: (issue.deliveryDate ?? issue.delivery_date ?? '').trim(),
    creditedAmountSar: issue.creditedAmountSar ?? issue.credited_amount_sar ?? null,
    rejectionReason: emptyToNull(issue.rejectionReason ?? issue.rejection_reason),
    rejectionNotes: emptyToNull(issue.rejectionNotes ?? issue.rejection_notes),
    description: (issue.description ?? '').trim(),
    status: (issue.status ?? '').trim(),
    createdAt: (issue.createdAt ?? issue.created_at ?? '').trim(),
    resolvedAt: emptyToNull(issue.resolvedAt ?? issue.resolved_at),
  }));
export type IssueRecord = z.infer<typeof IssueRecordSchema>;

const ISSUE_HISTORY_TYPE_LABEL: Record<string, string> = {
  wrong_order: 'Wrong order',
  quality_issue: 'Quality issue',
  not_delivered: 'Not delivered',
  damaged: 'Damaged',
};

const ISSUE_HISTORY_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  credited: 'Credited',
  rejected: 'Rejected',
};

const RESOLVED_ISSUE_STATUSES = new Set(['credited', 'rejected']);

const historyDeliveryDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const historyCreatedAtFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Riyadh',
});

function humanizeToken(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function issueHistoryTypeLabel(issueType: string): string {
  const key = issueType.trim().toLowerCase();
  if (!key) return 'Issue';
  return ISSUE_HISTORY_TYPE_LABEL[key] ?? humanizeToken(key);
}

export function issueHistoryStatusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  if (!key) return '';
  return ISSUE_HISTORY_STATUS_LABEL[key] ?? humanizeToken(key);
}

/** Open rows must not be labeled as resolved. */
export function issueHistorySectionTitle(issues: IssueRecord[]): string {
  const allResolved =
    issues.length > 0 &&
    issues.every((issue) => RESOLVED_ISSUE_STATUSES.has(issue.status.trim().toLowerCase()));
  return allResolved ? 'Resolved Issues' : 'Issues';
}

export function formatHistorySar(amount: number): string {
  return `SAR ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Credit amount when one was applied; otherwise the rejection reason or notes. */
export function issueHistoryOutcome(issue: IssueRecord): string | null {
  if (issue.creditedAmountSar != null) return formatHistorySar(issue.creditedAmountSar);
  return issue.rejectionReason ?? issue.rejectionNotes;
}

/** Calendar date from `YYYY-MM-DD`. Empty stays empty so the row can omit it. */
export function formatHistoryDeliveryDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) return trimmed;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return trimmed;
  return historyDeliveryDateFormat.format(date);
}

/** Timestamp in Asia/Riyadh. Empty stays empty so the row can omit it. */
export function formatHistoryCreatedAt(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return historyCreatedAtFormat.format(date).replace(/\u202f/g, ' ');
}

export const CustomerHistorySchema = z
  .object({
    subscriptions: z.array(SubscriptionHistorySchema).optional(),
    deliveries: z.array(DeliveryRecordSchema).optional(),
    delivery_records: z.array(DeliveryRecordSchema).optional(),
    issues: z.array(IssueRecordSchema).optional(),
  })
  .transform((h) => ({
    subscriptions: h.subscriptions ?? [],
    deliveries: h.deliveries ?? h.delivery_records ?? [],
    issues: h.issues ?? [],
  }));
export type CustomerHistory = z.infer<typeof CustomerHistorySchema>;

export const CreditWalletInputSchema = z.object({
  amountSar: z.number().positive('Amount must be positive').max(30, 'Maximum credit is SAR 30'),
  note: z.string().min(1, 'Note is required'),
});
export type CreditWalletInput = z.infer<typeof CreditWalletInputSchema>;

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  expired: 'Expired',
  cancelled: 'Cancelled',
  churned: 'Churned',
};

export const SUBSCRIPTION_STATUS_COLOR: Record<SubscriptionStatus, { bg: string; color: string }> =
  {
    active: { bg: 'rgba(228,40,29,0.10)', color: 'var(--danger)' },
    paused: { bg: 'rgba(139,92,246,0.1)', color: 'var(--ops)' },
    expired: { bg: 'rgba(255,115,64,0.1)', color: 'var(--danger)' },
    cancelled: { bg: 'rgba(107,114,128,0.1)', color: '#9CA3AF' },
    churned: { bg: 'rgba(107,114,128,0.1)', color: '#9CA3AF' },
  };

export const SUBSCRIPTION_STATUS_AVATAR: Record<SubscriptionStatus, string> = {
  active: 'var(--ops)',
  paused: 'var(--danger)',
  expired: '#F59E0B',
  cancelled: '#6B7280',
  churned: '#6B7280',
};
