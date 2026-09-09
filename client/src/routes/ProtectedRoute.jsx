import React, { useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLoading } from '../components/common/AppLoading.jsx';
import { getActiveToken } from '../utils/sessionManager.js';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, authLoading, isAuthenticated, isAdmin } = useAuth();
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

  // First-time owner flow: if onboarding / shop setup is not completed, redirect to /shop-setup
  if (user.role === 'SHOP_OWNER' && !user.onboardingCompleted && location !== '/shop-setup') {
    return <Redirect to="/shop-setup" replace />;
  }

  return children;
};

