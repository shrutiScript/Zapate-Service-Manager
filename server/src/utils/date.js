/**
 * Date and timezone helper utilities for Zapate Service Manager
 */

/**
 * Calculates startOfDay and endOfDay in UTC for a given calendar date string (YYYY-MM-DD)
 * and timezone offset in minutes (default -330 for IST / UTC+5:30).
 *
 * In JavaScript, getTimezoneOffset() returns UTC - Local in minutes.
 * For IST (UTC+5:30), getTimezoneOffset() returns -330.
 *
 * To convert local 00:00:00 to UTC:
 * UTC = Local + (offsetInMinutes * 60 * 1000)
 */
export function getDayRange(dateStr, timezoneOffsetMinutes = -330) {
  let year, month, day;
  let offset = -330;
  if (timezoneOffsetMinutes !== undefined && timezoneOffsetMinutes !== null && timezoneOffsetMinutes !== '') {
    const parsed = parseInt(timezoneOffsetMinutes, 10);
    if (!isNaN(parsed)) {
      offset = parsed;
    }
  }

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else {
    // Current date in target timezone
    const nowUtcMs = Date.now();
    // Local time in ms: UTC - offset
    const localMs = nowUtcMs - offset * 60 * 1000;
    const localDate = new Date(localMs);
    year = localDate.getUTCFullYear();
    month = localDate.getUTCMonth() + 1;
    day = localDate.getUTCDate();
  }

  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + offset * 60 * 1000);
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) + offset * 60 * 1000);
  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    startOfDay,
    endOfDay,
    selectedDate: formattedDate,
    year,
    month,
    day,
    timezoneOffset: offset,
  };
}
