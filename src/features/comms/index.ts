export {
  useAutomations,
  useUpdateAutomation,
  useBroadcastSegments,
  useSendBroadcast,
} from './api/comms.queries';
export type {
  Automation,
  AutomationId,
  BroadcastSegment,
  BroadcastResult,
  SegmentId,
  SendBroadcastInput,
} from './model/comms.schema';
export {
  MAX_BROADCAST_MESSAGE_LENGTH,
  SCHEDULED_AUTOMATION_IDS,
  AUTOMATION_ACCENT_COLORS,
} from './model/comms.schema';
