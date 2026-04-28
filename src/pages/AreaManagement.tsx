import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type AreaStatus = 'Active' | 'Coming Soon' | 'Paused';

type Area = {
  id: string;
  name: string;
  status: AreaStatus;
  coverage: string;
  distance: number;
  customers: number;
  time: string;
  buildings: number;
};

const MOCK_AREAS: Area[] = [
  { id: '1', name: 'Al Nakheel', status: 'Active', coverage: 'Northern Riyadh, bounded by King Salman Rd', distance: 3.2, customers: 32, time: '~25 min', buildings: 5 },
  { id: '2', name: 'Olaya Business District', status: 'Active', coverage: 'King Fahad Rd corridor', distance: 1.8, customers: 85, time: '~15 min', buildings: 12 },
  { id: '3', name: 'KAFD', status: 'Coming Soon', coverage: 'King Abdullah Financial District blocks 1-4', distance: 5.5, customers: 0, time: '~35 min', buildings: 0 },
  { id: '4', name: 'Al Malaz', status: 'Paused', coverage: 'Central area offices', distance: 8.0, customers: 26, time: '~45 min', buildings: 3 }
];

export default function AreaManagement() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | AreaStatus>('All');
  const [areas] = useState<Area[]>(MOCK_AREAS);

  const filteredAreas = areas.filter(a => filter === 'All' || a.status === filter);

  const getStatusColor = (status: AreaStatus) => {
    switch(status) {
      case 'Active': return 'var(--color-mint)';
      case 'Coming Soon': return 'var(--color-lemon)';
      case 'Paused': return 'var(--color-papaya)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', margin: 0 }}>Delivery Zones</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['All', 'Active', 'Coming Soon', 'Paused'].map((f) => (
          <button 
            key={f} 
            onClick={() => setFilter(f as any)}
            style={{ 
              backgroundColor: filter === f ? '#333' : '#1A1A1A', 
              color: filter === f ? '#FFF' : '#9CA3AF', 
              padding: '6px 16px', borderRadius: '20px', border: '1px solid #333', fontSize: '14px' 
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Area List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAreas.map(area => (
          <div key={area.id} style={{ 
            backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid #333' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getStatusColor(area.status) }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{area.name}</h3>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
                  {area.coverage} · {area.distance} km · {area.customers} customers · {area.time} delivery
                </p>
              </div>
              
              <div style={{ 
                backgroundColor: '#222', padding: '8px 16px', borderRadius: '8px', 
                display: 'flex', alignItems: 'center', gap: '8px' 
              }}>
                <span style={{ color: getStatusColor(area.status), fontWeight: 600, fontSize: '13px' }}>● {area.status}</span>
                <span style={{ color: '#6B7280' }}>|</span>
                <span style={{ color: '#FFF', fontSize: '13px', fontWeight: 600 }}>{area.buildings} buildings registered</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-ghost" style={{ border: '1px solid #333', padding: '8px 16px' }}>✏️ Edit</button>
              
              {area.status === 'Active' && (
                <button className="btn-ghost" style={{ backgroundColor: 'rgba(255, 115, 64, 0.1)', color: 'var(--color-papaya)', padding: '8px 16px' }}>
                  ⏸ Pause
                </button>
              )}
              
              {area.status === 'Coming Soon' && (
                <button className="btn-primary" style={{ padding: '8px 16px' }}>▶ Activate</button>
              )}

              <button className="btn-primary" style={{ padding: '8px 16px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏢 Buildings &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }} onClick={() => navigate('/areas/new')}>
        + Add New Area
      </button>

    </div>
  );
}
