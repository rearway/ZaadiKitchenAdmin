import { useEffect } from 'react';
import type { Driver } from '../model/drivers.schema';

type Props = {
  driver: Driver;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteDriverDialog({ driver, isPending, onCancel, onConfirm }: Props) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPending, onCancel]);

  const name = driver.fullName || driver.phone;

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isPending) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: 'var(--space-24)',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-driver-title"
        aria-describedby="delete-driver-body"
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: 'var(--blk3)',
          width: '100%',
          maxWidth: '440px',
          borderRadius: 'var(--radius-16)',
          border: '1px solid var(--border-ui)',
          padding: 'var(--space-24)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-16)',
        }}
      >
        <h2
          id="delete-driver-title"
          style={{ fontSize: 'var(--text-20)', fontFamily: 'var(--font-brand)', margin: 0 }}
        >
          Delete {name}?
        </h2>
        <p
          id="delete-driver-body"
          style={{ margin: 0, fontSize: 'var(--text-14)', color: 'var(--soft)', lineHeight: 1.5 }}
        >
          They will be signed out and removed from this list. Their phone can be used again.
          Delivery issue history is kept.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: 'var(--space-8) var(--space-16)', backgroundColor: 'var(--surface)' }}
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: 'var(--space-8) var(--space-16)',
              borderRadius: 'var(--radius-8)',
              fontSize: 'var(--text-14)',
              fontWeight: 700,
              backgroundColor: 'var(--danger)',
              color: 'var(--white)',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Deleting…' : 'Delete driver'}
          </button>
        </div>
      </div>
    </div>
  );
}
