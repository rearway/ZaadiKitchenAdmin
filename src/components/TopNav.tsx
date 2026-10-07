import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/useSessionStore';
import { logoutApi } from '@/features/auth/api/auth.api';
import type { User } from '@/shared/types/api';

type Props = { user: User | null };

export default function TopNav({ user }: Props) {
  const clearSession = useSessionStore((s) => s.clearSession);
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleLogout = () => {
    void logoutApi().finally(() => {
      clearSession();
      navigate('/login');
    });
  };

  const isAdmin = user?.role === 'admin';
  const initial = user?.name?.charAt(0).toUpperCase() ?? (isAdmin ? 'A' : 'O');

  return (
    <header
      style={{
        height: '72px',
        backgroundColor: 'var(--blk3)',
        borderBottom: '1px solid #222222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {!isAdmin && (
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
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{ color: '#9CA3AF', fontSize: '15px' }}>{today}</span>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
