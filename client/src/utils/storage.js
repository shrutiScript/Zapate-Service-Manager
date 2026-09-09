/**
 * Safe local/session storage utility with QuotaExceededError protection,
 * payload sanitization (stripping massive base64 payloads before writing to browser storage),
 * and graceful fallback.
 */

// In-memory storage fallback if both localStorage and sessionStorage are unavailable or exhausted
const memoryStorage = new Map();

/**
 * Sanitize objects before storing in browser storage.
 * Strips huge Base64 data strings (e.g. uploaded images, data:image URLs)
 * while preserving standard URLs, strings, numbers, booleans, and nested objects.
 */
export const sanitizeForStorage = (data) => {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string' && (data.startsWith('data:image/') || data.length > 5000)) {
      return ''; // Omit bloated string from storage
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForStorage(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // If key is 'logo' or string is a large data URL / huge string > 2000 chars, omit for local storage
      if (key === 'logo' && value.startsWith('data:')) {
        cleaned[key] = ''; // Keep field, but strip bulky data URL
      } else if (value.startsWith('data:image/') || value.length > 5000) {
        cleaned[key] = '';
      } else {
        cleaned[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeForStorage(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Clean existing bloated keys in localStorage (e.g. from previous large image uploads)
 * to instantly recover browser quota.
 */
export const cleanStorageBloat = () => {
  if (typeof window === 'undefined') return;

  try {
    const keysToPurge = [
      'rf_auth_token',
      'rf_auth_user',
      'rf_current_shop',
      'rf_session_SUPER_ADMIN',
      'rf_session_SHOP_OWNER',
    ];
    for (const key of keysToPurge) {
      localStorage.removeItem(key);
    }

    const sessionKeysToCheck = ['rf_auth_user', 'rf_current_shop'];
    for (const key of sessionKeysToCheck) {
      const raw = sessionStorage.getItem(key);
      if (raw && (raw.includes('data:image/') || raw.length > 30000)) {
        try {
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeForStorage(parsed);
          sessionStorage.setItem(key, JSON.stringify(sanitized));
        } catch {
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.warn('[SafeStorage] Could not clean storage bloat:', e);
  }
};

/**
 * Safely store an item in localStorage with automatic sanitization and quota handling.
 */
export const safeSetItem = (key, value) => {
  if (typeof window === 'undefined') return false;

  let serialized = '';
  try {
    if (typeof value === 'object' && value !== null) {
      const sanitized = sanitizeForStorage(value);
      serialized = JSON.stringify(sanitized);
    } else {
      serialized =
        typeof value === 'string' && (value.startsWith('data:image/') || value.length > 5000)
          ? ''
          : String(value);
    }

    sessionStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] sessionStorage.setItem failed for key "${key}":`, err?.message || err);
    try {
      cleanStorageBloat();
      sessionStorage.setItem(key, serialized);
      return true;
    } catch {
      memoryStorage.set(key, serialized);
      return false;
    }
  }
};

/**
 * Safely get an item from storage.
 */
export const safeGetItem = (key) => {
  if (typeof window === 'undefined') return null;

  try {
    const sessionVal = sessionStorage.getItem(key);
    if (sessionVal !== null) return sessionVal;
  } catch (e) {}

  return memoryStorage.get(key) || null;
};

/**
 * Safely remove an item from all storages.
 */
export const safeRemoveItem = (key) => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(key);
  } catch (e) {}

  try {
    localStorage.removeItem(key);
  } catch (e) {}

  memoryStorage.delete(key);
};
