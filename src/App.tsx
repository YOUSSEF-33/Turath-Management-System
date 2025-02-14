import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
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
              <Route path="/units" element={<Units />} />
              <Route path="/units/create" element={<CreateUnit />} />
              <Route path="/units/edit/:id" element={<EditUnit />} />
              <Route path="/units/view/:id" element={<ViewUnit />} />
            </Routes>
          </main>
        </div>
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
      </div>
    </Router>
  );
}

export default App;