import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import {
  getActiveToken,
  getActiveUser,
  getActiveShop,
  setActiveSession,
  clearActiveSession,
} from '../utils/sessionManager.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Always derive from tab-isolated session storage
  const [user, setUser] = useState(() => getActiveUser());
  const [currentShop, setCurrentShop] = useState(() => getActiveShop());
  const [token, setToken] = useState(() => getActiveToken());
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(() => !!getActiveToken());

  // Helper to test if user account status is ACTIVE (case-insensitive)
  const isStatusActive = (statusVal) => {
    if (!statusVal) return false;
    return String(statusVal).trim().toUpperCase() === 'ACTIVE';
  };

  // Restore and verify latest authenticated user and shop from MongoDB on app mount / refresh
  const refreshUser = useCallback(async () => {
    const activeTok = getActiveToken();
    if (!activeTok) {
      clearActiveSession();
      setUser(null);
      setCurrentShop(null);
      setToken(null);
      setAuthLoading(false);
      return null;
    }

    setAuthLoading(true);
    try {
      // Call backend to verify session / cookie / bearer token
      const res = await api.get('/auth/me');
      const verifiedUser = res?.data || res;

      if (verifiedUser && verifiedUser.id && isStatusActive(verifiedUser.status)) {
        const normalized = {
          ...verifiedUser,
          status: (verifiedUser.status || 'ACTIVE').toUpperCase(),
        };
        const shop = normalized.shop || null;
        setUser(normalized);
        setCurrentShop(shop);
        setToken(activeTok);

        // Safely persist tab-scoped session
        setActiveSession(activeTok, normalized, shop);
        return normalized;
      } else {
        // Inactive or invalid response
        clearActiveSession();
        setUser(null);
        setCurrentShop(null);
        setToken(null);
        return null;
      }
    } catch (err) {
      // Session invalid, expired, revoked, or no cookie/token
      clearActiveSession();
      setUser(null);
      setCurrentShop(null);
      setToken(null);
      return null;
    } finally {
      // Only set authLoading = false after the request finishes
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Global listeners for 401 Unauthorized and Browser Back / Forward Cache protection
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setCurrentShop(null);
      setToken(null);
      setAuthLoading(false);
    };

    const handlePageShow = () => {
      const hasToken = !!getActiveToken();
      const isPublicPath =
        window.location.pathname === '/' ||
        window.location.pathname === '/home' ||
        window.location.pathname === '/landing' ||
        window.location.pathname === '/about' ||
        window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/forgot-password' ||
        window.location.pathname === '/reset-password';

      if (!hasToken && !isPublicPath) {
        setUser(null);
        setToken(null);
        setCurrentShop(null);
        window.location.replace('/login');
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePageShow);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePageShow);
    };
  }, []);

  const updateCurrentShop = useCallback((shopData) => {
    if (!shopData) return;

    let mergedShop = null;
    setCurrentShop((prev) => {
      mergedShop = { ...prev, ...shopData };
      return mergedShop;
    });

    let updatedUser = null;
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      updatedUser = {
        ...prevUser,
        shopName: shopData.name || shopData.shopName || prevUser.shopName,
        shop: { ...(prevUser.shop || {}), ...shopData },
      };
      return updatedUser;
    });

    // Safely sync to tab session storage OUTSIDE state updaters
    try {
      const activeTok = getActiveToken();
      if (activeTok && updatedUser) {
        setActiveSession(activeTok, updatedUser, mergedShop);
      }
    } catch (e) {
      console.warn('[AuthContext] Error updating local cache:', e);
    }
  }, []);

  const login = async (identifier, password) => {
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { identifier, password });
      const authData = res?.data || res;

      if (authData && authData.token && authData.user) {
        const normalizedUser = {
          ...authData.user,
          status: (authData.user.status || 'ACTIVE').toUpperCase(),
        };
        const shop = normalizedUser.shop || null;
        setToken(authData.token);
        setUser(normalizedUser);
        setCurrentShop(shop);

        // Store tab-isolated session and register role
        setActiveSession(authData.token, normalizedUser, shop);
        return normalizedUser;
      }
      throw new Error('Invalid authentication response from server.');
    } catch (err) {
      const responseData = err.response?.data;
      const serverMsg = responseData?.message || err.message || 'Authentication failed.';
      throw new Error(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      return res?.data || res;
    } catch (err) {
      const responseData = err.response?.data;
      const serverMsg = responseData?.message || err.message || 'Registration failed';
      const customErr = new Error(serverMsg);
      customErr.isDuplicate = responseData?.isDuplicate || serverMsg.toLowerCase().includes('already exists') || serverMsg.toLowerCase().includes('already registered');
      customErr.duplicateField = responseData?.duplicateField || (serverMsg.toLowerCase().includes('mobile') ? 'mobile' : 'email');
      customErr.existingValue = responseData?.existingValue || (customErr.duplicateField === 'mobile' ? formData.mobile : formData.email);
      throw customErr;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } catch (e) {}
    clearActiveSession();
    setToken(null);
    setUser(null);
    setCurrentShop(null);
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  const activeShopName = currentShop?.name || user?.shopName || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        currentShop,
        shop: currentShop,
        shopName: activeShopName,
        token,
        isAuthenticated: !!user && isStatusActive(user.status),
        isAdmin: user?.role === 'SUPER_ADMIN',
        isLoading,
        authLoading,
        isInitializing: authLoading,
        login,
        register,
        logout,
        refreshUser,
        updateCurrentShop,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
