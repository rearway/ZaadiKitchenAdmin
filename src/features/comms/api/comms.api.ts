import { z } from 'zod';
import { client } from '@/shared/lib/api/client';
import { unwrap } from '@/shared/types/api';
import {
  AutomationsListSchema,
  AutomationSchema,
  BroadcastSegmentsListSchema,
  BroadcastResultSchema,
  SegmentIdSchema,
  type AutomationId,
  type SegmentId,
  type SendBroadcastInput,
} from '../model/comms.schema';

export async function getAutomationsApi() {
  const res = await client.get('/admin/comms/automations');
  return unwrap(res.data, AutomationsListSchema);
}

export async function updateAutomationApi(automationId: AutomationId, isEnabled: boolean) {
  const res = await client.patch(`/admin/comms/automations/${automationId}`, {
    is_enabled: isEnabled,
  });
  return unwrap(res.data, AutomationSchema);
}

export async function getBroadcastSegmentsApi() {
  const res = await client.get('/admin/comms/broadcast/segments');
  return unwrap(res.data, BroadcastSegmentsListSchema);
}

export async function getBroadcastSegmentCountApi(segmentId: SegmentId) {
  const res = await client.get(`/admin/comms/broadcast/segments/${segmentId}/count`);
  return unwrap(
    res.data,
    z
      .object({
        segment_id: SegmentIdSchema.optional(),
        segmentId: SegmentIdSchema.optional(),
        recipient_count: z.number().optional(),
        recipientCount: z.number().optional(),
      })
      .transform((r) => ({
        segment_id: r.segment_id ?? r.segmentId ?? segmentId,
        recipient_count: r.recipient_count ?? r.recipientCount ?? 0,
      })),
  );
}

export async function sendBroadcastApi(input: SendBroadcastInput) {
  const res = await client.post('/admin/comms/broadcast', {
    segment_id: input.segment_id,
    message: input.message,
  });
  return unwrap(res.data, BroadcastResultSchema);
}
