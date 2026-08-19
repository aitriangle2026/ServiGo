/**
 * Formats a number as Sri Lankan Rupee currency.
 * @param {number} amount
 * @param {{ withSymbol?: boolean }} options
 * @returns {string}
 */
export const formatCurrency = (amount, options = {}) => {
  const { withSymbol = true } = options;

  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return withSymbol ? 'Rs. —' : '—';
  }

  const formatted = new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return withSymbol ? `Rs. ${formatted}` : formatted;
};

export default formatCurrency;
