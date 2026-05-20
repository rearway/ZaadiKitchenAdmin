import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddArea() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'Active' | 'Coming Soon' | 'Paused'>('Coming Soon');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>&larr;</button>
        <h1 style={{ fontSize: '32px', fontFamily: "Montserrat, sans-serif", margin: 0 }}>Add Area</h1>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', padding: '32px', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>AREA NAME</label>
          <input type="text" placeholder="e.g. Al Nakheel" style={{ width: '100%', backgroundColor: '#222' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>COVERAGE</label>
          <textarea placeholder="e.g. Northern Riyadh, bounded by King Salman Rd" style={{ width: '100%', height: '80px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: '#FFF', fontFamily: "Montserrat, sans-serif", resize: 'vertical' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '12px' }}>STATUS</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['Active', 'Coming Soon', 'Paused'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  border: status === s ? '2px solid var(--err)' : '1px solid #444',
                  backgroundColor: status === s ? 'rgba(228,40,29,0.1)' : '#222',
                  color: status === s ? 'var(--err)' : '#9CA3AF',
                }}
              >
                {status === s ? '✓ ' : ''}{s}
              </button>
            ))}
          </div>
        </div>

        {status === 'Active' && (
          <div style={{ backgroundColor: 'rgba(228,40,29,0.08)', border: '1.5px solid rgba(228,40,29,0.25)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--err)', marginBottom: '4px' }}>⚠️ Activating this area</div>
            <div style={{ fontSize: '13px', color: '#F87171', lineHeight: 1.5 }}>
              This area will become immediately selectable by new customers in the Area Search screen on activation.
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '8px', borderTop: '1px solid #333', paddingTop: '24px', display: 'flex', gap: '12px' }}>
          {status === 'Active' ? (
            <>
              <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigate('/areas')}>
                ✓ Activate Area
              </button>
              <button className="btn-ghost" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigate('/areas')}>
                Save other changes
              </button>
            </>
          ) : (
            <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigate('/areas')}>
              Save Area
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

