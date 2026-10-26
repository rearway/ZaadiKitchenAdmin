import { z } from 'zod';

export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled' | 'churned';

const CustomerSourceSchema = z
  .object({
    id: z.string(),
  })
  .passthrough();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const amount = Number(trimmed);
    return Number.isFinite(amount) ? amount : null;
  }
  return null;
}

function firstNumber(values: unknown[]): number | null {
  for (const value of values) {
    const amount = finiteNumber(value);
    if (amount != null) return amount;
  }
  return null;
}

/** `YYYY-MM-DD` from a date-only string or an ISO timestamp. */
export function subscriptionDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return match?.[1] ?? null;
}

export function todayKsa(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Mobile treats `active` as the in-service plan (`GET /subscriptions/me` and home).
 * An explicit active/paused flag wins over a second stale status. Expired is not
 * inferred from the end date while the stored status is still active.
 */
export function resolveSubscriptionStatus(
  candidates: Array<string | null | undefined>,
  endDate: string | null,
  today: string = todayKsa()
): SubscriptionStatus {
  const normalized = candidates
    .map((value) => value?.trim().toLowerCase() ?? '')
    .filter((value) => value.length > 0 && value !== 'none');

  if (normalized.includes('active')) return 'active';
  if (normalized.includes('paused')) return 'paused';

  const end = subscriptionDateKey(endDate);
  const inService = end != null && end >= today;

  if (normalized.includes('cancelled')) return 'cancelled';
  if (inService && (normalized.length === 0 || normalized.includes('expired'))) return 'active';
  if (normalized.includes('churned')) return 'churned';
  if (normalized.includes('expired')) return 'expired';
  if (end != null && end < today) return 'expired';
  return 'active';
}

function readAddress(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!isRecord(value)) return '';
  const building = text(value.buildingName ?? value.building_name ?? value.building) ?? '';
  const floorRaw = text(value.floor);
  const floor = floorRaw
    ? floorRaw.toLowerCase().startsWith('floor')
      ? floorRaw
      : `Floor ${floorRaw}`
    : '';
  const area = text(value.areaName ?? value.area_name ?? value.area) ?? '';
  return [building, floor, area].filter((part) => part.length > 0).join(', ');
}

type NormalizedCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
  plan: string;
  endDate: string | null;
  planEndDate: string | null;
  daysLeft: number | null;
  mealsLeft: number | null;
  walletBalance: number | null;
  primaryAddress: string;
  openIssueCount: number;
};

function normalizeCustomer(input: { id: string } & Record<string, unknown>): NormalizedCustomer {
  const subscription = isRecord(input.subscription) ? input.subscription : null;
  const wallet = isRecord(input.wallet)
    ? input.wallet
    : subscription && isRecord(subscription.wallet)
      ? subscription.wallet
      : null;

  const endDate =
    text(subscription?.endDate) ??
    text(subscription?.end_date) ??
    text(input.planEndDate) ??
    text(input.plan_end_date) ??
    text(input.endDate) ??
    text(input.end_date);

  const totalMealDays = firstNumber([
    subscription?.totalMealDays,
    subscription?.total_meal_days,
    input.totalMealDays,
    input.total_meal_days,
  ]);
  const deliveredCount = firstNumber([
    subscription?.deliveredCount,
    subscription?.delivered_count,
    input.deliveredCount,
    input.delivered_count,
  ]);
  const skippedCount = firstNumber([
    subscription?.skippedCount,
    subscription?.skipped_count,
    input.skippedCount,
    input.skipped_count,
  ]);
  const fromMealCounts =
    totalMealDays == null
      ? null
      : Math.max(0, totalMealDays - (deliveredCount ?? 0) - (skippedCount ?? 0));

  // `subscription.daysRemaining` on current admin detail is calendar days until endDate.
  // Mobile days left is totalMealDays - delivered - skipped (`days_remaining`).
  const daysLeft =
    fromMealCounts ??
    firstNumber([
      subscription?.days_remaining,
      input.days_remaining,
      subscription?.daysLeft,
      input.daysLeft,
      subscription?.days_left,
      input.days_left,
    ]);
  const mealsLeft =
    firstNumber([
      subscription?.mealsLeft,
      input.mealsLeft,
      subscription?.meals_left,
      input.meals_left,
      subscription?.remainingCount,
      input.remainingCount,
      subscription?.remaining_count,
      input.remaining_count,
      subscription?.mealsRemaining,
      input.mealsRemaining,
      subscription?.meals_remaining,
      input.meals_remaining,
    ]) ?? fromMealCounts;

  const walletBalance = firstNumber([
    input.walletBalanceSar,
    input.wallet_balance_sar,
    wallet?.balance_sar,
    wallet?.balanceSar,
    wallet?.walletBalanceSar,
    subscription?.walletBalanceSar,
    subscription?.wallet_balance_sar,
    input.walletBalance,
    input.wallet_balance,
  ]);

  return {
    id: input.id,
    name: text(input.name) ?? text(input.fullName) ?? text(input.full_name) ?? '',
    phone: text(input.phone) ?? '',
    email: text(input.email) ?? '',
    subscriptionStatus: resolveSubscriptionStatus(
      [
        text(subscription?.status),
        text(input.subscriptionStatus),
        text(input.subscription_status),
        text(input.status),
      ],
      endDate
    ),
    plan:
      text(subscription?.planName) ??
      text(subscription?.plan_name) ??
      text(subscription?.plan) ??
      text(input.plan) ??
      text(input.planName) ??
      text(input.plan_name) ??
      '',
    endDate,
    planEndDate: endDate,
    daysLeft,
    mealsLeft,
    walletBalance,
    primaryAddress:
      readAddress(input.primaryAddress) ||
      readAddress(input.primary_address) ||
      readAddress(input.address),
    openIssueCount:
      firstNumber([input.openIssueCount, input.open_issue_count, subscription?.openIssueCount]) ??
      0,
  };
}

export const CustomerSchema = CustomerSourceSchema.transform((row) => {
  const customer = normalizeCustomer(row);
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    subscriptionStatus: customer.subscriptionStatus,
    plan: customer.plan,
    endDate: customer.endDate,
    daysLeft: customer.daysLeft,
    mealsLeft: customer.mealsLeft,
    walletBalance: customer.walletBalance,
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

export const CustomerDetailSchema = CustomerSourceSchema.transform((row) => {
  const customer = normalizeCustomer(row);
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    subscriptionStatus: customer.subscriptionStatus,
    plan: customer.plan,
    planEndDate: customer.planEndDate,
    walletBalance: customer.walletBalance,
    primaryAddress: customer.primaryAddress,
    openIssueCount: customer.openIssueCount,
    daysLeft: customer.daysLeft,
    mealsLeft: customer.mealsLeft,
  };
});
export type CustomerDetail = z.infer<typeof CustomerDetailSchema>;

export function formatDaysLeft(days: number | null): string {
  if (days == null) return '— days left';
  return `${days} day${days === 1 ? '' : 's'} left`;
}

export function formatMealsLeft(meals: number | null): string {
  if (meals == null) return '— meals left';
  return `${meals} meal${meals === 1 ? '' : 's'} left`;
}

/** Live ledger balance, same SAR display as the customer wallet card. */
export function formatWalletSar(amount: number | null): string {
  if (amount == null) return '—';
  return `SAR ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
