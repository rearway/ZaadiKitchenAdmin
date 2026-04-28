import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

export default function DashboardLayout() {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (!savedRole) {
      navigate('/login');
    } else {
      setRole(savedRole);
      // If Ops tries to access admin routes, bounce them back to /ops
      if (savedRole === 'Ops' && location.pathname !== '/ops' && location.pathname !== '/labels') {
        navigate('/ops');
      }
    }
  }, [navigate, location.pathname]);

  if (!role) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#141414' }}>
      {role === 'Admin' && <Sidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopNav role={role} />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet context={{ role }} />
        </main>
      </div>
    </div>
  );
}
