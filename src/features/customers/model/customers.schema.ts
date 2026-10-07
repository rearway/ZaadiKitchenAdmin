import { z } from 'zod';

export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'churned';

export const CustomerSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    subscriptionStatus: z.string().optional().nullable(),
    subscription_status: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    plan: z.string().optional().nullable(),
    planName: z.string().optional().nullable(),
    plan_name: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    daysLeft: z.number().optional().nullable(),
    days_left: z.number().optional().nullable(),
    walletBalance: z.number().optional().nullable(),
    wallet_balance: z.number().optional().nullable(),
    createdAt: z.string().optional(),
  })
  .transform((c) => {
    const rawStatus = c.subscriptionStatus ?? c.subscription_status ?? c.status ?? 'active';
    const endDate = c.endDate ?? c.end_date ?? null;
    const daysLeft = c.daysLeft ?? c.days_left ?? (() => {
      if (!endDate) return 0;
      return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000));
    })();
    return {
      id: c.id,
      name: c.name ?? c.fullName ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      subscriptionStatus: ((rawStatus ?? 'active').toLowerCase()) as SubscriptionStatus,
      plan: c.plan ?? c.planName ?? c.plan_name ?? '',
      endDate,
      daysLeft,
      walletBalance: c.walletBalance ?? c.wallet_balance ?? 0,
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
    subscriptionStatus: z.string().optional().nullable(),
    subscription_status: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    plan: z.string().optional().nullable(),
    planName: z.string().optional().nullable(),
    plan_name: z.string().optional().nullable(),
    planEndDate: z.string().optional().nullable(),
    plan_end_date: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    walletBalance: z.number().optional().nullable(),
    wallet_balance: z.number().optional().nullable(),
    primaryAddress: z.string().optional().nullable(),
    primary_address: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    openIssueCount: z.number().optional().nullable(),
    open_issue_count: z.number().optional().nullable(),
    daysLeft: z.number().optional().nullable(),
    days_left: z.number().optional().nullable(),
  })
  .transform((c) => {
    const rawStatus = c.subscriptionStatus ?? c.subscription_status ?? c.status ?? 'active';
    return {
      id: c.id,
      name: c.name ?? c.fullName ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      subscriptionStatus: ((rawStatus ?? 'active').toLowerCase()) as SubscriptionStatus,
      plan: c.plan ?? c.planName ?? c.plan_name ?? '',
      planEndDate: c.planEndDate ?? c.plan_end_date ?? c.endDate ?? c.end_date ?? null,
      walletBalance: c.walletBalance ?? c.wallet_balance ?? 0,
      primaryAddress: c.primaryAddress ?? c.primary_address ?? c.address ?? '',
      openIssueCount: c.openIssueCount ?? c.open_issue_count ?? 0,
      daysLeft: c.daysLeft ?? c.days_left ?? 0,
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

export const IssueRecordSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    resolvedAt: z.string().optional().nullable(),
    resolved_at: z.string().optional().nullable(),
  })
  .transform((i) => ({
    id: i.id ?? '',
    type: i.type ?? '',
    description: i.description ?? '',
    status: i.status ?? '',
    createdAt: i.createdAt ?? i.created_at ?? '',
    resolvedAt: i.resolvedAt ?? i.resolved_at ?? null,
  }));
export type IssueRecord = z.infer<typeof IssueRecordSchema>;

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
  amountSar: z
    .number()
    .positive('Amount must be positive')
    .max(30, 'Maximum credit is SAR 30'),
  note: z.string().min(1, 'Note is required'),
});
export type CreditWalletInput = z.infer<typeof CreditWalletInputSchema>;

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  expired: 'Expired',
  churned: 'Churned',
};

export const SUBSCRIPTION_STATUS_COLOR: Record<
  SubscriptionStatus,
  { bg: string; color: string }
> = {
  active: { bg: 'rgba(228,40,29,0.10)', color: 'var(--danger)' },
  paused: { bg: 'rgba(139,92,246,0.1)', color: 'var(--ops)' },
  expired: { bg: 'rgba(255,115,64,0.1)', color: 'var(--danger)' },
  churned: { bg: 'rgba(107,114,128,0.1)', color: '#9CA3AF' },
};

export const SUBSCRIPTION_STATUS_AVATAR: Record<SubscriptionStatus, string> = {
  active: 'var(--ops)',
  paused: 'var(--danger)',
  expired: '#F59E0B',
  churned: '#6B7280',
};
