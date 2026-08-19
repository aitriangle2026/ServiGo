export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Sri Lankan-friendly phone check: accepts 07XXXXXXXX or +947XXXXXXXX / 947XXXXXXXX
export const isValidPhone = (value) => /^(?:\+94|0)?7\d{8}$/.test(value.replace(/\s/g, ''));

/**
 * Returns a 0–4 strength score plus a human label, used by the password strength meter.
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#EF4444', '#EF4444', '#F59E0B', '#2563EB', '#10B981'];

  return { score, label: labels[score], color: colors[score] };
};

export const isStrongPassword = (password) =>
  password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

/**
 * Generic required-field + custom rule validator for a form's field map.
 * @param {Record<string, string>} values
 * @param {Record<string, (value: string, values: Record<string,string>) => string | null>} rules
 * @returns {Record<string, string>} errors keyed by field name
 */
export const validateFields = (values, rules) => {
  const errors = {};
  Object.entries(rules).forEach(([field, validate]) => {
    const error = validate(values[field], values);
    if (error) errors[field] = error;
  });
  return errors;
};
