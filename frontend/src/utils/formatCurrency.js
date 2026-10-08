/**
 * Formats a number as Sri Lankan Rupee currency.
 * @param {number} amount
 * @param {{ withSymbol?: boolean }} options
 * @returns {string}
 */
export const formatCurrency = (amount, options = {}) => {
  const { withSymbol = true } = options;

  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return withSymbol ? 'LKR —' : '—';
  }

  const formatted = new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  // "LKR" rather than "Rs." — it's the ISO code, matches the designs, and
  // reads unambiguously next to other currencies.
  return withSymbol ? `LKR ${formatted}` : formatted;
};

export default formatCurrency;
