import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserContext } from './UserContext';

interface Permission {
  id: number;
  name: string;
}

interface PermissionsContextProps {
  permissions: Permission[];
  hasPermission: (permissionName: string) => boolean;
  userRole: string | null;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextProps | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userInfo } = useUserContext();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userInfo) {
      if (userInfo.role && userInfo.role.permissions) {
        setPermissions(userInfo.role.permissions);
        setUserRole(userInfo.role.name);
      } else {
        setPermissions([]);
        setUserRole(null);
      }
      setIsLoading(false);
    }
  }, [userInfo]);

  const hasPermission = (permissionName: string) => {
    return permissions.some(permission => permission.name === permissionName);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, userRole, isLoading }}>
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