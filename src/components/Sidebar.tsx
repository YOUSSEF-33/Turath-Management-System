import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Home, Hotel } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const menuItems = [
    { path: "/", icon: <LayoutDashboard className="ml-2" />, text: "لوحة التحكم" },
    { path: "/employees", icon: <Users className="ml-2" />, text: "الموظفون" },
  ];

  const unitsItems = [
    { path: "/projects", icon: <Home className="ml-2" />, text: "ادارة المشاريع" },
    { path: "/units-reserve", icon: <Hotel className="ml-2" />, text: "حجز الوحدات" },
  ];

  return (
    <>
      {/* Sidebar/Mobile Menu */}
      <aside
        className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-gray-50 text-gray-800 transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h1 className="text-xl font-bold text-center mb-8">لوحة التحكم</h1>
            <nav className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-600 px-3 my-2">الرئيسية</h2>
              {/* Regular Menu Items */}
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${isActive ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-800"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.text}</span>
                </NavLink>
              ))}

              {/* Units Section with Title */}
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-600 px-3 mb-2 mt-3">الوحدات</h2>
                {unitsItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center mb-2 p-3 rounded-lg transition-colors ${isActive ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-800"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed bg-black bg-opacity-50 z-25 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;