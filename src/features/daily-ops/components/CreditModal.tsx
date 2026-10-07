import type { Issue } from '../model/daily-ops.schema';
import ModalOverlay from './ModalOverlay';

type CreditModalProps = {
  issue: Issue;
  amount: string;
  setAmount: (v: string) => void;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CreditModal({
  issue,
  amount,
  setAmount,
  isPending,
  onClose,
  onConfirm,
}: CreditModalProps) {
  const numAmount = parseFloat(amount || '0');
  const isError = numAmount > 30;

  return (
    <ModalOverlay>
      <h2 style={{ fontSize: '24px', fontFamily: 'Montserrat, sans-serif', marginBottom: '8px' }}>
        Credit Wallet
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
        Issue: {issue.issue_type_label} — {issue.customer_name}. Wallet credit is added
        immediately and customer is notified via WhatsApp.
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
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          className="btn-primary"
          style={{ flex: 2, opacity: isPending ? 0.7 : 1 }}
          disabled={isError || !amount || isPending}
          onClick={onConfirm}
        >
          {isPending ? 'Crediting…' : `Confirm Credit — SAR ${amount || '0'}`}
        </button>
      </div>
    </ModalOverlay>
  );
}
