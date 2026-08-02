import { Fragment, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  useDailyOps,
  useAdvancePipeline,
  useIssues,
  useCreditIssue,
  useRejectIssue,
} from '../api/daily-ops.queries';
import { useExportDailyOps } from '@/features/labels/api/labels.queries';
import { REJECT_REASONS, type Issue, type PipelineStage } from '../model/daily-ops.schema';
import CreditModal from '../components/CreditModal';
import RejectModal from '../components/RejectModal';
import { ApiError } from '@/shared/types/api';

const MEAL_TYPE_EMOJI: Record<string, string> = { executive: '🍛', salad: '🥗' };
const STAGE_ICON: Record<string, string> = { locked: '✓', dispatch: '🚚', delivered: '✅' };
const ISSUE_TYPE_EMOJI: Record<string, string> = {
  missing: '📦',
  quality: '😟',
  wrong_order: '🔄',
  late: '⏰',
  other: '❓',
};

export default function DailyOps() {
  const { role } = useOutletContext<{ role: 'admin' | 'ops' }>();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  const { data: dailyOps, isLoading, error } = useDailyOps();
  const { data: issuesQueue } = useIssues();
  const advancePipeline = useAdvancePipeline();
  const creditIssue = useCreditIssue();
  const rejectIssue = useRejectIssue();
  const exportDailyOps = useExportDailyOps();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal states
  const [activeIssueForCredit, setActiveIssueForCredit] = useState<Issue | null>(null);
  const [activeIssueForReject, setActiveIssueForReject] = useState<Issue | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [rejectReasonId, setRejectReasonId] = useState<string>('');

  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const issues = isAdmin ? (issuesQueue?.issues ?? []) : [];

  const handleConfirmCredit = () => {
    if (!activeIssueForCredit) return;
    creditIssue.mutate(
      { issueId: activeIssueForCredit.issue_id, input: { credit_sar: Number(creditAmount) } },
      {
        onSuccess: () => {
          setActiveIssueForCredit(null);
          setCreditAmount('');
        },
        onError: (err) => setErrorMsg(err instanceof ApiError ? err.message : 'Failed to credit issue'),
      },
    );
  };

  const handleConfirmReject = () => {
    if (!activeIssueForReject) return;
    const selected = REJECT_REASONS.find((r) => r.id === rejectReasonId);
    if (!selected) return;
    rejectIssue.mutate(
      { issueId: activeIssueForReject.issue_id, input: { reason: selected.title, note: selected.desc } },
      {
        onSuccess: () => {
          setActiveIssueForReject(null);
          setRejectReasonId('');
        },
        onError: (err) => setErrorMsg(err instanceof ApiError ? err.message : 'Failed to reject issue'),
      },
    );
  };

  const handleAdvance = () => {
    if (!dailyOps) return;
    const stages = dailyOps.pipeline.stages.map((s) => s.id as PipelineStage);
    const currentIndex = stages.indexOf(dailyOps.pipeline.stage);
    const nextStage = stages[currentIndex + 1];
    if (!nextStage) return;
    setErrorMsg(null);
    advancePipeline.mutate(
      { from_stage: dailyOps.pipeline.stage, to_stage: nextStage },
      { onError: (err) => setErrorMsg(err instanceof ApiError ? err.message : 'Failed to advance pipeline') },
    );
  };

  if (isLoading) {
    return (
      <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
        Loading daily ops…
      </div>
    );
  }

  if (error || !dailyOps) {
    return (
      <div style={{ color: 'var(--danger)', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
        {error instanceof ApiError ? error.message : 'Failed to load daily ops.'}
      </div>
    );
  }

  const { pipeline, meal_breakdown: mealBreakdown } = dailyOps;

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
                  backgroundColor: isAdmin ? '#333' : 'var(--ops)',
                  color: '#FFF',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {isAdmin ? 'Admin' : 'Ops'}
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
            <StatBox label="MEALS" value={mealBreakdown.total.toString()} />
            {isAdmin && (
              <StatBox
                label="ISSUES"
                value={(issuesQueue?.open_count ?? 0).toString()}
                color="var(--danger)"
              />
            )}
          </div>
        </div>

        {/* Production Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '32px' }}>
          {pipeline.stages.map((stage, i) => (
            <Fragment key={stage.id}>
              {i > 0 && <StatusLine status={stage.status !== 'pending' ? 'active' : 'pending'} />}
              <StatusStep
                label={stage.label}
                status={stage.status === 'done' ? 'completed' : stage.status}
                icon={STAGE_ICON[stage.id] ?? '•'}
              />
            </Fragment>
          ))}
        </div>

        {pipeline.can_advance && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              style={{ padding: '10px 20px', opacity: advancePipeline.isPending ? 0.7 : 1 }}
              disabled={advancePipeline.isPending}
              onClick={handleAdvance}
            >
              {advancePipeline.isPending ? 'Advancing…' : (pipeline.advance_label ?? 'Advance →')}
            </button>
          </div>
        )}
        {pipeline.locked_note && (
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '12px', marginBottom: 0 }}>
            {pipeline.locked_note}
          </p>
        )}
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(220,38,38,0.1)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-ghost"
                style={{ padding: '8px 16px', border: '1px solid #333', opacity: exportDailyOps.isPending ? 0.7 : 1 }}
                disabled={exportDailyOps.isPending}
                onClick={() => exportDailyOps.mutate()}
              >
                {exportDailyOps.isPending ? 'Exporting…' : '📄 Export'}
              </button>
              <button
                className="btn-primary"
                style={{ padding: '8px 16px' }}
                onClick={() => navigate('/labels')}
              >
                🏷️ Labels
              </button>
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '1px solid #333',
              overflow: 'hidden',
            }}
          >
            {mealBreakdown.rows.map((row) => (
              <div
                key={row.type}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderBottom: '1px solid #333',
                }}
              >
                <span>
                  {MEAL_TYPE_EMOJI[row.type] ?? ''} {row.label}
                </span>
                <span style={{ fontWeight: 'bold' }}>{row.count}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#222',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Total</span>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{mealBreakdown.total}</span>
            </div>
          </div>
        </div>

        {/* 3c. OPEN ISSUES — admin only */}
        {isAdmin && (
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
                    key={issue.issue_id}
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
                      {ISSUE_TYPE_EMOJI[issue.issue_type ?? ''] ?? ''} {issue.issue_type_label}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      {issue.customer_name}
                    </h4>
                    <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px' }}>
                      {issue.delivery_address ?? '—'}
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
                      "{issue.description}"
                    </p>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', flex: 1 }}
                        onClick={() => setActiveIssueForCredit(issue)}
                      >
                        💳 Credit Wallet
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
          isPending={creditIssue.isPending}
          onClose={() => {
            setActiveIssueForCredit(null);
            setCreditAmount('');
          }}
          onConfirm={handleConfirmCredit}
        />
      )}

      {activeIssueForReject && (
        <RejectModal
          issue={activeIssueForReject}
          reason={rejectReasonId}
          setReason={setRejectReasonId}
          isPending={rejectIssue.isPending}
          onClose={() => {
            setActiveIssueForReject(null);
            setRejectReasonId('');
          }}
          onConfirm={handleConfirmReject}
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
