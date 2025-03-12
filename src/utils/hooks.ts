import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';

interface ApiGetOptions<T> {
  url: string;
  dependencies?: unknown[];
  skip?: boolean;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface ApiMutationOptions {
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

// Hook for data fetching with loading, error, and data states
export function useApiGet<T = unknown>({
  url,
  dependencies = [],
  skip = false,
  errorMessage = 'حدث خطأ أثناء جلب البيانات',
  onSuccess,
  onError
}: ApiGetOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefetchIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(url);
        const result = response.data.data;
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...dependencies, url, skip, refetchIndex]);

  return { data, loading, error, refetch };
}

// Hook for data mutations (POST, PUT, DELETE)
export function useApiMutation({
  url,
  method,
  onSuccess,
  onError,
  successMessage = 'تمت العملية بنجاح',
  errorMessage = 'حدث خطأ أثناء تنفيذ العملية'
}: ApiMutationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (payload?: unknown) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance({
        url,
        method,
        data: payload
      });

      const result = response.data;
      onSuccess?.(result);
      toast.success(successMessage);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, method, onSuccess, onError, successMessage, errorMessage]);

  return { mutate, loading, error };
}

// Hook for debounced values (useful for search inputs)
export function useDebounce<T>(value: T, delay: number): T {
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
export function useRateLimit(limit: number, interval: number) {
  const [count, setCount] = useState(0);
  const [lastReset, setLastReset] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastReset >= interval) {
        setCount(0);
        setLastReset(Date.now());
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval, lastReset]);

  const canProceed = count < limit;

  const increment = useCallback(() => {
    if (canProceed) {
      setCount(c => c + 1);
      return true;
    }
    return false;
  }, [canProceed]);

  return { canProceed, increment };
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('تم استعادة الاتصال بالإنترنت');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('انقطع الاتصال بالإنترنت');
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