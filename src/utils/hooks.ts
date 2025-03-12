import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance, { clearApiCache } from '../axiosInstance';
import toast from 'react-hot-toast';

// Hook for data fetching with loading, error, and data states
export function useApiGet<T>(url: string, initialData?: T, options?: {
  dependencies?: unknown[],
  skip?: boolean,
  withCache?: boolean,
  errorMessage?: string
}) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const deps = options?.dependencies || [];
  const errorMessage = options?.errorMessage || 'حدث خطأ أثناء تحميل البيانات';
  
  // Function to trigger a refetch
  const refetch = useCallback(() => {
    setRefetchIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Skip fetch if skip option is true
    if (options?.skip) {
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const params = options?.withCache ? undefined : { skipCache: true };
        const response = await axiosInstance.get(url, { params });
        
        setData(response.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err as Error);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, url, refetchIndex]);

  return { data, loading, error, refetch };
}

// Hook for data mutations (POST, PUT, DELETE)
export function useApiMutation<T, S>(
  method: 'post' | 'put' | 'delete',
  successMessage: string = 'تمت العملية بنجاح',
  errorMessage: string = 'حدث خطأ أثناء تنفيذ العملية'
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (url: string, payload?: S, clearCachePattern?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = method === 'delete'
        ? await axiosInstance.delete(url)
        : await axiosInstance[method](url, payload);
      
      setData(response.data);
      toast.success(successMessage);
      
      // Clear cache if a pattern is provided
      if (clearCachePattern) {
        clearApiCache(clearCachePattern);
      }
      
      return response.data;
    } catch (err) {
      console.error(`Error in ${method} request:`, err);
      setError(err as Error);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [method, successMessage, errorMessage]);

  return { mutate, loading, error, data };
}

// Hook for debounced values (useful for search inputs)
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for preventing rapid multiple submissions (form submits, button clicks)
export function useRateLimit(limit: number = 1000) {
  const [isLimited, setIsLimited] = useState(false);
  const lastActionTime = useRef<number>(0);

  const checkAndExecute = useCallback((callback: () => void) => {
    const now = Date.now();
    
    if (now - lastActionTime.current > limit) {
      lastActionTime.current = now;
      callback();
      return true;
    } else {
      setIsLimited(true);
      
      // Reset the limited state after the rate limit period
      setTimeout(() => {
        setIsLimited(false);
      }, limit);
      
      return false;
    }
  }, [limit]);

  return { isLimited, checkAndExecute };
}

// Hook for handling scroll position to improve performance
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const handleScroll = useCallback(() => {
    const position = window.scrollY;
    setScrollPosition(position);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return scrollPosition;
}

// Hook to detect if the app is online
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('أنت غير متصل بالإنترنت حاليًا');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
} 