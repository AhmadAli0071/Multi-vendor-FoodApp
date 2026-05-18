import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import restaurantRoutes from './routes/restaurants.js';
import orderRoutes from './routes/orders.js';
import subscriptionRoutes from './routes/subscriptions.js';
import broadcastRoutes from './routes/broadcast.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customer.js';
import paymentProofRoutes from './routes/paymentProofs.js';
import paymentSettingsRoutes from './routes/paymentSettings.js';
import uploadRoutes from './routes/upload.js';
import menuRoutes from './routes/menu.js';
import { db } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import corsOptions from './config/cors.js';
import connectDB from './config/db.js';
import { seedDatabase } from './scripts/seed.js';
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: corsOptions.origin || '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to app for use in routes
app.set('io', io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join-order-room', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`[Socket] ${socket.id} joined order room: order:${orderId}`);
  });

  socket.on('leave-order-room', (orderId) => {
    socket.leave(`order:${orderId}`);
  });

  socket.on('join-restaurant-room', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`[Socket] ${socket.id} joined restaurant room: restaurant:${restaurantId}`);
  });

  socket.on('leave-restaurant-room', (restaurantId) => {
    socket.leave(`restaurant:${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Broadcast order status change to connected clients
export const emitOrderStatusChange = (io, orderId, status, order) => {
  io.to(`order:${orderId}`).emit('order-status-update', {
    orderId,
    status,
    order: order ? { ...order, total: parseFloat(order.total) } : null,
    timestamp: new Date().toISOString()
  });
  console.log(`[Socket] Emitted status update for order ${orderId}: ${status}`);
};

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validation middleware
import { validationResult } from 'express-validator';
app.use((req, res, next) => {
  res.locals.validationResult = validationResult(req);
  next();
});

// Static files for uploads (absolute path)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/restaurants', apiLimiter, restaurantRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);
app.use('/api/broadcast', apiLimiter, broadcastRoutes);
app.use('/api/customer', apiLimiter, customerRoutes);
app.use('/api/payment-proofs', apiLimiter, paymentProofRoutes);
app.use('/api/payment-settings', apiLimiter, paymentSettingsRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/menu', apiLimiter, menuRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FoodApp Backend Running', timestamp: new Date().toISOString() });
});

// Serve frontend in production (MUST be after API routes, before 404)
const distPath = path.resolve(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`📁 Serving static files from: ${distPath}`);
}

// 404 handler (for non-existent API routes in dev mode)
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    await seedDatabase();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io ready`);
    });
  });
}

export { app, io };
