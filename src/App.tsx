import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DailyOps from './features/daily-ops/pages/DailyOps';
import DashboardHome from './pages/DashboardHome';
import RevenueDashboard from './pages/RevenueDashboard';
import MenuManager from './pages/MenuManager';
import CustomerManagement from './pages/CustomerManagement';
import Comms from './pages/Comms';
import AreaManagement from './pages/AreaManagement';
import PrintLabels from './features/labels/pages/PrintLabels';
import AddDish from './pages/AddDish';
import AddArea from './pages/AddArea';
import BuildingManagement from './pages/BuildingManagement';
import ProtectedRoute from './app/router/ProtectedRoute';
import RoleRoute from './app/router/RoleRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Admin-only */}
            <Route element={<RoleRoute allow="admin" />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/revenue" element={<RevenueDashboard />} />
              <Route path="/menu" element={<MenuManager />} />
              <Route path="/menu/add" element={<AddDish />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/comms" element={<Comms />} />
              <Route path="/areas" element={<AreaManagement />} />
              <Route path="/areas/new" element={<AddArea />} />
              <Route path="/areas/:areaId/buildings" element={<BuildingManagement />} />
            </Route>

            {/* Admin + Ops */}
            <Route path="/ops" element={<DailyOps />} />
            <Route path="/labels" element={<PrintLabels />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
