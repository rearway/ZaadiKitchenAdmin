import { type ReactNode, useEffect, useState } from 'react';
import {
  useAutomations,
  useUpdateAutomation,
  useBroadcastSegments,
  useSendBroadcast,
  MAX_BROADCAST_MESSAGE_LENGTH,
  SCHEDULED_AUTOMATION_IDS,
  AUTOMATION_ACCENT_COLORS,
} from '@/features/comms';
import type { AutomationId, SegmentId } from '@/features/comms';
import { ApiError } from '@/shared/types/api';

export default function Comms() {
  const [activeTab, setActiveTab] = useState<'automations' | 'broadcast'>('automations');
  const [selectedSegmentId, setSelectedSegmentId] = useState<SegmentId | null>(null);
  const [message, setMessage] = useState(
    'Hope you enjoyed your Platio lunch! 🍛 Share your thoughts with us to get 10% off your next renewal.',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: automationsData, isLoading: automationsLoading, error: automationsError } =
    useAutomations();
  const updateAutomation = useUpdateAutomation();
  const { data: segmentsData, isLoading: segmentsLoading, error: segmentsError } =
    useBroadcastSegments();
  const sendBroadcast = useSendBroadcast();

  const segments = segmentsData?.segments ?? [];
  const selectedSegment =
    segments.find((s) => s.segment_id === selectedSegmentId) ?? segments[0] ?? null;

  useEffect(() => {
    if (segments.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(segments[0].segment_id);
    }
  }, [segments, selectedSegmentId]);

  const recipientCount = selectedSegment?.recipient_count ?? 0;
  const trimmedMessage = message.trim();
  const canSend =
    recipientCount > 0 &&
    trimmedMessage.length > 0 &&
    message.length <= MAX_BROADCAST_MESSAGE_LENGTH &&
    !sendBroadcast.isPending;

  const listError =
    automationsError instanceof ApiError
      ? automationsError.message
      : segmentsError instanceof ApiError
        ? segmentsError.message
        : null;

  const handleToggle = (id: AutomationId, isEnabled: boolean) => {
    setErrorMsg(null);
    updateAutomation.mutate(
      { id, isEnabled },
      {
        onError: (err) => {
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to update automation.');
        },
      },
    );
  };

  const handleSend = () => {
    if (!selectedSegment || !canSend) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    sendBroadcast.mutate(
      { segment_id: selectedSegment.segment_id, message: trimmedMessage },
      {
        onSuccess: (result) => {
          setSuccessMsg(
            `Push sent to ${result.recipient_count} subscriber${result.recipient_count !== 1 ? 's' : ''} in ${result.segment_label}.`,
          );
        },
        onError: (err) => {
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to send broadcast.');
        },
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Comms & Automations
        </h1>

        <div
          style={{
            display: 'flex',
            backgroundColor: '#1A1A1A',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <TabButton
            active={activeTab === 'automations'}
            onClick={() => setActiveTab('automations')}
          >
            ⚡ Automations
          </TabButton>
          <TabButton active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')}>
            📢 Broadcast
          </TabButton>
        </div>
      </div>

      {(errorMsg || listError) && (
        <div
          style={{
            backgroundColor: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠ {errorMsg ?? listError}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: 'rgba(0, 200, 150, 0.1)',
            border: '1px solid rgba(0, 200, 150, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#6EE7B7',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {activeTab === 'automations' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', margin: 0 }}>
            ACTIVE AUTOMATIONS
          </h3>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            All automations deliver push notifications only.
          </p>

          {automationsLoading ? (
            <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
              Loading automations…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(automationsData?.automations ?? []).map((auto) => {
                const accent = AUTOMATION_ACCENT_COLORS[auto.id];
                const isScheduledOnly = SCHEDULED_AUTOMATION_IDS.has(auto.id);
                const isToggling =
                  updateAutomation.isPending && updateAutomation.variables?.id === auto.id;

                return (
                  <div
                    key={auto.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#1A1A1A',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid #333',
                      opacity: isToggling ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: '#222',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          border: `1px solid ${auto.is_enabled ? accent : '#333'}`,
                        }}
                      >
                        {auto.icon}
                      </div>
                      <div>
                        <h4
                          style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            marginBottom: '6px',
                            color: auto.is_enabled ? '#FFF' : '#9CA3AF',
                          }}
                        >
                          {auto.name}
                        </h4>
                        <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
                          {auto.description}
                        </p>
                        {isScheduledOnly && (
                          <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0' }}>
                            Scheduled trigger coming soon — toggle is saved for when jobs go live.
                          </p>
                        )}
                      </div>
                    </div>

                    <ToggleSwitch
                      isOn={auto.is_enabled}
                      disabled={isToggling}
                      onToggle={() => handleToggle(auto.id, !auto.is_enabled)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
          <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', margin: 0 }}>
            SEND BROADCAST
          </h3>

          <div
            style={{
              backgroundColor: '#1A1A1A',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}
          >
            {segmentsLoading ? (
              <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
                Loading segments…
              </div>
            ) : (
              <>
                {/* Segment Selector */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#D1D5DB',
                      fontWeight: 600,
                      marginBottom: '12px',
                    }}
                  >
                    Audience Segment
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {segments.map((seg) => (
                      <button
                        key={seg.segment_id}
                        onClick={() => setSelectedSegmentId(seg.segment_id)}
                        style={{
                          backgroundColor:
                            selectedSegment?.segment_id === seg.segment_id
                              ? 'rgba(228,40,29,.10)'
                              : '#222',
                          color:
                            selectedSegment?.segment_id === seg.segment_id
                              ? 'var(--danger)'
                              : '#9CA3AF',
                          padding: '8px 20px',
                          borderRadius: '24px',
                          border: `1px solid ${
                            selectedSegment?.segment_id === seg.segment_id ? 'var(--danger)' : '#333'
                          }`,
                          fontSize: '14px',
                          fontWeight: selectedSegment?.segment_id === seg.segment_id ? 600 : 400,
                        }}
                      >
                        {seg.label}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: recipientCount > 0 ? 'var(--danger)' : '#444',
                      color: recipientCount > 0 ? '#000' : '#9CA3AF',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    👥 To: {recipientCount} subscribers
                  </div>
                  {recipientCount === 0 && selectedSegment && (
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#F87171' }}>
                      No recipients in this segment — choose another audience or try again later.
                    </p>
                  )}
                </div>

                {/* Message Area */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <label style={{ fontSize: '14px', color: '#D1D5DB', fontWeight: 600 }}>
                      Push Notification Message
                    </label>
                    <span
                      style={{
                        fontSize: '13px',
                        color:
                          message.length > MAX_BROADCAST_MESSAGE_LENGTH ? 'var(--danger)' : '#9CA3AF',
                      }}
                    >
                      {message.length} / {MAX_BROADCAST_MESSAGE_LENGTH} characters
                    </span>
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MAX_BROADCAST_MESSAGE_LENGTH}
                    style={{
                      width: '100%',
                      height: '160px',
                      backgroundColor: '#222',
                      border: '1px solid #333',
                      borderRadius: '12px',
                      padding: '16px',
                      color: '#FFF',
                      fontSize: '15px',
                      lineHeight: '1.5',
                      fontFamily: 'Montserrat, sans-serif',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* CTA */}
                <div>
                  <button
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      opacity: canSend ? 1 : 0.5,
                    }}
                    disabled={!canSend}
                    onClick={handleSend}
                  >
                    {sendBroadcast.isPending
                      ? 'Sending…'
                      : `📢 Send to ${recipientCount} subscribers`}
                  </button>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#9CA3AF',
                      fontSize: '13px',
                      marginTop: '12px',
                    }}
                  >
                    Delivered as push notification · title on device: &quot;Zaadi Kitchen&quot;
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '14px',
        backgroundColor: active ? '#333' : 'transparent',
        color: active ? '#FFF' : '#9CA3AF',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  isOn,
  onToggle,
  disabled,
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '13px',
        backgroundColor: isOn ? 'var(--danger)' : '#374151',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          backgroundColor: '#FFF',
          position: 'absolute',
          top: '2px',
          left: isOn ? '20px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}
