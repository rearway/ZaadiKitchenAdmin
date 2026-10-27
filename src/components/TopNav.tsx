import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/useSessionStore';
import { logoutApi } from '@/features/auth/api/auth.api';
import type { User } from '@/shared/types/api';

type Props = { user: User | null };

export default function TopNav({ user }: Props) {
  const clearSession = useSessionStore((s) => s.clearSession);
  const navigate = useNavigate();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    if (!isAccountOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAccountOpen]);

  const handleLogout = () => {
    setIsAccountOpen(false);
    void logoutApi().finally(() => {
      clearSession();
      navigate('/login');
    });
  };

  const isAdmin = user?.role === 'admin';
  const initial = user?.name?.charAt(0).toUpperCase() ?? (isAdmin ? 'A' : 'O');

  const opsLinks = [
    { label: 'Daily Ops', path: '/ops' },
    { label: 'Labels', path: '/labels' },
    { label: 'Plans & Pricing', path: '/plans' },
  ];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              <img
                src="/brand/platio-logo-white.svg"
                alt="Platio"
                style={{ height: '20px', width: 'auto' }}
              />
              Ops
            </h2>
            <nav style={{ display: 'flex', gap: '8px' }}>
              {opsLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  style={({ isActive }) => ({
                    padding: '6px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FFF' : '#9CA3AF',
                    backgroundColor: isActive ? 'rgba(228,40,29,.10)' : 'transparent',
                  })}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{ color: '#9CA3AF', fontSize: '15px' }}>{today}</span>
        <div ref={accountRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Account"
            aria-expanded={isAccountOpen}
            aria-haspopup="menu"
            onClick={() => setIsAccountOpen((open) => !open)}
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
              border: 'none',
              padding: 0,
            }}
          >
            {initial}
          </button>
          {isAccountOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: '44px',
                insetInlineEnd: 0,
                minWidth: '220px',
                backgroundColor: 'var(--blk3)',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '12px',
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
                {user?.name || 'Account'}
              </div>
              {user?.email && (
                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{user.email}</div>
              )}
              <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'capitalize' }}>
                {isAdmin ? 'Admin' : 'Ops'}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                style={{
                  marginTop: '4px',
                  background: 'none',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#F87171',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  textAlign: 'start',
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
