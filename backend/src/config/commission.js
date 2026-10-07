// Platform commission taken out of every invoice before the provider is
// paid out. Expressed as a fraction (0.10 = 10%). Snapshotted onto each
// Invoice at approval time so a later change here never rewrites the math
// on invoices that were already agreed/paid.
const COMMISSION_RATE = process.env.COMMISSION_RATE
  ? Number(process.env.COMMISSION_RATE)
  : 0.1;

module.exports = { COMMISSION_RATE };