import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import { useUserContext } from './UserContext';

interface Permission {
  id: number;
  name: string;
}

interface PermissionsContextProps {
  permissions: Permission[];
  hasPermission: (permissionName: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextProps | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userInfo } = useUserContext();
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (userInfo) {
        try {
          const response = await axiosInstance.get(`/roles/${userInfo.role.id}`);
          setPermissions(response.data.data.permissions);
        } catch (error) {
          console.error('Error fetching permissions:', error);
        }
      }
    };

    fetchPermissions();
  }, [userInfo]);

  const hasPermission = (permissionName: string) => {
    return permissions.some(permission => permission.name === permissionName);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
};