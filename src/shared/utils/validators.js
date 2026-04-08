export const required = (val) => val ? '' : 'Required';

export const email = (val) => {
  if (!val) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Invalid email';
};

export const phone = (val) => {
  if (!val) return '';
  return /^[\d\s()+-]{7,20}$/.test(val) ? '' : 'Invalid phone';
};

export const minLength = (min) => (val) => {
  if (!val) return '';
  return val.length >= min ? '' : `Min ${min} characters`;
};

export const positive = (val) => {
  if (val == null || val === '') return '';
  return Number(val) > 0 ? '' : 'Must be positive';
};

export const validate = (data, rules) => {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(data[field]);
      if (error) { errors[field] = error; break; }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
};
