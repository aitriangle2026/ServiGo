// Server-side mirror of frontend/src/utils/formatCurrency.js — used to
// format amounts inside notification/chat text generated on the backend
// (invoice previews, payout notifications). Keep the two in sync.
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Rs. —";
  }

  const formatted = new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `Rs. ${formatted}`;
};

module.exports = { formatCurrency };