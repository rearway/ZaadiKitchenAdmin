import { useState } from 'react';

type Customer = {
  id: string;
  name: string;
  initial: string;
  color: string;
  plan: 'Month' | 'Weekly' | 'Quarterly' | 'Try It';
  status: 'Active' | 'Paused' | 'Expired' | 'Churned';
  phone: string;
  daysLeft: number;
  wallet: string;
  address: string;
  issues: string;
};

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ahmad Alsaud', initial: 'A', color: 'var(--color-blue)', plan: 'Month', status: 'Active', phone: '+966 541234567', daysLeft: 14, wallet: 'SAR 28.00', address: 'Olaya Towers, Floor 14, Desk 2', issues: '0 open / 1 resolved' },
  { id: '2', name: 'Sara Aljohani', initial: 'S', color: 'var(--color-purple)', plan: 'Quarterly', status: 'Active', phone: '+966 591234567', daysLeft: 62, wallet: 'SAR 0.00', address: 'KAFD Area 4, Desk 2B', issues: '1 open / 0 resolved' },
  { id: '3', name: 'Khalid Alghamdi', initial: 'K', color: 'var(--color-mint)', plan: 'Weekly', status: 'Paused', phone: '+966 561234567', daysLeft: 3, wallet: 'SAR 15.00', address: 'Digital City, Bldg 3, F2', issues: '0 open / 0 resolved' },
  { id: '4', name: 'Noura Alqahtani', initial: 'N', color: 'var(--color-sage)', plan: 'Try It', status: 'Expired', phone: '+966 501234567', daysLeft: 0, wallet: 'SAR 0.00', address: 'Al Nakheel, Riyadh', issues: '0 open / 0 resolved' },
  { id: '5', name: 'Omar Abdulaziz', initial: 'O', color: 'var(--color-gold)', plan: 'Month', status: 'Churned', phone: '+966 551234567', daysLeft: 0, wallet: 'SAR 0.00', address: 'Granada Business Park', issues: '0 open / 2 resolved' }
];

export default function CustomerManagement() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getPlanColor = (plan: string) => {
    switch(plan) {
      case 'Month': return 'var(--color-mint)';
      case 'Weekly': return 'var(--color-lemon)';
      case 'Quarterly': return 'var(--color-purple)';
      case 'Try It': return 'var(--color-papaya)';
      default: return '#FFF';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return { bg: 'rgba(0, 200, 150, 0.1)', color: 'var(--color-mint)' };
      case 'Paused': return { bg: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple)' };
      case 'Expired': 
      case 'Churned': return { bg: 'rgba(255, 115, 64, 0.1)', color: 'var(--color-papaya)' };
      default: return { bg: '#333', color: '#FFF' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', margin: 0 }}>
          Customers <span style={{ color: '#9CA3AF', fontSize: '20px', fontFamily: 'var(--font-sans)' }}>· 248 active</span>
        </h1>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by name or phone..." 
          style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1A1A1A' }}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All (248)', 'Active', 'New Today', 'Churned', 'Month', 'Quarterly'].map((filter, i) => (
            <button key={filter} style={{ 
              backgroundColor: i === 0 ? '#333' : '#1A1A1A', color: i === 0 ? '#FFF' : '#9CA3AF', 
              padding: '6px 16px', borderRadius: '20px', border: '1px solid #333', fontSize: '14px' 
            }}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MOCK_CUSTOMERS.map(c => {
          const isExpanded = expandedId === c.id;
          const statusStyle = getStatusColor(c.status);
          const isChurned = c.status === 'Churned';

          return (
            <div 
              key={c.id} 
              style={{ 
                backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid #333',
                opacity: isChurned ? 0.6 : 1, overflow: 'hidden',
                transition: 'all 0.2s', borderLeft: isExpanded ? '4px solid var(--color-mint)' : '1px solid #333'
              }}
            >
              {/* Collapsed Row */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '16px 24px', cursor: 'pointer',
                  backgroundColor: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: c.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px',
                  color: '#FFF', marginRight: '16px'
                }}>
                  {c.initial}
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '16px', margin: 0, width: '150px' }}>{c.name}</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '200px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getPlanColor(c.plan) }} />
                    <span style={{ fontSize: '14px', color: '#D1D5DB' }}>{c.plan}</span>
                  </div>

                  <span style={{ 
                    padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: statusStyle.bg, color: statusStyle.color
                  }}>
                    {c.status}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'right', marginRight: '16px' }}>
                  {c.phone} · {c.daysLeft} days left
                </div>

                <div style={{ color: '#9CA3AF', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  ▶
                </div>
              </div>

              {/* Expanded Area */}
              {isExpanded && (
                <div style={{ padding: '24px', borderTop: '1px solid #333', backgroundColor: '#111' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <InfoCard label="Plan" value={`${c.plan} · Executive`} sub="Ends May 3" />
                    <InfoCard label="Wallet" value={c.wallet} sub="Credit balance" valueColor="var(--color-mint)" />
                    <InfoCard label="Address" value={c.address.split(',')[0]} sub={c.address.split(',')[1] || ''} />
                    <InfoCard label="Issues" value={c.issues.split(' / ')[0]} sub={c.issues.split(' / ')[1]} />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ backgroundColor: '#FFF', color: '#000', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}>📞 Contact</button>
                    <button className="btn-ghost" style={{ border: '1px solid #333' }}>📋 View history</button>
                    <button className="btn-ghost">🗒️ Add note</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub, valueColor = '#FFF' }: any) {
  return (
    <div style={{ backgroundColor: '#1A1A1A', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: valueColor, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#6B7280' }}>{sub}</div>
    </div>
  );
}
