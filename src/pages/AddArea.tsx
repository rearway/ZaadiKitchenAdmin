import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddArea() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'Active' | 'Coming Soon' | 'Paused'>('Active');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>&larr;</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', margin: 0 }}>Add Area</h1>
          <span style={{ backgroundColor: '#333', color: '#FFF', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
            Admin
          </span>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', padding: '32px', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>AREA / ZONE NAME</label>
          <input type="text" placeholder="e.g. Al Nakheel" style={{ width: '100%', backgroundColor: '#222' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>COVERAGE DESCRIPTION</label>
          <textarea placeholder="e.g. Northern Riyadh, bounded by..." style={{ width: '100%', height: '80px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: '#FFF', fontFamily: 'var(--font-sans)', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>DISTANCE FROM KITCHEN</label>
            <div style={{ position: 'relative' }}>
              <input type="number" placeholder="0.0" style={{ width: '100%', backgroundColor: '#222', paddingRight: '40px' }} />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>km</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>EST. DELIVERY TIME</label>
            <input type="text" placeholder="e.g. ~35 min" style={{ width: '100%', backgroundColor: '#222' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '12px' }}>LAUNCH STATUS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <RadioCard 
              active={status === 'Active'} onClick={() => setStatus('Active')}
              title="✅ Active" desc="Customers can select this area immediately"
            />
            <RadioCard 
              active={status === 'Coming Soon'} onClick={() => setStatus('Coming Soon')}
              title="⏳ Coming Soon" desc="Visible to customers but not selectable"
            />
            <RadioCard 
              active={status === 'Paused'} onClick={() => setStatus('Paused')}
              title="⏸ Paused" desc="Hidden from all customers"
            />
          </div>
        </div>

        {status === 'Coming Soon' && (
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>PLANNED LAUNCH DATE</label>
            <input type="date" style={{ width: '100%', backgroundColor: '#222', colorScheme: 'dark' }} />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>INTERNAL NOTES</label>
          <textarea placeholder="e.g. Needs extra rider. Coordinate with ops..." style={{ width: '100%', height: '80px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: '#FFF', fontFamily: 'var(--font-sans)', resize: 'vertical' }} />
        </div>

        {/* CTA */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '32px' }}>
          <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }} onClick={() => navigate('/areas')}>
            Save Area
          </button>
        </div>

      </div>
    </div>
  );
}

function RadioCard({ active, onClick, title, desc }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '16px', borderRadius: '8px', border: `1px solid ${active ? 'var(--color-mint)' : '#333'}`, 
        backgroundColor: active ? 'rgba(0, 200, 150, 0.05)' : '#222', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}
    >
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${active ? 'var(--color-mint)' : '#666'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-mint)' }} />}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: '#FFF' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{desc}</div>
      </div>
    </div>
  );
}
