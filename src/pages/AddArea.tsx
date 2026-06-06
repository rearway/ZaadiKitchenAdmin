import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateArea } from '@/features/areas/api/areas.queries';
import type { AreaStatus } from '@/features/areas/model/areas.schema';
import { ApiError } from '@/shared/types/api';

export default function AddArea() {
  const navigate = useNavigate();
  const createArea = useCreateArea();

  const [name, setName] = useState('');
  const [coverage, setCoverage] = useState('');
  const [status, setStatus] = useState<AreaStatus>('coming_soon');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Area name is required.');
      return;
    }
    setError('');
    createArea.mutate(
      { name: name.trim(), coverage: coverage.trim() || undefined, status },
      {
        onSuccess: () => navigate('/areas'),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : 'Failed to create area.');
        },
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Add Area
        </h1>
      </div>

      <div
        style={{
          backgroundColor: '#1A1A1A',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              color: '#D1D5DB',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            AREA NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Al Nakheel"
            style={{ width: '100%', backgroundColor: '#222' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              color: '#D1D5DB',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            COVERAGE
          </label>
          <textarea
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            placeholder="e.g. Northern Riyadh, bounded by King Salman Rd"
            style={{
              width: '100%',
              height: '80px',
              backgroundColor: '#222',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px',
              color: '#FFF',
              fontFamily: 'Montserrat, sans-serif',
              resize: 'vertical',
            }}
          />
        </div>

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
            STATUS
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {([
              ['active', 'Active'],
              ['coming_soon', 'Coming Soon'],
              ['paused', 'Paused'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: status === value ? '2px solid var(--danger)' : '1px solid #444',
                  backgroundColor: status === value ? 'rgba(228,40,29,0.1)' : '#222',
                  color: status === value ? 'var(--danger)' : '#9CA3AF',
                }}
              >
                {status === value ? '✓ ' : ''}
                {label}
              </button>
            ))}
          </div>
        </div>

        {status === 'active' && (
          <div
            style={{
              backgroundColor: 'rgba(228,40,29,0.08)',
              border: '1.5px solid rgba(228,40,29,0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--danger)', marginBottom: '4px' }}>
              ⚠️ Activating this area
            </div>
            <div style={{ fontSize: '13px', color: '#F87171', lineHeight: 1.5 }}>
              This area will become immediately selectable by new customers in the Area Search screen
              on activation.
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220,38,38,0.1)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            marginTop: '8px',
            borderTop: '1px solid #333',
            paddingTop: '24px',
            display: 'flex',
            gap: '12px',
          }}
        >
          {status === 'active' ? (
            <>
              <button
                className="btn-primary"
                style={{ padding: '12px 24px', fontSize: '15px', opacity: createArea.isPending ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={createArea.isPending}
              >
                {createArea.isPending ? 'Saving…' : '✓ Activate Area'}
              </button>
              <button
                className="btn-ghost"
                style={{ padding: '12px 24px', fontSize: '15px' }}
                onClick={() => navigate('/areas')}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '15px', opacity: createArea.isPending ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={createArea.isPending}
            >
              {createArea.isPending ? 'Saving…' : 'Save Area'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
