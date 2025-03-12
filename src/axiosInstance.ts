import axios from 'axios';
import toast from 'react-hot-toast';

// API base URL - consider moving to environment variables
const baseURL = 'https://knownstate.knownlege.com/api';
const refreshURL = `${baseURL}/refresh`;

// Create an axios instance with default configurations
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Error messages
const ERROR_MESSAGES: Record<number, string> = {
  400: 'طلب غير صالح. يرجى التحقق من البيانات المدخلة.',
  401: 'غير مصرح. يرجى تسجيل الدخول مرة أخرى.',
  403: 'غير مسموح بالوصول إلى هذا المورد.',
  404: 'لم يتم العثور على المورد المطلوب.',
  422: 'البيانات المدخلة غير صالحة. يرجى التحقق منها.',
  500: 'حدث خطأ في الخادم. يرجى المحاولة لاحقًا.',
  503: 'الخدمة غير متوفرة حاليًا. يرجى المحاولة لاحقًا.',
};

// Simple in-memory cache for GET requests
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 60000; // 1 minute cache

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add access token to request if available
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Check cache for GET requests if not specifically asked to skip cache
    if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.skipCache) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponse = apiCache.get(cacheKey);
      
      if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
        // Return cached data instead of making a new request
        config.adapter = () => {
          return Promise.resolve({
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK',
            headers: config.headers,
            config: config
          });
        };
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    // If no response, it's likely a network error
    if (!error.response) {
      toast.error('حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.');
      console.error('Network Error:', error);
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Handle request timeout
    if (error.code === 'ECONNABORTED') {
      toast.error('الطلب استغرق وقتًا أطول من المتوقع. يرجى المحاولة مرة أخرى.');
      return Promise.reject(error);
    }

    // Handle token expiration (401 error)
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const response = await axios.post(refreshURL, { token: refreshToken });
          const { access_token } = response.data;
          
          // Save new token and update headers
          localStorage.setItem('access_token', access_token);
          
          // Set new Authorization header
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          
          // Retry the original request with the new token
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        toast.error('يرجى تسجيل الدخول للمتابعة.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }

    // Show appropriate error message based on status code
    const status = error.response.status;
    const message = ERROR_MESSAGES[status] || 'حدث خطأ. يرجى المحاولة مرة أخرى.';
    
    // Display error message
    toast.error(message);
    
    // Log detailed error information for debugging
    console.error(`API Error ${status}:`, {
      url: originalRequest.url,
      method: originalRequest.method,
      data: error.response.data
    });

    return Promise.reject(error);
  }
);

// Helper function to clear cache
export const clearApiCache = (urlPattern?: string) => {
  if (urlPattern) {
    // Clear specific cache entries that match the pattern
    const keysToDelete: string[] = [];
    apiCache.forEach((_, key) => {
      if (key.includes(urlPattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => apiCache.delete(key));
  } else {
    // Clear entire cache
    apiCache.clear();
  }
};

export default axiosInstance;
