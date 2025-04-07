import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  nbf: number;
  prv: string;
  sub: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const getUserIdFromToken = (token: string): string | null => {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.sub;
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  };

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
        setUserId(getUserIdFromToken(token));
      } else if (token) {
        // Token exists but is expired
        console.log('Access token is expired');
        // We should handle refresh token logic here, but for now just consider not authenticated
        setIsAuthenticated(false);
        setUserId(null);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
      }
      setIsLoading(false);
    };
    
    checkAuth();

    // Add event listener for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue && !isTokenExpired(e.newValue)) {
          setIsAuthenticated(true);
          setUserId(getUserIdFromToken(e.newValue));
        } else {
          setIsAuthenticated(false);
          setUserId(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setIsAuthenticated(true);
    setUserId(getUserIdFromToken(accessToken));
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 