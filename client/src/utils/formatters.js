export function formatCurrency(amount = 0, currency = '₹') {
  return `${currency}${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date strictly in DD/MM/YYYY format
 * @param {string|Date|number} dateInput
 * @returns {string} Formatted date as DD/MM/YYYY or '—'
 */
export function formatDateDMY(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a time strictly in 12-hour format HH:MM AM/PM
 * @param {string|Date|number} dateInput
 * @returns {string} Formatted time as HH:MM AM/PM or '—'
 */
export function formatTime12h(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Calculates remaining days between an expiry timestamp and server/reference time
 * @param {string|Date|number} expiresAt
 * @param {string|Date|number} [serverOrCurrentTime=new Date()]
 * @returns {number}
 */
export function calculateRemainingDays(expiresAt, serverOrCurrentTime = new Date()) {
  if (!expiresAt) return 0;
  const expiryMs = new Date(expiresAt).getTime();
  const nowMs = new Date(serverOrCurrentTime).getTime();
  if (isNaN(expiryMs) || isNaN(nowMs)) return 0;
  const diffMs = expiryMs - nowMs;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}
