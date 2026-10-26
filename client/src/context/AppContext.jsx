import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';

const AppContext = createContext();

const ALL_DEFAULT_MODULES = [
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
  'warranties',
  'community',
  'notifications',
];

export const AppProvider = ({ children }) => {
  const { user, isAdmin, currentShop, shopName } = useAuth();
  const [enabledModules, setEnabledModules] = useState(() => {
    return Array.isArray(user?.enabledModules) && user.enabledModules.length > 0
      ? user.enabledModules
      : ALL_DEFAULT_MODULES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync modules from shop when user changes
  useEffect(() => {
    if (user?.enabledModules && Array.isArray(user.enabledModules)) {
      setEnabledModules(user.enabledModules);
    }
  }, [user]);

  // Real-time synchronization when API returns 403 due to disabled module
  useEffect(() => {
    const handleModuleDisabled = (event) => {
      const disabledKey = event.detail?.module;
      if (disabledKey) {
        setEnabledModules((prev) => prev.filter((m) => m !== disabledKey));
      }
    };

    window.addEventListener('module:disabled', handleModuleDisabled);
    return () => window.removeEventListener('module:disabled', handleModuleDisabled);
  }, []);

  const refreshModules = useCallback(async () => {
    try {
      if (user?.shopId) {
        const data = await api.get('/auth/me');
        if (data?.enabledModules) {
          setEnabledModules(data.enabledModules);
        }
      }
    } catch {
      // Ignored
    }
  }, [user?.shopId]);

  const isModuleEnabled = useCallback(
    (moduleKey) => {
      if (isAdmin) return true; // Super admin has universal access
      if (!moduleKey) return true;
      return enabledModules.includes(moduleKey);
    },
    [isAdmin, enabledModules]
  );

  return (
    <AppContext.Provider
      value={{
        enabledModules,
        setEnabledModules,
        isModuleEnabled,
        refreshModules,
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
