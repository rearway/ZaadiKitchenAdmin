import { useState } from 'react';

const AUTOMATIONS = [
  {
    id: '1',
    icon: '✅',
    color: 'var(--err)',
    name: 'Delivery Confirmed',
    desc: 'Mark as Delivered tap → WhatsApp to customer',
    defaultOn: true,
  },
  {
    id: '2',
    icon: '⭐',
    color: 'var(--err)',
    name: 'End-of-Day Feedback',
    desc: '3:00 PM daily → all meal recipients',
    defaultOn: true,
  },
  {
    id: '3',
    icon: '🔄',
    color: 'var(--ops)',
    name: 'Renewal Reminder',
    desc: '48 hrs before plan end date',
    defaultOn: true,
  },
  {
    id: '4',
    icon: '🎁',
    color: 'var(--err)',
    name: 'Referral Reward',
    desc: "Referred friend's plan activates",
    defaultOn: true,
  },
  {
    id: '5',
    icon: '😴',
    color: '#9CA3AF',
    name: 'Lapsed Reactivation',
    desc: 'Plan expired + no renewal after 3 days',
    defaultOn: false,
  },
];

export default function Comms() {
  const [activeTab, setActiveTab] = useState<'automations' | 'broadcast'>('automations');
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    AUTOMATIONS.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.defaultOn }), {})
  );

  const [segment, setSegment] = useState('All active');
  const [message, setMessage] = useState(
    'Hope you enjoyed your Zaadi lunch! 🍛 Share your thoughts with us to get 10% off your next renewal.'
  );

  const getRecipientCount = () => {
    switch (segment) {
      case 'All active':
        return 248;
      case 'Month plan':
        return 129;
      case 'Lapsed':
        return 42;
      case 'Custom':
        return 0;
      default:
        return 248;
    }
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

      {activeTab === 'automations' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', margin: 0 }}>
            ACTIVE AUTOMATIONS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {AUTOMATIONS.map((auto) => (
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
                      border: `1px solid ${toggles[auto.id] ? auto.color : '#333'}`,
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
                        color: toggles[auto.id] ? '#FFF' : '#9CA3AF',
                      }}
                    >
                      {auto.name}
                    </h4>
                    <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>{auto.desc}</p>
                  </div>
                </div>

                <ToggleSwitch
                  isOn={toggles[auto.id]}
                  onToggle={() => setToggles({ ...toggles, [auto.id]: !toggles[auto.id] })}
                />
              </div>
            ))}
          </div>
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
                {['All active', 'Month plan', 'Lapsed', 'Custom'].map((seg) => (
                  <button
                    key={seg}
                    onClick={() => setSegment(seg)}
                    style={{
                      backgroundColor: segment === seg ? 'rgba(228,40,29,.10)' : '#222',
                      color: segment === seg ? 'var(--err)' : '#9CA3AF',
                      padding: '8px 20px',
                      borderRadius: '24px',
                      border: `1px solid ${segment === seg ? 'var(--err)' : '#333'}`,
                      fontSize: '14px',
                      fontWeight: segment === seg ? 600 : 400,
                    }}
                  >
                    {seg}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--err)',
                  color: '#000',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                👥 To: {getRecipientCount()} subscribers
              </div>
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
                  WhatsApp Message
                </label>
                <span
                  style={{
                    fontSize: '13px',
                    color: message.length > 320 ? 'var(--err)' : '#9CA3AF',
                  }}
                >
                  {message.length} / 320 characters
                </span>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              >
                📢 Send to {getRecipientCount()} subscribers
              </button>
              <p
                style={{
                  textAlign: 'center',
                  color: '#9CA3AF',
                  fontSize: '13px',
                  marginTop: '12px',
                }}
              >
                Sends via WhatsApp broadcast
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: any) {
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

function ToggleSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '13px',
        backgroundColor: isOn ? 'var(--err)' : '#374151',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
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
