import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Calendar,
  Users,
  MessageSquare,
  Map,
  LogOut,
} from 'lucide-react';
import { logoutApi } from '@/features/auth/api/auth.api';
import { useSessionStore } from '@/store/useSessionStore';

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
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--blk)',
        borderRight: '1px solid #222222',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ padding: '24px', borderBottom: '1px solid #222222' }}>
        <h2
          style={{
            fontSize: '24px',
            fontFamily: 'Montserrat, sans-serif',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <img src="/brand/platio-logo-white.svg" alt="Platio" style={{ height: '20px', width: 'auto' }} />
          Ops
        </h2>
      </div>
      <nav
        style={{
          padding: '16px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {NAV_ITEMS.map((item) => (
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
              transition: 'all 0.2s',
            })}
          >
            <item.icon
              size={20}
              color={window.location.pathname === item.path ? 'var(--danger)' : 'currentColor'}
            />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '12px', borderTop: '1px solid #222222' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)';
            e.currentTarget.style.color = '#F87171';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
