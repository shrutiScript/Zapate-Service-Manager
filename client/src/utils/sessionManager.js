/**
 * Tab-Isolated Authentication Session Manager
 * 
 * Enforces strict per-tab session lifecycle using sessionStorage exclusively:
 * - Sessions persist during page refresh and internal navigation within the same tab.
 * - Sessions are automatically destroyed when the tab is closed.
 * - New tabs open with zero restored credentials and require a fresh login.
 * - No persistent authentication data is stored in localStorage.
 */

import { sanitizeForStorage } from './storage.js';

const KEY_TOKEN = 'rf_auth_token';
const KEY_USER = 'rf_auth_user';
const KEY_SHOP = 'rf_current_shop';
const KEY_BLOCKED_NOTICE = 'rf_blocked_notice';

// Preemptively purge any legacy persistent auth keys from localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('rf_auth_token');
    localStorage.removeItem('rf_auth_user');
    localStorage.removeItem('rf_current_shop');
    localStorage.removeItem('rf_session_SUPER_ADMIN');
    localStorage.removeItem('rf_session_SHOP_OWNER');
  } catch (_) {}
}

/**
 * Retrieves the active JWT token for the current tab.
 * Strictly checks the current tab's isolated sessionStorage.
 * Returns null if the current tab has no active session.
 */
export const getActiveToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(KEY_TOKEN) || null;
  } catch (_) {
    return null;
  }
};

/**
 * Retrieves the cached user object for the current tab.
 */
export const getActiveUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Retrieves the cached shop object for the current tab.
 */
export const getActiveShop = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY_SHOP);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Stores the authenticated session for the current tab in sessionStorage ONLY.
 * Never writes persistent authentication data to localStorage.
 */
export const setActiveSession = (token, user, shop = null) => {
  if (typeof window === 'undefined') return;

  if (!token) {
    clearActiveSession();
    return;
  }

  const sanitizedUser = sanitizeForStorage(user);
  const sanitizedShop = shop ? sanitizeForStorage(shop) : (sanitizedUser?.shop || null);

  try {
    sessionStorage.setItem(KEY_TOKEN, token);
    if (sanitizedUser) {
      sessionStorage.setItem(KEY_USER, JSON.stringify(sanitizedUser));
    } else {
      sessionStorage.removeItem(KEY_USER);
    }
    if (sanitizedShop) {
      sessionStorage.setItem(KEY_SHOP, JSON.stringify(sanitizedShop));
    } else {
      sessionStorage.removeItem(KEY_SHOP);
    }
  } catch (e) {
    console.warn('[SessionManager] Could not write to sessionStorage:', e);
  }
};

/**
 * Clears the active tab's session from sessionStorage.
 * Also scrubs any remnant auth keys from localStorage.
 */
export const clearActiveSession = () => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(KEY_TOKEN);
    sessionStorage.removeItem(KEY_USER);
    sessionStorage.removeItem(KEY_SHOP);
  } catch (_) {}

  try {
    localStorage.removeItem('rf_auth_token');
    localStorage.removeItem('rf_auth_user');
    localStorage.removeItem('rf_current_shop');
    localStorage.removeItem('rf_session_SUPER_ADMIN');
    localStorage.removeItem('rf_session_SHOP_OWNER');
  } catch (_) {}
};

const KEY_EXPIRED_NOTICE = 'rf_expired_notice';

// Multi-tab BroadcastChannel for instant cross-tab security events
export const authChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('rf_auth_events')
    : null;

/**
 * Stores a blocked account notification banner to be displayed on the login page.
 */
export const setBlockedNotice = (msg) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      KEY_BLOCKED_NOTICE,
      msg || 'Your workshop account has been blocked by the administrator. Please contact support.'
    );
  } catch (_) {}
};

/**
 * Reads and consumes (clears) any pending blocked account notification.
 */
export const consumeBlockedNotice = () => {
  if (typeof window === 'undefined') return null;
  try {
    const msg = sessionStorage.getItem(KEY_BLOCKED_NOTICE);
    if (msg) {
      sessionStorage.removeItem(KEY_BLOCKED_NOTICE);
      return msg;
    }
  } catch (_) {}
  return null;
};

/**
 * Stores an expired subscription notification banner to be displayed on the login page.
 */
export const setExpiredNotice = (msg) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      KEY_EXPIRED_NOTICE,
      msg || 'Your subscription has expired. Please renew your subscription to continue.'
    );
  } catch (_) {}
};

/**
 * Reads and consumes (clears) any pending expired subscription notification.
 */
export const consumeExpiredNotice = () => {
  if (typeof window === 'undefined') return null;
  try {
    const msg = sessionStorage.getItem(KEY_EXPIRED_NOTICE);
    if (msg) {
      sessionStorage.removeItem(KEY_EXPIRED_NOTICE);
      return msg;
    }
  } catch (_) {}
  return null;
};

/**
 * Broadcasts subscription expiry event to all other open browser tabs
 * Uses BroadcastChannel with localStorage sync fallback for 100% reliability.
 */
export const broadcastSubscriptionExpired = (payload = {}) => {
  if (typeof window === 'undefined') return;
  const msg = payload.message || 'Your subscription has expired. Please renew your subscription to continue.';

  setExpiredNotice(msg);

  // 1. BroadcastChannel message to other open tabs
  try {
    authChannel?.postMessage({
      type: 'SUBSCRIPTION_EXPIRED',
      shopId: payload.shopId,
      notice: msg,
      timestamp: Date.now(),
    });
  } catch (_) {}

  // 2. localStorage storage event (cross-window / incognito / fallback)
  try {
    localStorage.setItem(
      'rf_subscription_expired_event',
      JSON.stringify({
        action: 'EXPIRED',
        shopId: payload.shopId,
        notice: msg,
        timestamp: Date.now(),
      })
    );
  } catch (_) {}
};
