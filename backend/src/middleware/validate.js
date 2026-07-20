import AppError from '../utils/AppError.js';
import validator from 'validator';

/**
 * Tiny declarative body validator.
 * rules: { field: { required, email, min, max, minLen, maxLen, isIn, numeric } }
 */
export const validateBody = (rules) => (req, res, next) => {
  for (const [field, rule] of Object.entries(rules)) {
    const value = req.body[field];
    const empty = value === undefined || value === null || value === '';
    if (rule.required && empty) return next(new AppError(`${rule.label || field} is required`, 400));
    if (empty) continue;
    const str = String(value);
    if (rule.email && !validator.isEmail(str)) return next(new AppError('Please provide a valid email', 400));
    if (rule.numeric && Number.isNaN(Number(value))) return next(new AppError(`${rule.label || field} must be a number`, 400));
    if (rule.min !== undefined && Number(value) < rule.min) return next(new AppError(`${rule.label || field} must be at least ${rule.min}`, 400));
    if (rule.max !== undefined && Number(value) > rule.max) return next(new AppError(`${rule.label || field} must be at most ${rule.max}`, 400));
    if (rule.minLen && str.length < rule.minLen) return next(new AppError(`${rule.label || field} must be at least ${rule.minLen} characters`, 400));
    if (rule.maxLen && str.length > rule.maxLen) return next(new AppError(`${rule.label || field} must be under ${rule.maxLen} characters`, 400));
    if (rule.isIn && !rule.isIn.includes(value)) return next(new AppError(`${rule.label || field} must be one of: ${rule.isIn.join(', ')}`, 400));
  }
  next();
};

/** Strip <script> tags and inline event handlers from all string fields (XSS hardening). */
export const sanitizeInput = (req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
          .replace(/javascript:/gi, '');
      } else if (typeof obj[key] === 'object') clean(obj[key]);
    }
  };
  clean(req.body);
  next();
};
