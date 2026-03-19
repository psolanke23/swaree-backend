# Sawree Backend — NestJS REST API + Socket.IO

A production-ready Node.js backend for the Sawree food delivery application.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | JWT + Passport |
| Real-time | Socket.IO (namespace `/tracking`) |
| Payments | Razorpay |
| Validation | class-validator + class-transformer |
| Rate limiting | @nestjs/throttler |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, Razorpay keys
```

### 3. Set up the database

> You can use a free PostgreSQL instance from [Supabase](https://supabase.com) or run PostgreSQL locally.

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate
```

### 4. Start the server
```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm start
```

API available at: `http://localhost:3000/api/v1`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ❌ | Register new user |
| POST | `/api/v1/auth/login` | ❌ | Login → JWT token |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | ✅ | Get profile |
| PATCH | `/api/v1/users/address` | ✅ | Update delivery address |

### Restaurants
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/restaurants` | ❌ | List all (opt. `?cuisine=`) |
| GET | `/api/v1/restaurants/:id` | ❌ | Get restaurant detail |

### Menu
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/restaurants/:id/menu` | ❌ | Get menu (opt. `?category=`) |
| GET | `/api/v1/restaurants/:id/menu/categories` | ❌ | Get category list |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/orders` | ✅ | Create order |
| GET | `/api/v1/orders` | ✅ | List user orders |
| GET | `/api/v1/orders/:id` | ✅ | Get order detail |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/payments/orders/:orderId/initiate` | ✅ | Create Razorpay order |
| POST | `/api/v1/payments/webhook` | ❌ (Razorpay HMAC) | Handle payment webhook |

### Tracking (REST)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/tracking/:orderId` | ✅ | Get current tracking state |
| PATCH | `/api/v1/tracking/:orderId/location` | ✅ | Update rider location + status |

---

## Real-time Tracking (Socket.IO)

Connect to `ws://localhost:3000/tracking`

```js
// Client (Angular)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/tracking', {
  auth: { token: 'Bearer <jwt>' }
});

// Join order room
socket.emit('join_order', { orderId: 'your-order-id' });

// Listen for updates
socket.on('tracking_update', (data) => {
  console.log(data); // { orderId, status, latitude, longitude, riderName, ... }
});
```

---

## Database — Why PostgreSQL?

| Feature | PostgreSQL | MySQL | MongoDB |
|---|---|---|---|
| Strong ACID | ✅ | ✅ | ❌ |
| Array fields (cuisines) | ✅ Native | ❌ | ✅ |
| JSON support | ✅ JSONB | limited | ✅ |
| Geospatial (PostGIS) | ✅ | limited | ✅ |
| Hosted free tier | Supabase ✅ | ❌ | Atlas ✅ |

PostgreSQL + Prisma is the best fit for this app's relational data (users → orders → items) while also supporting geospatial queries for finding nearby restaurants.

**Recommended free hosting:** [Supabase](https://supabase.com) — free 500MB PostgreSQL + REST + auth.

---

## Project Structure

```
sawree-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── main.ts                # Bootstrap
│   ├── app.module.ts          # Root module
│   ├── prisma/                # Database service
│   ├── auth/                  # JWT auth (register/login)
│   ├── users/                 # User profile
│   ├── restaurants/           # Restaurant listing
│   ├── menu/                  # Menu items
│   ├── orders/                # Order management
│   ├── payments/              # Razorpay integration
│   └── tracking/              # Socket.IO real-time tracking
├── .env.example
├── package.json
└── tsconfig.json
```
