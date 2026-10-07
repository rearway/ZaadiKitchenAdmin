import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useSessionStore } from '@/store/useSessionStore';

export default function DashboardLayout() {
  const user = useSessionStore((s) => s.user);
  const role = user?.role ?? 'ops';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#141414' }}>
      {role === 'admin' && <Sidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopNav user={user} />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet context={{ role }} />
        </main>
      </div>
    </div>
  );
}
