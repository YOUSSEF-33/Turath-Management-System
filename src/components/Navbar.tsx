import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, UserCircle, X, Menu, Settings, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  title: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const Navbar = ({ title, isMenuOpen, onMenuToggle }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle search overlay for mobile
  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev);
  }, []);

  // Toggle profile dropdown
  const toggleProfile = useCallback(() => {
    setIsProfileOpen(prev => !prev);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  }, [isNotificationsOpen]);

  // Toggle notifications dropdown
  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(prev => !prev);
    if (isProfileOpen) setIsProfileOpen(false);
  }, [isProfileOpen]);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchTerm);
    setIsSearchOpen(false);
  }, [searchTerm]);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  }, [navigate]);

  return (
    <div className="bg-white shadow-sm fixed w-full top-0 z-20 md:relative">
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-95 z-50 p-4 md:hidden animate-fade-in">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8884d8] focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={toggleSearch}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="إغلاق البحث"
            >
              <X className="h-6 w-6" />
            </button>
          </form>
        </div>
      )}

      {/* Main Navbar Content */}
      <div className="px-4 md:px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left Side: Menu Toggle and Logo */}
          <div className="flex items-center">
            <button
              className="md:hidden p-2 -mr-2 text-gray-700 hover:text-gray-900 transition-colors"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center">
              {/* <img src="/images/output-onlinepngtools.png" alt="Logo" className="h-8 mr-3" /> */}
              <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">{title}</h1>
            </div>
          </div>

          {/* Right Side: Search, Notifications and Profile */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {/* Desktop Search */}
            <div className="hidden md:block w-64 lg:w-80">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8884d8] focus:border-transparent transition-all text-sm"
                />
                <button type="submit" className="absolute left-3 top-2.5">
                  <Search className="h-5 w-5 text-gray-400" />
                </button>
              </form>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={toggleSearch}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="فتح البحث"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Notifications Section */}
            <div ref={notificationsRef} className="relative mx-1">
              <button
                onClick={toggleNotifications}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="الإشعارات"
              >
                <div className="relative">
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </div>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">الإشعارات</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="py-2 px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">تم إضافة وحدة جديدة</p>
                      <p className="text-xs text-gray-500">منذ 5 دقائق</p>
                    </div>
                    <div className="py-2 px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">تم حجز وحدة رقم 301</p>
                      <p className="text-xs text-gray-500">منذ ساعة</p>
                    </div>
                    <div className="py-2 px-4 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">تم تعديل بيانات موظف</p>
                      <p className="text-xs text-gray-500">منذ 3 ساعات</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <button className="text-sm text-[#8884d8] hover:underline w-full text-center">
                      عرض كل الإشعارات
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Section */}
            <div ref={profileRef} className="relative mx-1">
              <button
                onClick={toggleProfile}
                className="flex items-center space-x-2 rtl:space-x-reverse p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="فتح قائمة الملف الشخصي"
              >
                <UserCircle className="h-6 w-6 text-gray-700" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">المستخدم الحالي</p>
                    <p className="text-sm text-gray-500">admin@example.com</p>
                  </div>
                  <div className="py-1">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/settings');
                      }}
                    >
                      <Settings className="h-4 w-4 ml-2" />
                      الإعدادات
                    </button>
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;