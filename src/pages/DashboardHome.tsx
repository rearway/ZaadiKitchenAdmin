import { useNavigate } from 'react-router-dom';

const TILES = [
  {
    id: 'ops',
    title: 'Daily Ops',
    icon: '🍛',
    color: 'var(--err)',
    sub: '2 open issues',
    live: true,
    path: '/ops',
  },
  {
    id: 'revenue',
    title: 'Revenue',
    icon: '📊',
    color: 'var(--err)',
    sub: 'SAR 54,200 MRR',
    path: '/revenue',
  },
  {
    id: 'menu',
    title: 'Menu Manager',
    icon: '📅',
    color: 'var(--err)',
    sub: 'Week of Apr 7 ready',
    path: '/menu',
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: '👥',
    color: 'var(--ops)',
    sub: '248 active',
    path: '/customers',
  },
  {
    id: 'comms',
    title: 'Comms',
    icon: '💬',
    color: 'var(--ops)',
    sub: '5 automations live',
    path: '/comms',
  },
  {
    id: 'areas',
    title: 'Areas',
    icon: '📍',
    color: 'var(--grn)',
    sub: '3 active zones',
    path: '/areas',
  },
];

export default function DashboardHome() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Greeting Area */}
      <div>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', marginBottom: '8px' }}>
          Good morning, Admin 👋
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '16px' }}>Zaadi Kitchen · Riyadh Operations</p>
      </div>

      {/* 2x3 Tile Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {TILES.map((tile) => (
          <div
            key={tile.id}
            onClick={() => navigate(tile.path)}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333',
              borderTop: `4px solid ${tile.color}`,
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{tile.icon}</span>
                <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>{tile.title}</h2>
              </div>

              {tile.live && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--err)',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  <span
                    className="live-pulse"
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'var(--err)',
                      borderRadius: '50%',
                      display: 'inline-block',
                    }}
                  ></span>
                  LIVE
                </div>
              )}
            </div>

            <p style={{ color: '#D1D5DB', fontSize: '15px', margin: 0 }}>{tile.sub}</p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .live-pulse { animation: pulse 2s infinite; }
      `}</style>
    </div>
  );
}
