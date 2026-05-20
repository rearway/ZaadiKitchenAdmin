
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

import DashboardLayout from './layouts/DashboardLayout';
import DailyOps from './pages/DailyOps';
import DashboardHome from './pages/DashboardHome';
import RevenueDashboard from './pages/RevenueDashboard';
import MenuManager from './pages/MenuManager';
import CustomerManagement from './pages/CustomerManagement';
import Comms from './pages/Comms';
import AreaManagement from './pages/AreaManagement';
import PrintLabels from './pages/PrintLabels';
import AddDish from './pages/AddDish';
import AddArea from './pages/AddArea';
import BuildingManagement from './pages/BuildingManagement';

// Removed placeholder
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/ops" element={<DailyOps />} />
          <Route path="/labels" element={<PrintLabels />} />
          <Route path="/revenue" element={<RevenueDashboard />} />
          <Route path="/menu" element={<MenuManager />} />
          <Route path="/menu/add" element={<AddDish />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/comms" element={<Comms />} />
          <Route path="/areas" element={<AreaManagement />} />
          <Route path="/areas/new" element={<AddArea />} />
          <Route path="/areas/:areaId/buildings" element={<BuildingManagement />} />
        </Route>

        {/* Redirect root to login for now */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
