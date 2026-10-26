import axios from 'axios';
import {
  getActiveToken,
  clearActiveSession,
  setBlockedNotice,
  setExpiredNotice,
  broadcastSubscriptionExpired,
} from '../utils/sessionManager.js';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token strictly for the current tab
api.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap data and handle HTML index fallback responses
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html'))) {
      return Promise.reject(new Error('API returned HTML SPA index document'));
    }
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isLoginEndpoint = url.includes('/auth/login');

    const respData = error.response?.data;
    const isExpired =
      respData?.isExpired ||
      respData?.subscriptionExpired ||
      String(respData?.message || '').toLowerCase().includes('subscription has expired');

    // If subscription has expired on any protected endpoint, broadcast to all tabs and force logout
    if ((status === 401 || status === 403) && isExpired && !isLoginEndpoint) {
      const expiredMsg =
        respData?.message || 'Your subscription has expired. Please renew your plan to continue.';
      setExpiredNotice(expiredMsg);
      broadcastSubscriptionExpired({ shopId: respData?.shopId, message: expiredMsg });

      clearActiveSession();
      window.dispatchEvent(new Event('auth:unauthorized'));

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
      return Promise.reject(error);
    }

    // If any protected endpoint returns 401 Unauthorized, revoke tab session and force redirect to /login
    if (status === 401 && !isLoginEndpoint) {
      const isBlocked = respData?.isBlocked || String(respData?.message || '').toLowerCase().includes('blocked');
      if (isBlocked) {
        setBlockedNotice('Your workshop account has been blocked by the administrator. Please contact support.');
      }

      clearActiveSession();
      window.dispatchEvent(new Event('auth:unauthorized'));

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    // If 403 Forbidden specifically due to disabled module, dispatch real-time event
    if (status === 403 && error.response?.data?.disabled && error.response?.data?.module) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('module:disabled', {
            detail: {
              module: error.response.data.module,
              message: error.response.data.message,
            },
          })
        );
      }
    }

    const message = error.response?.data?.message || error.message || 'API request failed';
    const customError = new Error(message);
    customError.status = status;
    customError.response = error.response;
    if (error.response?.data) {
      customError.availableStock = error.response.data.availableStock;
      customError.requestedQuantity = error.response.data.requestedQuantity;
      customError.partId = error.response.data.partId;
      customError.partName = error.response.data.partName;
      customError.unitPrice = error.response.data.unitPrice;
      customError.module = error.response.data.module;
      customError.disabled = error.response.data.disabled;
    }
    return Promise.reject(customError);
  }
);

export default api;
