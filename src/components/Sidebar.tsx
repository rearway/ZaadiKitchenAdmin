
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, BarChart3, Calendar, Users, MessageSquare, Map } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Daily Ops', path: '/ops', icon: Activity },
  { label: 'Revenue', path: '/revenue', icon: BarChart3 },
  { label: 'Menu Manager', path: '/menu', icon: Calendar },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Comms', path: '/comms', icon: MessageSquare },
  { label: 'Areas & Buildings', path: '/areas', icon: Map },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--blk)',
      borderRight: '1px solid #222222',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #222222' }}>
        <h2 style={{ fontSize: '24px', fontFamily: "Montserrat, sans-serif", margin: 0 }}>
          Zaadi<span style={{ color: 'var(--err)' }}>.</span> Ops
        </h2>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#FFFFFF' : '#9CA3AF',
              backgroundColor: isActive ? 'rgba(228,40,29,.10)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s'
            })}
          >
            <item.icon size={20} color={window.location.pathname === item.path ? 'var(--err)' : 'currentColor'} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
