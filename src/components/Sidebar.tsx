import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Home } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const menuItems = [
    { path: "/", icon: <LayoutDashboard className="ml-2" />, text: "الرئيسية" },
    { path: "/employees", icon: <Users className="ml-2" />, text: "الموظفون" },
    { path: "/units", icon: <Home className="ml-2" />, text: "الوحدات" },
  ];

  return (
    <>
      {/* Sidebar/Mobile Menu */}
      <aside
        className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h1 className="text-xl font-bold text-center mb-8">لوحة التحكم</h1>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive ? "bg-gray-800" : "hover:bg-gray-800"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-25 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;