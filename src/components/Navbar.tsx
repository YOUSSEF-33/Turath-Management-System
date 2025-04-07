import { useState, useCallback, useEffect, useRef } from 'react';
import { UserCircle, X, Menu, Settings, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);
dayjs.locale('ar');

interface NavbarProps {
  title: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

interface NotificationData {
  title: string;
  message: string;
  unit_id?: number;
  client_id?: number;
  unit_name?: string | null;
  client_name?: string;
  final_price?: string;
  cancelled_at?: string;
  confirmed_at?: string;
  created_at?: string;
  contentable_id?: number;
  reservation_id?: number;
  contentable_type?: string;
}

interface Notification {
  id: string;
  data: NotificationData;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at: string | null;
  content_type: string;
  content_route: string;
  title: string;
  message: string;
}

const Navbar = ({ title, isMenuOpen, onMenuToggle }: NavbarProps) => {
  // const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.data);
      const unreadNotifications = response.data.data.filter((n: Notification) => !n.is_read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/mark-as-read`);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.patch('/notifications/mark-all-as-read');
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsNotificationsOpen(false);
    navigate(notification.content_route);
  }, [markAsRead, navigate]);

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

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds for both count and list
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Toggle search overlay for mobile
  /*const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev);
  }, []);*/

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
  /*const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false); // Close mobile search overlay
    }
  };*/
  
  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [navigate, logout]);

  // Notification dropdown styles
  const notificationDropdownStyles = `
    absolute 
    left-2
    mt-2 
    w-[calc(100vw-2rem)] 
    md:w-[450px] 
    bg-white 
    rounded-lg 
    shadow-lg 
    border 
    border-gray-200 
    overflow-hidden 
    animate-fade-in
    max-h-[80vh]
  `;

  return (
    <div className="bg-white shadow-sm fixed w-full top-0 z-20 md:relative">
      {/* Mobile Search Overlay */}
      {/*isSearchOpen && (
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
      )*/}

      {/* Main Navbar Content */}
      <div className="px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left Side: Menu Toggle and Logo */}
          <div className="flex items-center">
            <button
              className="md:hidden p-2 -mr-1 text-gray-700 hover:text-gray-900 transition-colors"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center">
              <img src="/images/output-onlinepngtools.png" alt="Logo" className="h-7 mr-2 block md:hidden" />
              <h1 className="text-lg font-semibold text-gray-800 hidden sm:block truncate">{title}</h1>
            </div>
          </div>

          {/* Right Side: Notifications and Profile */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {/* Notifications Section */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={toggleNotifications}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="الإشعارات"
              >
                <div className="relative">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
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
                    <p className="text-sm text-gray-500 truncate">admin@example.com</p>
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

      {/* Notifications Dropdown */}
      {isNotificationsOpen && (
        <div className={notificationDropdownStyles}>
          {/* Header */}
          <div className="sticky top-0 px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white z-10">
            <h3 className="text-base font-medium text-gray-900">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#8884d8] hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-4 text-center text-gray-500">
                لا توجد إشعارات
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      py-3 
                      px-4 
                      hover:bg-gray-50 
                      cursor-pointer 
                      transition-colors
                      ${!notification.is_read ? 'bg-blue-50' : ''}
                    `}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dayjs(notification.created_at).fromNow()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;