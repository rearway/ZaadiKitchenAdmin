import { useEffect, useState } from 'react';
import type { AreaChoice } from '../model/driver-deliveries.schema';

type Props = {
  driverName: string;
  areas: AreaChoice[];
  isLoading: boolean;
  error: string | null;
  isPending: boolean;
  onClose: () => void;
  onAssign: (areaId: string) => void;
};

const fieldStyle = {
  width: '100%',
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-med)',
  borderRadius: 'var(--radius-8)',
  padding: 'var(--space-10) var(--space-12)',
  color: 'var(--white)',
  fontSize: 'var(--text-14)',
  colorScheme: 'dark' as const,
};

export default function AssignDriverAreaDialog({
  driverName,
  areas,
  isLoading,
  error,
  isPending,
  onClose,
  onAssign,
}: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const selected = areas.some((area) => area.id === picked) ? (picked ?? '') : (areas[0]?.id ?? '');

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPending, onClose]);

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isPending) onClose();
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-area-title"
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
          id="assign-area-title"
          style={{ fontSize: 'var(--text-20)', fontFamily: 'var(--font-brand)', margin: 0 }}
        >
          Assign area
        </h2>
        <p style={{ margin: 0, fontSize: 'var(--text-14)', color: 'var(--soft)', lineHeight: 1.5 }}>
          Assigning to {driverName}. The list is unassigned areas only. One area belongs to one
          driver, and a driver can hold several areas.
        </p>

        {isLoading && (
          <p role="status" style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--soft)' }}>
            Loading areas…
          </p>
        )}

        {!isLoading && areas.length === 0 && (
          <div
            role="status"
            style={{
              backgroundColor: 'var(--warn-a10)',
              border: '1px solid var(--warn)',
              borderRadius: 'var(--radius-8)',
              padding: 'var(--space-12) var(--space-16)',
              color: 'var(--text-3)',
              fontSize: 'var(--text-14)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--warn)', marginBottom: 'var(--space-4)' }}>
              No free areas
            </div>
            Every service area already has a driver. Unassign or wait for a new area before
            assigning again.
          </div>
        )}

        {areas.length > 0 && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <span
              style={{
                fontSize: 'var(--text-12)',
                color: 'var(--soft)',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              Unassigned area
            </span>
            <select
              value={selected}
              onChange={(event) => setPicked(event.target.value)}
              style={fieldStyle}
              aria-label="Unassigned area"
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name ?? area.id}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--danger-a06)',
              border: '1px solid var(--danger-a30)',
              borderRadius: 'var(--radius-8)',
              padding: 'var(--space-12) var(--space-16)',
              color: 'var(--text-err)',
              fontSize: 'var(--text-14)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Cannot assign</div>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: 'var(--space-8) var(--space-16)', backgroundColor: 'var(--surface)' }}
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: 'var(--space-8) var(--space-16)', opacity: isPending ? 0.7 : 1 }}
            disabled={isPending || areas.length === 0 || !selected}
            onClick={() => onAssign(selected)}
          >
            {isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
