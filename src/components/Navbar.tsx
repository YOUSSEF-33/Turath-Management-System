import { useState } from 'react';
import { Search, UserCircle, X, Menu } from 'lucide-react';

interface NavbarProps {
  title: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const Navbar = ({ title, isMenuOpen, onMenuToggle }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="bg-gray-50 shadow-sm fixed w-full top-0 z-20 md:relative">
      <div className="px-4 md:px-6 py-4">
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
                onClick={() => setIsSearchOpen(false)}
                className="mr-2 p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Main Navbar Content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="md:hidden p-2 -mr-2 text-gray-700 hover:text-gray-900"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-semibold text-gray-800 mr-2">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            <div className="hidden md:block w-64 lg:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Profile */}
            <div className="flex items-center">
              <span className="hidden sm:block ml-2 text-gray-700"></span>
              <UserCircle className="h-8 w-8 text-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;