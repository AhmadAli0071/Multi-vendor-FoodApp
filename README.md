# Food Ordering System (Admin + Owner + Customer)

A full-featured multi-tenant food ordering platform with three distinct interfaces: Admin Panel, Restaurant Owner Portal, and Customer PWA.

---

## Features

### Admin Panel (`/`)
- **Dashboard:** Stats overview, recent orders, expiring subscriptions, 7-day order chart
- **Restaurant Management:** Create, view, update, delete restaurants with live branding preview & QR generation
- **Order Management:** View all orders with filters (status, restaurant, date), status updates with real-time tracking
- **Subscriptions:** View subscription status, renew manually, approve payment proofs
- **Broadcast Messaging:** Send notifications to selected restaurant segments (all/active/expiring/specific)
- **Settings:** Admin profile, app configuration, data reset, lock dashboard

### Restaurant Owner Portal (`/owner`)
- **Authentication:** Login with restaurant credentials (JWT)
- **Dashboard:** Today's stats, pending orders count, revenue, quick actions
- **Menu Management:** Create/edit/delete categories & items with image uploads
- **Order Processing:** Accept/update order status (accepted → preparing → ready → delivered) with real-time updates
- **Store Controls:** Open/close toggle to stop receiving orders
- **Settings:** Edit restaurant profile, branding (logo, colors), upload payment proof for subscription renewal
- **Real-time:** Socket.io integration for live order tracking

### Customer PWA (`/r/:slug`)
- **Restaurant-branded UI:** Each restaurant gets its own themed experience
- **Menu Browsing:** Search, filter by category, view food details with images
- **Cart:** Add items, adjust quantities, persistent cart per restaurant
- **Checkout:** Delivery/pickup toggle, customer details form
- **Order Placement:** Generates unique order ID, saves to history
- **Live Order Tracking:** Real-time step-timeline via Socket.io
- **Customer Account:** Registration/login, order history view

---

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose ODM
- JWT Authentication
- Socket.io for real-time updates
- Nodemailer for order status emails
- Twilio for WhatsApp notifications
- Multer for image uploads (disk storage)
- QRCode generation

**Frontend:**
- React 19 with Vite
- React Router DOM 7
- Tailwind CSS v4
- Lucide React icons
- Recharts for analytics charts
- react-hot-toast for notifications
- qrcode.react for QR display
- PWA (manifest + service worker)

---

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Setup

1. Clone and install:
```bash
cd admin
npm run install:all   # installs root + backend dependencies
```

2. Configure environment:
```bash
# Backend .env (backend/.env)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/foodapp
JWT_SECRET=your_super_secret_key
ADMIN_EMAIL=admin@foodapp.pk
ADMIN_PASSWORD=admin123
APP_URL=http://localhost:5173

# Optional: Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@foodapp.pk
FROM_NAME=FoodApp

# Optional: WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+14155238886
```

3. Seed database (optional):
```bash
# Data is auto-seeded on first run from admin/data/db.json
```

---

## Running the Application

### Development (hot reload)
```bash
npm run dev
```
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Production Build
```bash
npm run build        # creates dist/ folder
NODE_ENV=production npm start   # serves both API and static frontend
```

---

## Project Structure

```
admin/
├── backend/
│   ├── config/          # DB, CORS, env
│   ├── middleware/      # auth, errorHandler, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── scripts/         # seed.js
│   ├── services/        # email.js, whatsapp.js
│   ├── uploads/         # saved images
│   ├── server.js        # entry point (Express + Socket.io)
│   └── .env
├── src/
│   ├── components/      # reusable UI
│   ├── context/         # React Context (AppContext, OwnerContext, CustomerContext)
│   ├── pages/
│   │   ├── admin/       # Dashboard, Restaurants, Orders, Subscriptions, Broadcast, Settings
│   │   ├── owner/       # Login, Dashboard, MenuManagement, Orders, Settings
│   │   └── customer/    # RestaurantPage, CartPage, CheckoutPage, OrderTracking, Login, Signup, Account
│   ├── utils/           # api.js, ownerApi.js, manifest updater
│   └── App.jsx          # Router config
├── data/
│   └── db.json          # Seed data (restaurants, orders)
├── public/              # PWA assets, icons, manifest, sw.js
├── dist/                # Production build output
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## API Endpoints (Selected)

**Auth:**
- `POST /api/auth/login` – Admin/Restaurant login (JWT)
- `POST /api/auth/register` – Restaurant self-registration

**Admin:**
- `GET  /api/admin/dashboard-stats`
- `POST /api/restaurants` – Create restaurant (admin)
- `GET  /api/restaurants` – List all
- `PUT  /api/restaurants/:id` – Update
- `DELETE /api/restaurants/:id`
- `GET  /api/orders` – All orders (filters)
- `PUT  /api/orders/:id/status` – Update status

**Owner:**
- `GET  /api/restaurants/me` – Owner's own restaurant
- `PUT  /api/restaurants/me` – Update own restaurant
- `GET  /api/menu` – Get menu
- `PUT  /api/menu` – Save whole menu
- `POST /api/menu/categories` – Add category
- `PUT  /api/menu/categories/:id` – Update
- `DELETE /api/menu/categories/:id`
- `POST /api/menu/items` – Add item
- `PUT  /api/menu/items/:id` – Update
- `DELETE /api/menu/items/:id`
- `POST /api/payment-proofs` – Upload subscription proof

**Customer:**
- `GET  /api/customer/restaurant/:slug` – Restaurant info
- `GET  /api/customer/restaurant/:slug/menu` – Menu
- `POST /api/customer/orders` – Place order
- `GET  /api/customer/orders/:id` – Track order
- `POST /api/customer/auth/signup`
- `POST /api/customer/auth/login`

---

## Environment Variables

See `backend/.env.example` (all config keys documented).

Key variables:
- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – JWT signing secret
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` – Super admin credentials
- `SMTP_*` – Email server settings
- `TWILIO_*` – WhatsApp messaging

---

## Database (MongoDB)

**Main Collections:**

| Model           | Collection      | Purpose                          |
|-----------------|-----------------|----------------------------------|
| Restaurant      | restaurants     | Restaurant profiles, branding    |
| User            | users           | Admin/restaurant auth users      |
| Customer        | customers       | Customer accounts                |
| Order           | orders          | Customer orders with status      |
| MenuItem        | menu_items      | Standalone menu items (future)   |
| Payment         | payments        | Subscription payments history   |
| PaymentProof    | payment_proofs  | Uploaded screenshots, approval  |
| Broadcast       | broadcasts      | Notification history             |
| Notification    | notifications   | Restaurant notifications         |

---

## Real-Time Updates

Socket.io is used for live order tracking:
- Customer viewing order `/r/:slug/order/:orderId` joins room `order:{orderId}`
- Status updates broadcast to room automatically
- Polling fallback every 10s for reliability

---

## Known Issues & Roadmap

- [x] Static file serving for production build
- [x] Menu API persistence (owner)
- [x] Email notifications
- [x] WhatsApp notifications
- [x] Database seeding
- [x] Order timeline history
- [ ] Password reset flow
- [ ] Rate limiting
- [ ] Error boundaries
- [ ] Unit tests
- [ ] Image CDN / Cloud storage (S3)
- [ ] Payment gateway integration (Stripe/JazzCash)
- [ ] Multi-language support

---

## License

Private/Proprietary
