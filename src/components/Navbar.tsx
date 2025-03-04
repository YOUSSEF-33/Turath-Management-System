import { useState, useCallback } from 'react';
import { Search, UserCircle, X, Menu, ChevronDown, Settings, LogOut } from 'lucide-react';

interface NavbarProps {
  title: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const Navbar = ({ title, isMenuOpen, onMenuToggle }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Toggle search overlay for mobile
  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  // Toggle profile dropdown
  const toggleProfile = useCallback(() => {
    setIsProfileOpen((prev) => !prev);
  }, []);

  return (
    <div className="bg-white shadow-sm fixed w-full top-0 z-20 md:relative">
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50 p-4 md:hidden">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="بحث..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={toggleSearch}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="إغلاق البحث"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar Content */}
      <div className="px-4 md:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left Side: Menu Toggle and Title */}
          <div className="flex items-center">
            <button
              className="md:hidden p-2 -mr-2 text-gray-700 hover:text-gray-900 transition-colors"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="hidden md:inline text-xl font-semibold text-gray-800 mr-2">{title}</h1>
          </div>

          {/* Right Side: Search and Profile */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            <div className="hidden mx-2 md:block w-64 lg:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={toggleSearch}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="فتح البحث"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Profile Section */}
            <div className="relative mx-2">
              <button
                onClick={toggleProfile}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="فتح قائمة الملف الشخصي"
              >
                <UserCircle className="h-8 w-8 text-gray-700" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="py-2">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        // Handle settings click
                        setIsProfileOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      الإعدادات
                    </button>
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        // Handle logout click
                        setIsProfileOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
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