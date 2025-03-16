import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Role {
  id: number;
  name: string;
  readable_name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role: Role;
}

interface UserContextProps {
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: User | null;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setUserInfo: (info: User) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userInfo, setUserInfoState] = useState<User | null>(null);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedAccessToken) setAccessTokenState(storedAccessToken);
    if (storedRefreshToken) setRefreshTokenState(storedRefreshToken);
    if (storedUserInfo) setUserInfoState(JSON.parse(storedUserInfo));
  }, []);

  const setAccessToken = (token: string) => {
    setAccessTokenState(token);
    localStorage.setItem('access_token', token);
  };

  const setRefreshToken = (token: string) => {
    setRefreshTokenState(token);
    localStorage.setItem('refresh_token', token);
  };

  const setUserInfo = (info: User) => {
    setUserInfoState(info);
    localStorage.setItem('user_info', JSON.stringify(info));
  };

  const getUserInfo = () => {
        return userInfo;
  };

  return (
    <UserContext.Provider value={{ accessToken, refreshToken, userInfo, setAccessToken, setRefreshToken, setUserInfo, getUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context
};