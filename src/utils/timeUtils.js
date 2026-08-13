/**
 * Convert "HH:MM" duration string to total minutes
 * @param {string} timeStr - e.g. "02:54"
 * @returns {number} total minutes, or 0 if invalid
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Convert total minutes back to "HH:MM" string
 * @param {number} totalMinutes
 * @returns {string} formatted as "HH:MM"
 */
export function minutesToTime(totalMinutes) {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calculate average of an array of minute values, returned as "HH:MM"
 * @param {number[]} minuteValues
 * @returns {string}
 */
export function averageTimeStr(minuteValues) {
  if (!minuteValues || minuteValues.length === 0) return '00:00';
  const avg = minuteValues.reduce((a, b) => a + b, 0) / minuteValues.length;
  return minutesToTime(avg);
}

/**
 * Format a date string from the sheet (DD/MM/YYYY) to a readable form
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}
