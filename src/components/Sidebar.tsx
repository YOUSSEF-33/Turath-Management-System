import React, { useCallback, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  Users, 
  Building, 
  LogOut,
  ChevronDown,
  ChevronUp,
  Home,
  ClipboardList,
  Settings,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { usePermissionsContext } from "../context/PermissionsContext";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar = ({ isOpen, onClose, onCollapse }: SidebarProps) => {
  const { hasPermission } = usePermissionsContext();
  const { logout } = useAuth();
  const [projectsExpanded, setProjectsExpanded] = React.useState(
    location.pathname.includes('/projects')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Notify parent component when sidebar is collapsed/expanded
  useEffect(() => {
    onCollapse?.(isCollapsed);
  }, [isCollapsed, onCollapse]);

  // Simulate permission checking with a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false); // Set loading to false after permissions are checked
    }, 1000); // Simulate a 1-second delay

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  const toggleProjectsMenu = useCallback(() => {
    setProjectsExpanded(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const mainItems = [
    { path: "/reservations", icon: <ClipboardList className="ml-2" />, text: "الحجوزات", permission: "view_reservations" },
  ];
  
  const unitsItems = [
    { 
      path: "/projects", 
      icon: <Building className="ml-2" />, 
      text: "ادارة المشاريع",
      onToggle: toggleProjectsMenu,
      permission: "view_projects",
      isExpandable: true,
      isExpanded: projectsExpanded,
      subItems: [
        { path: "/projects/create", text: "إضافة مشروع جديد", permission: "create_projects" },
      ]
    },
    { 
      path: "/showprice", 
      icon: <Home className="ml-2" />, 
      text: "عرض تفاصيل السعر",
      permission: "view_units"
    },
    { 
      path: "/clients", 
      icon: <Users className="ml-2" />, 
      text: "العملاء",
      permission: "view_clients"
    },
    { 
      path: "/users", 
      icon: <Users className="ml-2" />, 
      text: "المستخدمين", 
      permission: "view_users" 
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
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:fixed top-0 right-0 h-screen bg-white shadow-xl transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-20" : "w-[280px] sm:w-72"}
        `}
      >
        <div className="flex flex-col h-full w-full relative">
          {/* Collapse toggle button */}
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="hidden md:flex absolute right-3 top-6 h-6 w-6 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 z-50"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex-1 flex justify-center">
              {!isCollapsed && (
                <img 
                  src="/images/output-onlinepngtools.png" 
                  alt="Logo" 
                  className="h-10 sm:h-12 transition-all duration-300" 
                />
              )}
            </div>
            <button 
              onClick={onClose}
              className="md:hidden absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6 px-3 sm:px-4">
            <nav className="space-y-1.5 sm:space-y-2 w-full">
              {isLoading ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="animate-spin h-8 w-8 text-[#8884d8]" />
                </div>
              ) : (
                <>
                  {!isCollapsed && (
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 sm:px-3 mb-2 sm:mb-3">الرئيسية</h2>
                  )}
                  {/* Menu Items */}
                  {mainItems.map((item) => (
                    (!item.permission || hasPermission(item.permission)) && (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? "justify-center" : ""} p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition-colors ${
                            isActive 
                              ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium shadow-sm" 
                              : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                          }`
                        }
                        title={isCollapsed ? item.text : undefined}
                      >
                        {item.icon}
                        {!isCollapsed && <span className="truncate">{item.text}</span>}
                      </NavLink>
                    )
                  ))}

                  {/* Units Section */}
                  {!isCollapsed && (
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 sm:px-3 mt-6 sm:mt-8 mb-2 sm:mb-3">الوحدات</h2>
                  )}
                  <div className={`space-y-1.5 sm:space-y-2 w-full ${isCollapsed ? "mt-6" : ""}`}>
                    {unitsItems.map((item) => (
                      (!item.permission || hasPermission(item.permission)) && (
                        <div key={item.path} className="w-full">
                          {item.isExpandable ? (
                            <>
                              <button
                                onClick={item.onToggle}
                                className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} w-full p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition-colors ${
                                  isRouteActive(item.path) || isAnySubItemActive(item.subItems || [])
                                    ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium shadow-sm"
                                    : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                                }`}
                                title={isCollapsed ? item.text : undefined}
                              >
                                <div className="flex items-center min-w-0">
                                  {item.icon}
                                  {!isCollapsed && <span className="truncate">{item.text}</span>}
                                </div>
                                {!isCollapsed && (
                                  item.isExpanded ? (
                                    <ChevronUp className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                  )
                                )}
                              </button>
                              
                              {/* Submenu - Only show when not collapsed */}
                              {item.isExpanded && !isCollapsed && item.subItems && (
                                <div className="mr-6 sm:mr-7 mt-1.5 sm:mt-2 border-r-2 border-gray-200 pr-2 sm:pr-3">
                                  {item.subItems.map(subItem => (
                                    (!subItem.permission || hasPermission(subItem.permission)) && (
                                      <NavLink
                                        key={subItem.path}
                                        to={subItem.path}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                          `flex items-center p-2.5 text-sm rounded-lg mb-1.5 transition-colors ${
                                            isActive
                                              ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium shadow-sm"
                                              : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                                          }`
                                        }
                                      >
                                        <span className="truncate">{subItem.text}</span>
                                      </NavLink>
                                    )
                                  ))}
                                  {item.path === '/projects' && hasPermission('view_projects') && (
                                    <NavLink
                                      to={item.path}
                                      onClick={onClose}
                                      className={({ isActive }) =>
                                        `flex items-center p-2.5 text-sm rounded-lg mb-1.5 transition-colors ${
                                          isActive && location.pathname === item.path
                                            ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium shadow-sm"
                                            : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                                        }`
                                      }
                                    >
                                      <span className="truncate">عرض كل المشاريع</span>
                                    </NavLink>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <NavLink
                              to={item.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `flex items-center ${isCollapsed ? "justify-center" : ""} p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition-colors ${
                                  isActive
                                    ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium shadow-sm" 
                                    : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                                }`
                              }
                              title={isCollapsed ? item.text : undefined}
                            >
                              {item.icon}
                              {!isCollapsed && <span className="truncate">{item.text}</span>}
                            </NavLink>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                  
                  {/* Settings */}
                  {!isCollapsed && (
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 sm:px-3 mt-6 sm:mt-8 mb-2 sm:mb-3">الإعدادات</h2>
                  )}
                  <NavLink
                    to="/settings"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? "justify-center" : ""} p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#8884d8] bg-opacity-10 text-[#8884d8] font-medium shadow-sm" 
                          : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                      }`
                    }
                    title={isCollapsed ? "الإعدادات" : undefined}
                  >
                    <Settings className="ml-2 shrink-0" />
                    {!isCollapsed && <span className="truncate">الإعدادات</span>}
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className="p-3 sm:p-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? "justify-center" : ""} w-full p-2.5 sm:p-3 text-sm sm:text-base rounded-lg text-red-600 hover:bg-red-50`}
              title={isCollapsed ? "تسجيل الخروج" : undefined}
            >
              <LogOut className="ml-2" />
              {!isCollapsed && <span className="truncate">تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;