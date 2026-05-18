const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:5000'
];

const prodOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];

export default {
  origin: [...allowedOrigins, ...prodOrigins],
  credentials: true,
  optionsSuccessStatus: 200
};
