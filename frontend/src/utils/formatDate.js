const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Short relative time, the way a notification feed reads it:
 * "Just now", "5m ago", "3h ago", "2d ago", then an absolute date once it's
 * more than a week old (by which point "37d ago" tells you less than the
 * date does).
 *
 * @param {string | number | Date} value
 * @returns {string}
 */
export const formatRelativeTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();

  // A clock skew between the server and the browser can put a just-created
  // notification slightly in the future — show it as current, not negative.
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;

  return formatDate(date);
};

/**
 * Absolute date, e.g. "12 Mar 2026". Year is dropped for dates in the
 * current year.
 *
 * @param {string | number | Date} value
 * @returns {string}
 */
export const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const isThisYear = date.getFullYear() === new Date().getFullYear();

  return date.toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });
};

/**
 * Date and time together, e.g. "12 Mar 2026, 2:30 pm".
 *
 * @param {string | number | Date} value
 * @returns {string}
 */
export const formatDateTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString('en-LK', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatDate(date)}, ${time}`;
};

export default formatRelativeTime;
