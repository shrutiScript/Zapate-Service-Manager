import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user, isAdmin, currentShop, shopName } = useAuth();
  const [enabledModules, setEnabledModules] = useState(() => {
    return (
      user?.enabledModules || [
        'customers',
        'repairs',
        'devices',
        'technicians',
        'pos',
        'payments',
        'inventory',
        'suppliers',
        'purchases',
        'used-mobiles',
        'reports',
        'settings',
        'users',
      ]
    );
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync modules from shop when user changes
  useEffect(() => {
    if (user?.enabledModules) {
      setEnabledModules(user.enabledModules);
    }
  }, [user]);

  const isModuleEnabled = (moduleKey) => {
    if (isAdmin) return true; // Super admin has access to everything
    return enabledModules.includes(moduleKey);
  };

  return (
    <AppContext.Provider
      value={{
        enabledModules,
        setEnabledModules,
        isModuleEnabled,
        searchQuery,
        setSearchQuery,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        currentShop,
        shopName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
