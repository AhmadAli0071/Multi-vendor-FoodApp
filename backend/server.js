import express from 'express';
import helmet from 'helmet';
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
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimit.js';
import { ensureAdminUser } from './scripts/ensureAdmin.js';

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

// Security headers — relaxed CSP to allow external images (logo uploads) and fonts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://foodapp-owner.onrender.com", "https://foodapp-admin-f13g.onrender.com"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://fonts.googleapis.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));

// Trust proxy (Render sits behind a proxy)
app.set('trust proxy', 1);

// CORS
app.use(cors(corsOptions));

// Body parser (increased limit for base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Utility to detect subdomain or Render service name from host
function getRenderServiceName(hostname) {
  if (!hostname) return null;
  if (hostname.endsWith('.onrender.com')) {
    return hostname.split('.')[0];
  }
  return null;
}

function getSubdomain(hostname) {
  if (!hostname) return null;
  const renderName = getRenderServiceName(hostname);
  if (renderName) {
    if (renderName.includes('admin')) return 'admin';
    if (renderName.includes('owner')) return 'owner';
    if (renderName.includes('landing')) return 'landing';
    return 'customer';
  }
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

// Detect app type from Referer + hostname (manifest/sw.js always fetched from root)
function getAppType(req) {
  const path = req.path || '';
  const hostname = req.hostname;

  // Check the request path itself first (for non-root requests)
  if (path.startsWith('/owner')) return 'owner';
  if (path.match(/^\/r\//)) return 'customer';

  // For root manifest/sw.js, use Referer header to know which page asked for it
  const referer = req.get('Referer') || '';
  if (referer) {
    const refUrl = new URL(referer);
    const refPath = refUrl.pathname;
    if (refPath.startsWith('/owner')) return 'owner';
    if (refPath.match(/^\/r\//)) return 'customer';
  }

  // Subdomain/Render service detection (for separate-domain setup)
  const subdomain = getSubdomain(hostname);
  if (subdomain === 'owner') return 'owner';
  if (subdomain === 'customer') return 'customer';
  return 'admin'; // default
}

function isDedicatedService(hostname, type) {
  const renderName = getRenderServiceName(hostname);
  return renderName && renderName.includes(type);
}

function serveManifest(res, appType, hostname) {
  let name = 'FoodApp Admin';
  let shortName = 'Admin';
  let startUrl = '/';

  if (appType === 'owner') {
    name = 'FoodApp Owner';
    shortName = 'Owner';
    startUrl = isDedicatedService(hostname, 'owner') ? '/' : '/owner';
  } else if (appType === 'customer') {
    name = 'FoodApp';
    shortName = 'FoodApp';
  }

  res.json({
    name, short_name: shortName,
    description: `FoodApp - ${name}`,
    start_url: startUrl, display: 'fullscreen', display_override: ['fullscreen', 'standalone', 'minimal-ui', 'browser'],
    background_color: '#FFFFFF', theme_color: '#FF6B35',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ],
    categories: ['food', 'lifestyle'], lang: 'en'
  });
}

// Separate manifest URLs so browser treats each app as a different PWA
app.get('/manifest-admin.json', (req, res) => serveManifest(res, 'admin', req.hostname));
app.get('/manifest-owner.json', (req, res) => serveManifest(res, 'owner', req.hostname));
app.get('/manifest-customer.json', (req, res) => serveManifest(res, 'customer', req.hostname));

// Keep the dynamic one as default for backward compatibility
app.get('/manifest.json', (req, res) => serveManifest(res, getAppType(req), req.hostname));

function serveSw(res, appType, hostname) {
  const manifestUrl = `/manifest-${appType}.json`;
  const navigateFallback = (appType === 'owner' && !isDedicatedService(hostname, 'owner')) ? "'/owner'" : "'/'";
  res.type('application/javascript');
  res.send(`
    const CACHE_NAME = 'foodapp-${appType}-v1';
    const ASSETS = ['/','/index.html','${manifestUrl}','/icons/icon-192.png','/icons/icon-512.png'];
    self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
    self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
    self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('/api/'))return;e.respondWith(caches.match(e.request).then(c=>{let f=fetch(e.request).then(r=>{if(r&&r.status===200&&r.type==='basic'){let cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl))}return r}).catch(()=>{if(e.request.mode==='navigate')return caches.match('/');return c});return c||f}));});
  `);
}

// Separate SW URLs for each app (unique cache per app)
app.get('/sw-admin.js', (req, res) => serveSw(res, 'admin', req.hostname));
app.get('/sw-owner.js', (req, res) => serveSw(res, 'owner', req.hostname));
app.get('/sw-customer.js', (req, res) => serveSw(res, 'customer', req.hostname));

// Keep dynamic SW as default
app.get('/sw.js', (req, res) => serveSw(res, getAppType(req), req.hostname));

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
    await ensureAdminUser();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io ready`);
    });
  });
}

export { app, io };
