import React from 'react';

export default function TopNav({ role }: { role: string }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }); // e.g. Thu, Apr 3

  return (
    <header style={{
      height: '72px',
      backgroundColor: 'var(--color-ink)',
      borderBottom: '1px solid #222222',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {role !== 'Admin' && (
          <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', margin: 0 }}>
            Zaadi<span style={{ color: 'var(--color-mint)' }}>.</span> Ops
          </h2>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{ color: '#9CA3AF', fontSize: '15px' }}>{today}</span>
        <div style={{ 
          width: '36px', height: '36px', 
          borderRadius: '50%', backgroundColor: 'var(--color-mint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontWeight: 'bold', fontSize: '14px'
        }}>
          {role === 'Admin' ? 'A' : 'O'}
        </div>
      </div>
    </header>
  );
}
