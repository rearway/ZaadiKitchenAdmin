import { REJECT_REASONS, type Issue } from '../model/daily-ops.schema';
import ModalOverlay from './ModalOverlay';

type RejectModalProps = {
  issue: Issue;
  reason: string;
  setReason: (v: string) => void;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function RejectModal({
  issue,
  reason,
  setReason,
  isPending,
  onClose,
  onConfirm,
}: RejectModalProps) {
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
        Issue: {issue.issue_type_label} — {issue.customer_name}. Select a reason. This closes the
        issue without crediting the customer's wallet.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {REJECT_REASONS.map((opt) => (
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
          disabled={isPending}
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
            opacity: isPending ? 0.7 : 1,
          }}
          disabled={!reason || isPending}
          onClick={onConfirm}
        >
          {isPending ? 'Rejecting…' : 'Confirm Rejection'}
        </button>
      </div>
    </ModalOverlay>
  );
}
