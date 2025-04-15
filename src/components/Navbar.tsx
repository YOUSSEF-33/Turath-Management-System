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
  isSidebarCollapsed?: boolean;
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

const Navbar = ({ title, isMenuOpen, onMenuToggle, isSidebarCollapsed }: NavbarProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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

  // Close dropdowns when clicking outside
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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Adjust dropdown position to stay within viewport
  useEffect(() => {
    const adjustDropdownPosition = () => {
      if (isNotificationsOpen && notificationsRef.current) {
        const dropdown = notificationsRef.current.querySelector('.notifications-dropdown') as HTMLElement;
        if (dropdown) {
          const viewportWidth = window.innerWidth;
          const dropdownRect = dropdown.getBoundingClientRect();
          const buttonRect = notificationsRef.current.getBoundingClientRect();

          if (viewportWidth < 640) { // mobile screens
            dropdown.style.right = '0px';
            dropdown.style.left = '0px';
            dropdown.style.width = 'calc(100vw - 2rem)';
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${buttonRect.bottom + 8}px`; // 8px gap
          } else {
            dropdown.style.position = 'absolute';
            dropdown.style.right = 'auto';
            dropdown.style.left = '0';
            dropdown.style.top = '100%';
            dropdown.style.width = '450px';
          }
        }
      }

      if (isProfileOpen && profileRef.current) {
        const dropdown = profileRef.current.querySelector('.profile-dropdown') as HTMLElement;
        if (dropdown) {
          const rect = dropdown.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          if (rect.right > viewportWidth) {
            dropdown.style.right = '0';
            dropdown.style.left = 'auto';
          } else {
            dropdown.style.right = 'auto';
            dropdown.style.left = '0';
          }
        }
      }
    };

    adjustDropdownPosition();
    window.addEventListener('resize', adjustDropdownPosition);
    return () => window.removeEventListener('resize', adjustDropdownPosition);
  }, [isNotificationsOpen, isProfileOpen]);

  const toggleProfile = useCallback(() => {
    setIsProfileOpen(prev => !prev);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  }, [isNotificationsOpen]);

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(prev => !prev);
    if (isProfileOpen) setIsProfileOpen(false);
  }, [isProfileOpen]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [navigate, logout]);

  return (
    <nav className="px-4 lg:px-6 py-3 flex items-center justify-between bg-white border-b">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div ref={notificationsRef} className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative"
            aria-label="الإشعارات"
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>

          {isNotificationsOpen && (
            <div 
              className="notifications-dropdown absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              style={{
                maxHeight: 'calc(100vh - 80px)',
                width: '320px',
                right: '-8px'
              }}
            >
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

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
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

        <div ref={profileRef} className="relative">
          <button
            onClick={toggleProfile}
            className="flex items-center p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="فتح قائمة الملف الشخصي"
          >
            <UserCircle className="h-5 w-5 text-gray-700" />
          </button>

          {isProfileOpen && (
            <div 
              className="profile-dropdown absolute mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              style={{
                right: '-8px'
              }}
            >
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
    </nav>
  );
};

export default Navbar;