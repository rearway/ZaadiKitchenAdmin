import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import {
  useCustomers,
  useCustomerDetail,
  useCustomerHistory,
  useDeactivateCustomer,
  useCreditWallet,
} from '@/features/customers/api/customers.queries';
import {
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_COLOR,
  SUBSCRIPTION_STATUS_AVATAR,
  type SubscriptionStatus,
} from '@/features/customers/model/customers.schema';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'expired', label: 'Expired' },
  { key: 'churned', label: 'Churned' },
] as const;

export default function CustomerManagement() {
  const role = useSessionStore((s) => s.user?.role);
  const isAdmin = role === 'admin';

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [creditId, setCreditId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounce search to avoid firing on every keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(inputValue);
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [inputValue]);

  const { data: customerData, isLoading } = useCustomers({
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
  });

  const { data: detail, isLoading: detailLoading } = useCustomerDetail(expandedId ?? '');
  const { data: history, isLoading: historyLoading } = useCustomerHistory(historyId ?? '');
  const deactivate = useDeactivateCustomer();
  const creditWallet = useCreditWallet();

  const customers = customerData?.customers ?? [];
  const total = customerData?.total ?? 0;
  const totalPages = customerData?.totalPages ?? 1;

  const amountNum = parseFloat(creditAmount);
  const isCreditValid =
    !isNaN(amountNum) && amountNum > 0 && amountNum <= 30 && creditNote.trim().length > 0;

  const handleDeactivate = (id: string) => {
    setErrorMsg(null);
    deactivate.mutate(id, {
      onSuccess: () => {
        setConfirmDeactivateId(null);
        setExpandedId(null);
        setHistoryId(null);
        setCreditId(null);
      },
      onError: (err) => {
        setConfirmDeactivateId(null);
        setErrorMsg(err instanceof Error ? err.message : 'Failed to deactivate customer');
      },
    });
  };

  const handleCreditWallet = (id: string) => {
    if (!isCreditValid) return;
    setErrorMsg(null);
    creditWallet.mutate(
      { id, input: { amountSar: amountNum, note: creditNote.trim() } },
      {
        onSuccess: () => {
          setCreditId(null);
          setCreditAmount('');
          setCreditNote('');
        },
        onError: (err) => {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to credit wallet');
        },
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Customers{' '}
          {!isLoading && total > 0 && (
            <span
              style={{ color: '#9CA3AF', fontSize: '20px', fontFamily: 'Montserrat, sans-serif' }}
            >
              · {total} total
            </span>
          )}
        </h1>
      </div>

      {/* Error banner */}
      {errorMsg && (
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
          <span>⚠ {errorMsg}</span>
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

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Search by name, phone or email..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1A1A1A' }}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setStatusFilter(f.key);
                setPage(1);
              }}
              style={{
                backgroundColor: statusFilter === f.key ? '#333' : '#1A1A1A',
                color: statusFilter === f.key ? '#FFF' : '#9CA3AF',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid #333',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {f.key === 'all' && total > 0 ? `All (${total})` : f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div
          style={{ color: '#9CA3AF', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}
        >
          Loading customers…
        </div>
      ) : customers.length === 0 ? (
        <div
          style={{ color: '#9CA3AF', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}
        >
          No customers found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {customers.map((c) => {
            const isExpanded = expandedId === c.id;
            const isChurned = c.subscriptionStatus === 'churned';
            const statusStyle =
              SUBSCRIPTION_STATUS_COLOR[c.subscriptionStatus as SubscriptionStatus] ?? {
                bg: '#333',
                color: '#FFF',
              };
            const avatarColor =
              SUBSCRIPTION_STATUS_AVATAR[c.subscriptionStatus as SubscriptionStatus] ??
              'var(--ops)';
            const initial = c.name ? c.name[0].toUpperCase() : '?';
            const showCreditForm = creditId === c.id;
            const showDeactivateConfirm = confirmDeactivateId === c.id;
            const showHistory = historyId === c.id;

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  opacity: isChurned ? 0.6 : 1,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  borderLeft: isExpanded ? '4px solid var(--danger)' : '1px solid #333',
                }}
              >
                {/* Collapsed Row */}
                <div
                  onClick={() => {
                    const next = isExpanded ? null : c.id;
                    setExpandedId(next);
                    if (!next) {
                      setHistoryId(null);
                      setCreditId(null);
                      setConfirmDeactivateId(null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 24px',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      color: '#FFF',
                      marginRight: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '16px', margin: 0, width: '150px' }}>
                      {c.name}
                    </h4>

                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '200px' }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--danger)',
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#D1D5DB' }}>{c.plan || '—'}</span>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {SUBSCRIPTION_STATUS_LABEL[c.subscriptionStatus as SubscriptionStatus] ??
                        c.subscriptionStatus}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '14px',
                      color: '#9CA3AF',
                      textAlign: 'right',
                      marginRight: '16px',
                    }}
                  >
                    {c.phone}
                    {c.endDate ? ` · ends ${c.endDate}` : c.daysLeft > 0 ? ` · ${c.daysLeft} days left` : ''}
                  </div>

                  <div
                    style={{
                      color: '#9CA3AF',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    ▶
                  </div>
                </div>

                {/* Expanded Area */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '24px',
                      borderTop: '1px solid #333',
                      backgroundColor: '#111',
                    }}
                  >
                    {detailLoading ? (
                      <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '16px 0' }}>
                        Loading details…
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '24px',
                          }}
                        >
                          <InfoCard
                            label="Plan"
                            value={detail?.plan || c.plan || '—'}
                            sub={
                              detail?.planEndDate
                                ? `Ends ${detail.planEndDate}`
                                : `${c.daysLeft} days left`
                            }
                          />
                          <InfoCard
                            label="Wallet"
                            value={`SAR ${(detail?.walletBalance ?? c.walletBalance).toFixed(2)}`}
                            sub="Credit balance"
                            valueColor="var(--danger)"
                          />
                          <InfoCard
                            label="Address"
                            value={
                              (detail?.primaryAddress ?? '').split(',')[0].trim() || '—'
                            }
                            sub={
                              (detail?.primaryAddress ?? '')
                                .split(',')
                                .slice(1)
                                .join(',')
                                .trim() || ''
                            }
                          />
                          <InfoCard
                            label="Issues"
                            value={detail ? `${detail.openIssueCount} open` : '—'}
                            sub="Support tickets"
                          />
                        </div>

                        {/* Credit wallet inline form */}
                        {showCreditForm && (
                          <div
                            style={{
                              backgroundColor: 'rgba(228,40,29,0.06)',
                              border: '1px solid rgba(228,40,29,0.2)',
                              borderRadius: '8px',
                              padding: '16px',
                              marginBottom: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                            }}
                          >
                            <div
                              style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}
                            >
                              Credit Wallet
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                              >
                                <input
                                  type="number"
                                  placeholder="Amount (SAR, max 30)"
                                  min={0.01}
                                  max={30}
                                  step={0.01}
                                  value={creditAmount}
                                  onChange={(e) => setCreditAmount(e.target.value)}
                                  style={{
                                    backgroundColor: '#1A1A1A',
                                    width: '180px',
                                    fontSize: '13px',
                                  }}
                                />
                                {creditAmount !== '' &&
                                  (isNaN(amountNum) || amountNum <= 0 || amountNum > 30) && (
                                    <span style={{ color: '#F87171', fontSize: '11px' }}>
                                      {amountNum > 30 ? 'Max SAR 30' : 'Enter a valid amount'}
                                    </span>
                                  )}
                              </div>
                              <input
                                type="text"
                                placeholder="Note (required)"
                                value={creditNote}
                                onChange={(e) => setCreditNote(e.target.value)}
                                style={{
                                  backgroundColor: '#1A1A1A',
                                  flex: 1,
                                  minWidth: '160px',
                                  fontSize: '13px',
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  backgroundColor: isCreditValid ? 'var(--danger)' : '#444',
                                  color: '#FFF',
                                  border: 'none',
                                  cursor: isCreditValid ? 'pointer' : 'not-allowed',
                                  opacity: creditWallet.isPending ? 0.6 : 1,
                                }}
                                disabled={!isCreditValid || creditWallet.isPending}
                                onClick={() => handleCreditWallet(c.id)}
                              >
                                {creditWallet.isPending ? 'Crediting…' : 'Confirm Credit'}
                              </button>
                              <button
                                className="btn-ghost"
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                                onClick={() => {
                                  setCreditId(null);
                                  setCreditAmount('');
                                  setCreditNote('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Deactivate inline confirm */}
                        {showDeactivateConfirm && (
                          <div
                            style={{
                              backgroundColor: 'rgba(220,38,38,0.06)',
                              border: '1px solid rgba(220,38,38,0.2)',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <span style={{ fontSize: '13px', color: '#F87171', flex: 1 }}>
                              Deactivate {c.name}&apos;s account? This cannot be undone.
                            </span>
                            <button
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 700,
                                backgroundColor: 'var(--danger)',
                                color: '#FFF',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: deactivate.isPending ? 0.6 : 1,
                              }}
                              disabled={deactivate.isPending}
                              onClick={() => handleDeactivate(c.id)}
                            >
                              {deactivate.isPending ? 'Deactivating…' : 'Confirm deactivate'}
                            </button>
                            <button
                              className="btn-ghost"
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                              onClick={() => setConfirmDeactivateId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* History panel */}
                        {showHistory && (
                          <div
                            style={{
                              backgroundColor: '#1A1A1A',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              padding: '16px',
                              marginBottom: '16px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#D1D5DB',
                                marginBottom: '12px',
                              }}
                            >
                              Customer History
                            </div>
                            {historyLoading ? (
                              <div style={{ color: '#9CA3AF', fontSize: '13px' }}>
                                Loading history…
                              </div>
                            ) : history ? (
                              <>
                                {history.subscriptions.length > 0 && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: '#6B7280',
                                        fontWeight: 600,
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                      }}
                                    >
                                      Subscriptions
                                    </div>
                                    {history.subscriptions.map((s, i) => (
                                      <div
                                        key={s.id || i}
                                        style={{
                                          fontSize: '13px',
                                          color: '#D1D5DB',
                                          padding: '6px 0',
                                          borderBottom: '1px solid #222',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <span>{s.plan}</span>
                                        <span style={{ color: '#9CA3AF' }}>
                                          {s.startDate} → {s.endDate}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {history.deliveries.slice(0, 5).length > 0 && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: '#6B7280',
                                        fontWeight: 600,
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                      }}
                                    >
                                      Recent Deliveries
                                    </div>
                                    {history.deliveries.slice(0, 5).map((d, i) => (
                                      <div
                                        key={d.id || i}
                                        style={{
                                          fontSize: '13px',
                                          color: '#D1D5DB',
                                          padding: '6px 0',
                                          borderBottom: '1px solid #222',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <span>{d.date}</span>
                                        <span style={{ color: '#9CA3AF' }}>
                                          {d.status}
                                          {d.mealType ? ` · ${d.mealType}` : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {history.issues.length > 0 && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: '#6B7280',
                                        fontWeight: 600,
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                      }}
                                    >
                                      Resolved Issues
                                    </div>
                                    {history.issues.map((issue, i) => (
                                      <div
                                        key={issue.id || i}
                                        style={{
                                          fontSize: '13px',
                                          color: '#D1D5DB',
                                          padding: '6px 0',
                                          borderBottom: '1px solid #222',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <span>{issue.type || issue.description}</span>
                                        <span style={{ color: '#9CA3AF' }}>{issue.createdAt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {history.subscriptions.length === 0 &&
                                  history.deliveries.length === 0 &&
                                  history.issues.length === 0 && (
                                    <div style={{ color: '#6B7280', fontSize: '13px' }}>
                                      No history found.
                                    </div>
                                  )}
                              </>
                            ) : null}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <button
                            style={{
                              backgroundColor: '#FFF',
                              color: '#000',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => window.open(`tel:${c.phone}`, '_self')}
                          >
                            📞 Contact
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ border: '1px solid #333' }}
                            onClick={() => setHistoryId(showHistory ? null : c.id)}
                          >
                            📋 {showHistory ? 'Hide history' : 'View history'}
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              setCreditId(showCreditForm ? null : c.id);
                              setCreditAmount('');
                              setCreditNote('');
                            }}
                          >
                            💰 Credit wallet
                          </button>
                          {isAdmin && (
                            <button
                              className="btn-ghost"
                              style={{ color: '#F87171' }}
                              onClick={() =>
                                setConfirmDeactivateId(showDeactivateConfirm ? null : c.id)
                              }
                            >
                              🚫 Deactivate
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            alignItems: 'center',
            padding: '8px 0',
          }}
        >
          <button
            className="btn-ghost"
            style={{ padding: '6px 16px', opacity: page <= 1 ? 0.4 : 1 }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-ghost"
            style={{ padding: '6px 16px', opacity: page >= totalPages ? 0.4 : 1 }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
};

function InfoCard({ label, value, sub, valueColor = '#FFF' }: InfoCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#1A1A1A',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #333',
      }}
    >
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: valueColor, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#6B7280' }}>{sub}</div>
    </div>
  );
}
