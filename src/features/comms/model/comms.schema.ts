import { z } from 'zod';

export const AutomationIdSchema = z.enum([
  'delivery_confirmed',
  'eod_feedback',
  'renewal_reminder',
  'referral_reward',
  'lapsed_reactivation',
]);
export type AutomationId = z.infer<typeof AutomationIdSchema>;

export const SegmentIdSchema = z.enum([
  'all_subscribers',
  'active',
  'paused',
  'delivering_today',
]);
export type SegmentId = z.infer<typeof SegmentIdSchema>;

export const AutomationSchema = z
  .object({
    id: AutomationIdSchema,
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    is_enabled: z.boolean().optional(),
    isEnabled: z.boolean().optional(),
    channel: z.literal('push'),
    updated_at: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_by_user_id: z.string().optional(),
    updatedByUserId: z.string().optional(),
  })
  .transform((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    is_enabled: a.is_enabled ?? a.isEnabled ?? false,
    channel: a.channel,
    updated_at: a.updated_at ?? a.updatedAt ?? null,
    updated_by_user_id: a.updated_by_user_id ?? a.updatedByUserId ?? null,
  }));
export type Automation = z.infer<typeof AutomationSchema>;

export const AutomationsListSchema = z
  .object({
    automations: z.array(AutomationSchema),
    as_of: z.string().optional(),
    asOf: z.string().optional(),
  })
  .transform((r) => ({
    automations: r.automations,
    as_of: r.as_of ?? r.asOf ?? null,
  }));

export const BroadcastSegmentSchema = z
  .object({
    segment_id: SegmentIdSchema.optional(),
    segmentId: SegmentIdSchema.optional(),
    label: z.string(),
    recipient_count: z.number().optional(),
    recipientCount: z.number().optional(),
  })
  .transform((s) => ({
    segment_id: s.segment_id ?? s.segmentId ?? 'all_subscribers',
    label: s.label,
    recipient_count: s.recipient_count ?? s.recipientCount ?? 0,
  }));
export type BroadcastSegment = z.infer<typeof BroadcastSegmentSchema>;

export const BroadcastSegmentsListSchema = z
  .object({
    segments: z.array(BroadcastSegmentSchema),
    as_of: z.string().optional(),
    asOf: z.string().optional(),
  })
  .transform((r) => ({
    segments: r.segments,
    as_of: r.as_of ?? r.asOf ?? null,
  }));

export const BroadcastResultSchema = z
  .object({
    broadcast_id: z.string().optional(),
    broadcastId: z.string().optional(),
    segment_id: SegmentIdSchema.optional(),
    segmentId: SegmentIdSchema.optional(),
    segment_label: z.string().optional(),
    segmentLabel: z.string().optional(),
    recipient_count: z.number().optional(),
    recipientCount: z.number().optional(),
    status: z.string(),
    sent_at: z.string().optional(),
    sentAt: z.string().optional(),
  })
  .transform((r) => ({
    broadcast_id: r.broadcast_id ?? r.broadcastId ?? '',
    segment_id: r.segment_id ?? r.segmentId ?? 'all_subscribers',
    segment_label: r.segment_label ?? r.segmentLabel ?? '',
    recipient_count: r.recipient_count ?? r.recipientCount ?? 0,
    status: r.status,
    sent_at: r.sent_at ?? r.sentAt ?? null,
  }));
export type BroadcastResult = z.infer<typeof BroadcastResultSchema>;

export const SendBroadcastInputSchema = z.object({
  segment_id: SegmentIdSchema,
  message: z.string().min(1).max(200),
});
export type SendBroadcastInput = z.infer<typeof SendBroadcastInputSchema>;

export const MAX_BROADCAST_MESSAGE_LENGTH = 200;

/** Automations not yet backed by scheduled jobs — toggles persist only. */
export const SCHEDULED_AUTOMATION_IDS: ReadonlySet<AutomationId> = new Set([
  'eod_feedback',
  'renewal_reminder',
  'lapsed_reactivation',
]);

export const AUTOMATION_ACCENT_COLORS: Record<AutomationId, string> = {
  delivery_confirmed: 'var(--danger)',
  eod_feedback: 'var(--danger)',
  renewal_reminder: 'var(--ops)',
  referral_reward: 'var(--danger)',
  lapsed_reactivation: '#9CA3AF',
};
