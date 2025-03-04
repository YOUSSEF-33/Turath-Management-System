import React, { createContext, useState, useContext, useEffect } from 'react';

interface UserContextProps {
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: any;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setUserInfo: (info: any) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedAccessToken) setAccessTokenState(storedAccessToken);
    if (storedRefreshToken) setRefreshTokenState(storedRefreshToken);
  }, []);

  const setAccessToken = (token: string) => {
    setAccessTokenState(token);
    localStorage.setItem('access_token', token);
  };

  const setRefreshToken = (token: string) => {
    setRefreshTokenState(token);
    localStorage.setItem('refresh_token', token);
  };

  return (
    <UserContext.Provider value={{ accessToken, refreshToken, userInfo, setAccessToken, setRefreshToken, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};