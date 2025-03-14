import React, { useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Building, 
  LogOut,
  ChevronDown,
  ChevronUp,
  PlusSquare,
  Home,
  ClipboardList
} from "lucide-react";
import { useUserContext } from '../context/UserContext';
import { usePermissionsContext } from "../context/PermissionsContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { hasPermission } = usePermissionsContext();
  const [projectsExpanded, setProjectsExpanded] = React.useState(
    location.pathname.includes('/projects')
  );

  const toggleProjectsMenu = useCallback(() => {
    setProjectsExpanded(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }, []);

  const mainItems = [
    { path: "/", icon: <LayoutDashboard className="ml-2" />, text: "لوحة التحكم"},
    { path: "/users", icon: <Users className="ml-2" />, text: "المستخدمين", permission: "view_users" },
  ];

  const unitsItems = [
    { 
      path: "/projects", 
      icon: <Building className="ml-2" />, 
      text: "ادارة المشاريع",
      onToggle: toggleProjectsMenu,
      permission: "view_projects",
      subItems: [
        { path: "/projects/create", icon: <PlusSquare className="ml-2" />, text: "إضافة مشروع جديد", permission: "create_projects" },
      ]
    },
    { 
      path: "/units-reserve", 
      icon: <ClipboardList className="ml-2" />, 
      text: "حجز الوحدات",
      permission: "view_reservations"
    },
    { 
      path: "/clients", 
      icon: <Users className="ml-2" />, 
      text: "العملاء",
      permission: "view_clients"
    },
  ];

  // Check if the current route is active (for main routes and sub-routes)
  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Check if any sub-item is active
  const isAnySubItemActive = (subItems: { path: string, text: string }[]) => {
    return subItems.some(item => location.pathname === item.path);
  };

  return (
    <>
      {/* Sidebar/Mobile Menu */}
      <aside
        className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-white shadow-lg text-gray-800 transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <img src="/images/output-onlinepngtools.png" alt="Logo" className="h-10" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">الرئيسية</h2>
              {/* Regular Menu Items */}
              {mainItems.map((item) => (
                (!item.permission || hasPermission(item.permission)) && (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium" 
                          : "hover:bg-gray-100 text-gray-700"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </NavLink>
                )
              ))}

              {/* Units Section */}
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mt-6 mb-2">الوحدات</h2>
              {unitsItems.map((item) => (
                (!item.permission || hasPermission(item.permission)) && (
                  <div key={item.path} className="mb-1">
                    {item.isExpandable ? (
                      <>
                        <button
                          onClick={item.onToggle}
                          className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
                            isRouteActive(item.path) || isAnySubItemActive(item.subItems || [])
                              ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center">
                            {item.icon}
                            <span>{item.text}</span>
                          </div>
                          {item.isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        
                        {/* Submenu */}
                        {item.isExpanded && item.subItems && (
                          <div className="mr-7 mt-1 border-r-2 border-gray-200 pr-3">
                            {item.subItems.map(subItem => (
                              (!subItem.permission || hasPermission(subItem.permission)) && (
                                <NavLink
                                  key={subItem.path}
                                  to={subItem.path}
                                  onClick={onClose}
                                  className={({ isActive }) =>
                                    `flex items-center p-2 text-sm rounded-lg mb-1 transition-colors ${
                                      isActive
                                        ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`
                                  }
                                >
                                  <span>{subItem.text}</span>
                                </NavLink>
                              )
                            ))}
                            <NavLink
                              to={item.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `flex items-center p-2 text-sm rounded-lg mb-1 transition-colors ${
                                  isActive && location.pathname === item.path
                                    ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium"
                                    : "hover:bg-gray-100 text-gray-700"
                                }`
                              }
                            >
                              <span>عرض كل المشاريع</span>
                            </NavLink>
                          </div>
                        )}
                      </>
                    ) : (
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center p-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium" 
                              : "hover:bg-gray-100 text-gray-700"
                          }`
                        }
                      >
                        {item.icon}
                        <span>{item.text}</span>
                      </NavLink>
                    )}
                  </div>
                )
              ))}
              
              {/* Settings */}
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mt-6 mb-2">الإعدادات</h2>
                <NavLink
                  to="/settings"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium" 
                        : "hover:bg-gray-100 text-gray-700"
                    }`
                  }
                >
                  <Settings className="ml-2" />
                  <span>الإعدادات</span>
                </NavLink>
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center p-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="ml-2" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;