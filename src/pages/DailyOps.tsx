import { type ReactNode, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

type Issue = {
  id: string;
  type: string;
  customer: string;
  location: string;
  text: string;
};

const MOCK_ISSUES: Issue[] = [
  {
    id: '1',
    type: '😟 Wrong order',
    customer: 'Ahmad Alsaud',
    location: 'Olaya Towers, Floor 14',
    text: 'I received a Salad meal instead of my Executive meal.',
  },
  {
    id: '2',
    type: '⏰ Late delivery',
    customer: 'Sara Aljohani',
    location: 'KAFD Area 4, Desk 2B',
    text: "It is 1:30 PM and my lunch hasn't arrived yet.",
  },
];

export default function DailyOps() {
  const { role } = useOutletContext<{ role: string }>();
  const navigate = useNavigate();
  const [issues, setIssues] = useState(MOCK_ISSUES);

  // Modal states
  const [activeIssueForCredit, setActiveIssueForCredit] = useState<Issue | null>(null);
  const [activeIssueForReject, setActiveIssueForReject] = useState<Issue | null>(null);

  const [creditAmount, setCreditAmount] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCloseIssue = (id: string) => {
    setIssues(issues.filter((i) => i.id !== id));
    setActiveIssueForCredit(null);
    setActiveIssueForReject(null);
    setCreditAmount('');
    setRejectReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 3a. DARK HEADER PANEL */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #333',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '32px',
                fontFamily: 'Montserrat, sans-serif',
                marginBottom: '8px',
              }}
            >
              Daily Ops <span style={{ color: '#9CA3AF', fontSize: '20px' }}>· {todayDate}</span>
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  backgroundColor: role === 'Admin' ? '#333' : 'var(--ops)',
                  color: '#FFF',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {role}
              </span>
              <span
                style={{
                  color: 'var(--danger)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  className="live-pulse"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--danger)',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                ></span>
                LIVE
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <StatBox label="MEALS" value="87" />
            <StatBox label="ISSUES" value={issues.length.toString()} color="var(--danger)" />
            <StatBox label="SKIPPED" value="12" />
          </div>
        </div>

        {/* Production Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '32px' }}>
          <StatusStep label="Locked" status="completed" icon="✓" />
          <StatusLine status="active" />
          <StatusStep label="Dispatch" status="active" icon="🚚" />
          <StatusLine status="pending" />
          <StatusStep label="Delivered" status="pending" icon="✅" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* 3b. MEAL BREAKDOWN TABLE */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px' }}>
              MEAL BREAKDOWN
            </h3>
            {role === 'Admin' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-ghost"
                  style={{ padding: '8px 16px', border: '1px solid #333' }}
                >
                  📄 Export
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: '8px 16px' }}
                  onClick={() => navigate('/labels')}
                >
                  🏷️ Labels
                </button>
              </div>
            )}
          </div>
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '1px solid #333',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid #333',
              }}
            >
              <span>🍛 Executive Meal</span>
              <span style={{ fontWeight: 'bold' }}>63</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid #333',
              }}
            >
              <span>🥗 Salad Meal</span>
              <span style={{ fontWeight: 'bold' }}>24</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#222',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Total</span>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>87</span>
            </div>
          </div>
        </div>

        {/* 3c. OPEN ISSUES */}
        <div>
          <h3
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}
          >
            OPEN ISSUES ({issues.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {issues.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#9CA3AF',
                  border: '1px dashed #333',
                  borderRadius: '12px',
                }}
              >
                No open issues. Great job!
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    backgroundColor: '#1A1A1A',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255, 115, 64, 0.1)',
                      color: 'var(--danger)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '12px',
                    }}
                  >
                    {issue.type}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                    {issue.customer}
                  </h4>
                  <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px' }}>
                    {issue.location}
                  </p>
                  <p
                    style={{
                      fontSize: '15px',
                      fontStyle: 'italic',
                      marginBottom: '20px',
                      backgroundColor: '#222',
                      padding: '12px',
                      borderRadius: '8px',
                    }}
                  >
                    "{issue.text}"
                  </p>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {role === 'Admin' ? (
                      <>
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 16px', flex: 1 }}
                          onClick={() => setActiveIssueForCredit(issue)}
                        >
                          💳 Credit Wallet
                        </button>
                        <button
                          style={{
                            backgroundColor: 'var(--ops)',
                            color: '#FFF',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          ↑ Escalate
                        </button>
                        <button
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--danger)',
                            border: '1px solid var(--danger)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            flex: 1,
                          }}
                          onClick={() => setActiveIssueForReject(issue)}
                        >
                          ✕ Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={{
                            backgroundColor: 'var(--ops)',
                            color: '#FFF',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                          }}
                        >
                          ↑ Escalate
                        </button>
                        <span style={{ color: '#6B7280', fontSize: '13px', marginLeft: 'auto' }}>
                          Credit wallet: Admin only
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CSS for pulse */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .live-pulse { animation: pulse 2s infinite; }
        
        @keyframes pulse-papaya {
          0% { box-shadow: 0 0 0 0 rgba(228,40,29,.40); }
          70% { box-shadow: 0 0 0 10px rgba(255, 115, 64, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 115, 64, 0); }
        }
        .status-pulse { animation: pulse-papaya 2s infinite; }
      `}</style>

      {/* Modals */}
      {activeIssueForCredit && (
        <CreditModal
          issue={activeIssueForCredit}
          amount={creditAmount}
          setAmount={setCreditAmount}
          onClose={() => {
            setActiveIssueForCredit(null);
            setCreditAmount('');
          }}
          onConfirm={() => handleCloseIssue(activeIssueForCredit.id)}
        />
      )}

      {activeIssueForReject && (
        <RejectModal
          issue={activeIssueForReject}
          reason={rejectReason}
          setReason={setRejectReason}
          onClose={() => {
            setActiveIssueForReject(null);
            setRejectReason('');
          }}
          onConfirm={() => handleCloseIssue(activeIssueForReject.id)}
        />
      )}
    </div>
  );
}

// Sub-components

function StatBox({
  label,
  value,
  color = '#FFF',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          color: '#9CA3AF',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '1px',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', color }}>{value}</div>
    </div>
  );
}

function StatusStep({
  label,
  status,
  icon,
}: {
  label: string;
  status: 'completed' | 'active' | 'pending';
  icon: string;
}) {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1,
      }}
    >
      <div
        className={isActive ? 'status-pulse' : ''}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: isCompleted ? 'var(--danger)' : isActive ? 'var(--danger)' : '#333',
          color: isCompleted ? '#000' : '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: '14px',
          fontWeight: isActive ? 600 : 400,
          color: status === 'pending' ? '#6B7280' : '#FFF',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StatusLine({ status }: { status: 'active' | 'pending' }) {
  return (
    <div
      style={{
        flex: 1,
        height: '2px',
        backgroundColor: status === 'active' ? 'var(--danger)' : '#333',
        transform: 'translateY(-16px)',
      }}
    />
  );
}

// Modals

type CreditModalProps = {
  issue: Issue;
  amount: string;
  setAmount: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function CreditModal({ issue, amount, setAmount, onClose, onConfirm }: CreditModalProps) {
  const numAmount = parseFloat(amount || '0');
  const isError = numAmount > 30;

  return (
    <ModalOverlay>
      <h2 style={{ fontSize: '24px', fontFamily: 'Montserrat, sans-serif', marginBottom: '8px' }}>
        Credit Wallet
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
        Issue: {issue.type} — {issue.customer}. Wallet credit is added immediately and customer is
        notified via WhatsApp.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '200px' }}>
          <span
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              fontSize: '20px',
            }}
          >
            SAR
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: '100%',
              fontSize: '32px',
              padding: '16px 16px 16px 64px',
              textAlign: 'center',
              borderColor: isError ? 'var(--danger)' : '#374151',
            }}
            placeholder="0"
          />
        </div>
      </div>

      {isError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          Amount exceeds maximum of SAR 30. Please enter a lower amount.
        </div>
      )}

      <div
        style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', marginBottom: '12px' }}
      >
        Maximum credit: SAR 30 per issue
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
        {['10', '20', '28', '30'].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            style={{
              backgroundColor: '#222',
              color: '#FFF',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #444',
            }}
          >
            SAR {preset}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          className="btn-ghost"
          style={{ flex: 1, backgroundColor: '#222' }}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="btn-primary"
          style={{ flex: 2 }}
          disabled={isError || !amount}
          onClick={onConfirm}
        >
          Confirm Credit — SAR {amount || '0'}
        </button>
      </div>
    </ModalOverlay>
  );
}

type RejectModalProps = {
  issue: Issue;
  reason: string;
  setReason: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function RejectModal({ issue, reason, setReason, onClose, onConfirm }: RejectModalProps) {
  const options = [
    { id: '1', title: 'Not a valid issue', desc: 'Issue does not meet support criteria' },
    { id: '2', title: 'Duplicate report', desc: 'Same issue already reported and actioned' },
    { id: '3', title: 'Outside policy', desc: 'Reported issue does not qualify for credit' },
  ];

  return (
    <ModalOverlay>
      <h2
        style={{
          fontSize: '24px',
          fontFamily: 'Montserrat, sans-serif',
          marginBottom: '8px',
          color: 'var(--danger)',
        }}
      >
        Reject Issue
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
        Issue: {issue.type} — {issue.customer}. Select a reason. This closes the issue without
        crediting the customer's wallet.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => setReason(opt.id)}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${reason === opt.id ? 'var(--danger)' : '#333'}`,
              backgroundColor: reason === opt.id ? 'rgba(239, 68, 68, 0.05)' : '#222',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: `2px solid ${reason === opt.id ? 'var(--danger)' : '#666'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {reason === opt.id && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--danger)',
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#FFF' }}>{opt.title}</div>
                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{opt.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          className="btn-ghost"
          style={{ flex: 1, backgroundColor: '#222' }}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          style={{
            flex: 2,
            backgroundColor: 'var(--danger)',
            color: '#FFF',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 600,
          }}
          disabled={!reason}
          onClick={onConfirm}
        >
          Confirm Rejection
        </button>
      </div>
    </ModalOverlay>
  );
}

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: '#1A1A1A',
          width: '100%',
          maxWidth: '500px',
          borderRadius: '24px 24px 0 0',
          padding: '32px',
          position: 'relative',
          borderTop: '1px solid #333',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#444',
            borderRadius: '2px',
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        {children}
      </div>
    </div>
  );
}
