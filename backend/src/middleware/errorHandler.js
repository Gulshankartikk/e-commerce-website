import AppError from '../utils/AppError.js';

/** 404 for unknown API routes. */
export const notFound = (req, res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404));

/** Global error handler — converts Mongoose/JWT errors to friendly messages. */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`That ${field} is already in use`, 409);
  }
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map((e) => e.message).join('. ');
    error = new AppError(msgs, 400);
  }
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Session expired. Please log in again', 401);
  if (err.name === 'MulterError') error = new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5MB' : err.message, 400);

  const statusCode = error.statusCode || 500;
  if (statusCode === 500) console.error('💥', err);
  res.status(statusCode).json({
    success: false,
    message: error.isOperational ? error.message : 'Something went wrong. Please try again',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
