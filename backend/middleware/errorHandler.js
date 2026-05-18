export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
