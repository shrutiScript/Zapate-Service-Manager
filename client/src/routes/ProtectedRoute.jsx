import React, { useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { AppLoading } from '../components/common/AppLoading.jsx';
import {
  getActiveToken,
  setExpiredNotice,
  broadcastSubscriptionExpired,
  clearActiveSession,
} from '../utils/sessionManager.js';

export const ProtectedRoute = ({ children, adminOnly = false, requiredModule = null }) => {
  const { user, authLoading, isAuthenticated, isAdmin } = useAuth();
  const { isModuleEnabled } = useApp();
  const [location] = useLocation();

  // Instant tab-isolated token check
  const hasToken = typeof window !== 'undefined' && !!getActiveToken();

  useEffect(() => {
    if (!hasToken || (!authLoading && (!user || !isAuthenticated))) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
  }, [hasToken, authLoading, user, isAuthenticated]);

  if (!hasToken) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    return <Redirect to="/login" replace />;
  }

  // 1. If auth is still verifying session with backend, SHOW SECURE LOADING UI
  if (authLoading) {
    return <AppLoading message="Verifying session security..." />;
  }

  // 2. If user is unauthenticated or inactive, redirect cleanly to /login
  if (!user || !isAuthenticated) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    return <Redirect to="/login" replace />;
  }

  // 3. Super Admin Route Control
  if (isAdmin) {
    if (!adminOnly) {
      toast.error('You do not have permission to access this workshop page.', { id: 'role-mismatch' });
      return <Redirect to="/admin/dashboard" replace />;
    }
    return children;
  }

  // 4. Shop Staff / Owner Route Control
  if (adminOnly) {
    toast.error('You do not have permission to access this page.', { id: 'role-mismatch' });
    return <Redirect to="/dashboard" replace />;
  }

  // 5. Subscription Expiry Guard for Workshop Users (Direct URL Protection)
  const shopExpiry = user?.shop?.subscriptionExpiresAt;
  const isStatusExpired = String(user?.shop?.subscriptionStatus || '').toUpperCase() === 'EXPIRED';
  if (!isAdmin && ((shopExpiry && new Date().getTime() >= new Date(shopExpiry).getTime()) || isStatusExpired)) {
    const expiredMsg = 'Your subscription has expired. Please renew your subscription to continue.';
    setExpiredNotice(expiredMsg);
    broadcastSubscriptionExpired({ shopId: user?.shopId || user?.shop?.id, message: expiredMsg });
    clearActiveSession();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    return <Redirect to="/login" replace />;
  }

  // 5. Workshop Module Access Control Guard (Direct URL Protection)
  if (requiredModule && !isModuleEnabled(requiredModule)) {
    toast.error(
      `The '${requiredModule}' module is disabled for your workshop by Platform Admin.`,
      { id: `module-guard-${requiredModule}` }
    );
    return <Redirect to="/dashboard" replace />;
  }

  // First-time owner flow: if onboarding / shop setup is not completed, redirect to /shop-setup
  if (user.role === 'SHOP_OWNER' && !user.onboardingCompleted && location !== '/shop-setup') {
    return <Redirect to="/shop-setup" replace />;
  }

  return children;
};
