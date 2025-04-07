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
}

const PermissionsContext = createContext<PermissionsContextProps | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userInfo } = useUserContext();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (userInfo && userInfo.role && userInfo.role.permissions) {
      console.log("userInfo");
      console.log(userInfo);
      console.log("userInfo.role");
      console.log(userInfo.role);
      console.log("userInfo.role.permissions");
      console.log(userInfo.role.permissions);
      setPermissions(userInfo.role.permissions);
      setUserRole(userInfo.role.name);
    } else {
      setPermissions([]);
      setUserRole(null);
    }
  }, [userInfo]);

  const hasPermission = (permissionName: string) => {
    return permissions.some(permission => permission.name === permissionName);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, userRole }}>
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