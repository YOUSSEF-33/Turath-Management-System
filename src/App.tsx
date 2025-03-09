import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Units from './pages/Units';
import CreateEmployee from './pages/employees/CreateEmployee';
import EditEmployee from './pages/employees/EditEmployee';
import ViewEmployee from './pages/employees/ViewEmployee';
import CreateUnit from './pages/units/CreateUnit';
import EditUnit from './pages/units/EditUnit';
import ViewUnit from './pages/units/ViewUnit';
import UnitReserve from './pages/unitsReserve/UnitsReserve';
import ReverseUnit from './pages/unitsReserve/ReserveUnit';
import { isAuth } from './utils/isAuth';
import LoginPage from './pages/login/Login';
import { UserProvider } from './context/UserContext';
import ViewProjects from './pages/projects/ViewProjects';
import CreateProject from './pages/projects/CreateProject';
import EditProject from './pages/projects/EditProject';
import ViewBuildings from './pages/buildings/ViewBuildings';
import CreateBuilding from './pages/buildings/CreateBuilding';
import EditBuilding from './pages/buildings/EditBuilding';
import ViewUnitDetails from './pages/units/ViewUnitDetails';
import UnitDetails from './pages/unitsReserve/UnitDetails';
import AcceptUnitSale from './pages/unitsReserve/AcceptUnitSale';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ProtectedRoute = ({ children }: any) => {
    return isAuth() ? children : <Navigate to="/login" />;
  };

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route
              path="*"
              element={
                <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
                  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                  <div className="flex-1 flex flex-col">
                    <Navbar
                      title="لوحة التحكم"
                      isMenuOpen={isSidebarOpen}
                      onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                    <main className="flex-1 mt-16 md:mt-0">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />


                        <Route path="/employees" element={<Employees />} />
                        <Route path="/employees/create" element={<CreateEmployee />} />
                        <Route path="/employees/edit/:id" element={<EditEmployee />} />
                        <Route path="/employees/view/:id" element={<ViewEmployee />} />


                        <Route path="" element={<Units />} />
                        <Route path="/projects/:projectId/buildings/:buildingId/units/create" element={<CreateUnit />} />
                        <Route path="/projects/:projectId/buildings/:buildingId/units/:unitId/edit" element={<EditUnit />} />
                        <Route path="/projects/:projectId/buildings/:buildingId" element={<ViewUnit />} />
                        <Route path="/projects/:projectId/buildings/:buildingId/units/:unitId" element={<ViewUnitDetails />} />


                        <Route path="/units-reserve" element={<UnitReserve />} />
                        <Route path="/units-reserve/reserve" element={<ReverseUnit />} />
                        <Route path="/units-reserve/details/:id" element={<UnitDetails />} />
                        <Route path="/units-reserve/details/:id/accept" element={<AcceptUnitSale />} />

                        <Route path="/projects" element={<ViewProjects />} />
                        <Route path="/projects/create" element={<CreateProject />} />
                        <Route path="/projects/edit/:id" element={<EditProject />} />

                        <Route path="/projects/:buildingId" element={<ViewBuildings />} />
                        <Route path="/projects/:projectId/create" element={<CreateBuilding />} />
                        <Route path="/projects/:projectId/edit/:buildingId" element={<EditBuilding />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              }
            />
          </Route>
        </Routes>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </Router>
    </UserProvider>
  );
}

export default App;