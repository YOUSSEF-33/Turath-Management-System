import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Employees from './pages/Employees';
import Units from './pages/Units';
import CreateEmployee from './pages/employees/CreateEmployee';
import EditEmployee from './pages/employees/EditEmployee';
import ViewEmployee from './pages/employees/ViewEmployee';
import CreateUnit from './pages/units/CreateUnit';
import EditUnit from './pages/units/EditUnit';
import ViewUnit from './pages/units/ViewUnit';
import UnitReserve from './pages/unitsReserve/UnitsReserve';
import ReserveUnit from './pages/unitsReserve/ReserveUnit';
import LoginPage from './pages/login/Login';
import ViewProjects from './pages/projects/ViewProjects';
import CreateProject from './pages/projects/CreateProject';
import EditProject from './pages/projects/EditProject';
import ViewBuildings from './pages/buildings/ViewBuildings';
import CreateBuilding from './pages/buildings/CreateBuilding';
import EditBuilding from './pages/buildings/EditBuilding';
import ViewUnitDetails from './pages/units/ViewUnitDetails';
import ReservationDetails from './pages/unitsReserve/ReservationDetails';
import ViewUsers from './pages/users/ViewUsers';
import CreateUser from './pages/users/CreateUser';
import EditUser from './pages/users/EditUser';
import ViewUser from './pages/users/ViewUser';
import { PermissionsProvider, usePermissionsContext } from './context/PermissionsContext';
import ViewClients from './pages/clients/ViewClients';
import ViewClient from './pages/clients/ViewClient';
import { UserProvider } from './context/UserContext';
import Settings from './pages/settings/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ShowPrice from './pages/unitsReserve/ShowPrice';
import SearchResults from './pages/search/SearchResults';
import InstallmentsBreakdown from './pages/unitsReserve/InstallmentsBreakdown';

// Protected Route wrapper component
const ProtectedRoute = ({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissionsContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isPermissionsLoading) {
    return <LoadingSpinner />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

// Layout component for protected routes
const ProtectedLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Overlay for mobile menu */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Improved mobile positioning */}
      <div 
        className={`fixed top-0 bottom-0 right-0 w-[280px] xs:w-[320px] z-50 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}
      >
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)}
        />
      </div>

      {/* Main content wrapper with improved mobile spacing */}
      <div className={`flex flex-col min-h-screen transition-all duration-300
        ${isSidebarCollapsed ? "lg:mr-20" : "lg:mr-72"}`}
      >
        {/* Navbar with better mobile handling */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <Navbar
            title=""
            isMenuOpen={isSidebarOpen}
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </div>

        {/* Main content area with responsive padding */}
        <main className="flex-1 p-3 xs:p-4 lg:p-6 mt-2">
          <div className="w-full mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-3 xs:p-4 lg:p-6 overflow-x-hidden">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Responsive footer spacing */}
        <div className="h-4 xs:h-6 lg:h-8" />
      </div>
    </div>
  );
};

// Main app content component
function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UnitReserve />} />
          <Route path="users" element={<ProtectedRoute requiredPermission="view_users"><ViewUsers /></ProtectedRoute>} />
          <Route path="users/create" element={<ProtectedRoute requiredPermission="create_users"><CreateUser /></ProtectedRoute>} />
          <Route path="users/edit/:id" element={<ProtectedRoute requiredPermission="edit_users"><EditUser /></ProtectedRoute>} />
          <Route path="users/:id" element={<ProtectedRoute requiredPermission="view_users"><ViewUser /></ProtectedRoute>} />
          <Route path="employees" element={<ProtectedRoute requiredPermission="view_employees"><Employees /></ProtectedRoute>} />
          <Route path="employees/create" element={<ProtectedRoute requiredPermission="create_employees"><CreateEmployee /></ProtectedRoute>} />
          <Route path="employees/edit/:id" element={<ProtectedRoute requiredPermission="edit_employees"><EditEmployee /></ProtectedRoute>} />
          <Route path="employees/view/:id" element={<ProtectedRoute requiredPermission="view_employees"><ViewEmployee /></ProtectedRoute>} />
          <Route path="units" element={<ProtectedRoute requiredPermission="view_units"><Units /></ProtectedRoute>} />
          <Route path="projects/:projectId/buildings/:buildingId/units/create" element={<ProtectedRoute requiredPermission="create_units"><CreateUnit /></ProtectedRoute>} />
          <Route path="projects/:projectId/buildings/:buildingId/units/:unitId/edit" element={<ProtectedRoute requiredPermission="edit_units"><EditUnit /></ProtectedRoute>} />
          <Route path="projects/:projectId/buildings/:buildingId" element={<ProtectedRoute requiredPermission="view_units"><ViewUnit /></ProtectedRoute>} />
          <Route path="projects/:projectId/buildings/:buildingId/units/:unitId" element={<ProtectedRoute requiredPermission="view_units"><ViewUnitDetails /></ProtectedRoute>} />
          <Route path="reservations" element={<ProtectedRoute requiredPermission="view_reservations"><UnitReserve /></ProtectedRoute>} />
          <Route path="reservations/reserve" element={<ProtectedRoute requiredPermission="create_reservations"><ReserveUnit /></ProtectedRoute>} />
          <Route path="reservations/:id" element={<ProtectedRoute requiredPermission="view_reservations"><ReservationDetails /></ProtectedRoute>} />
          <Route path="reservations/:id/installments-breakdown" element={<ProtectedRoute requiredPermission="confirm_reservations"><InstallmentsBreakdown /></ProtectedRoute>} />
          <Route path="showprice" element={<ProtectedRoute requiredPermission="view_units"><ShowPrice /></ProtectedRoute>} />
          <Route path="projects" element={<ProtectedRoute requiredPermission="view_projects"><ViewProjects /></ProtectedRoute>} />
          <Route path="projects/create" element={<ProtectedRoute requiredPermission="create_projects"><CreateProject /></ProtectedRoute>} />
          <Route path="projects/edit/:id" element={<ProtectedRoute requiredPermission="edit_projects"><EditProject /></ProtectedRoute>} />
          <Route path="projects/:buildingId" element={<ProtectedRoute requiredPermission="view_buildings"><ViewBuildings /></ProtectedRoute>} />
          <Route path="projects/:projectId/create" element={<ProtectedRoute requiredPermission="create_buildings"><CreateBuilding /></ProtectedRoute>} />
          <Route path="projects/:projectId/edit/:buildingId" element={<ProtectedRoute requiredPermission="edit_buildings"><EditBuilding /></ProtectedRoute>} />
          <Route path="clients" element={<ProtectedRoute requiredPermission="view_clients"><ViewClients /></ProtectedRoute>} />
          <Route path="clients/:id" element={<ProtectedRoute requiredPermission="view_clients"><ViewClient /></ProtectedRoute>} />
          <Route path="settings" element={<Settings />} />
          <Route path="search" element={<SearchResults />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
  );
}

// Main App component with providers
function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <PermissionsProvider>
          <AppContent />
        </PermissionsProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;