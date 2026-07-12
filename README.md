# WorkspaceOS — Enterprise Multi-Tenant Workspace Management SaaS

<div align="center">

![WorkspaceOS Banner](https://via.placeholder.com/1200x300/0a0f1e/6366f1?text=WorkspaceOS+%E2%80%94+Enterprise+Workspace+Management)

[![CI/CD](https://github.com/your-org/workspace-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/workspace-saas/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)

**A production-grade, multi-tenant co-working space management platform built for scale.**

[Live Demo](https://demo.workspaceos.com) · [API Docs](https://demo.workspaceos.com/api/docs) · [Report Bug](issues) · [Feature Request](issues)

</div>

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Multi-Tenancy** | Slug-based routing, full data isolation, per-tenant config |
| **Authentication** | JWT + Refresh Token rotation, email verification, password reset |
| **RBAC** | 4 roles (Super Admin, Tenant Owner, Manager, Employee), fine-grained permissions |
| **Workspaces** | Buildings → Floors → Rooms → Desks hierarchy, real-time availability |
| **Bookings** | Create, approve, cancel, conflict detection, calendar view |
| **Analytics** | Revenue charts, occupancy rates, daily/monthly bookings, top rooms |
| **Billing** | Subscription plans (Free/Basic/Business/Enterprise), invoices, payment history |
| **Real-time** | Socket.io for live booking updates, desk availability, notifications |
| **Background Jobs** | BullMQ + Redis for emails, reports, subscription checks |
| **Exports** | One-click Excel exports for users, bookings, revenue |
| **Security** | Helmet, rate limiting, Zod validation, SQL injection protection, audit logs |
| **DevOps** | Docker Compose, GitHub Actions CI/CD, health checks |
| **API Docs** | Full Swagger/OpenAPI 3.0 documentation |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│   React (Vite) + Redux Toolkit + TanStack Query + MUI       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                      API Gateway / Nginx                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Express.js API Server                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth Module │  │Tenant Module │  │  Booking Module   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ User Module  │  │Analytics Mod │  │  Billing Module   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│                                                               │
│  Middlewares: Auth · RBAC · Tenant · Validation · Rate Limit  │
└──────┬──────────────┬────────────────────┬────────────────────┘
       │              │                    │
┌──────▼──────┐ ┌─────▼──────┐ ┌──────────▼──────────┐
│  PostgreSQL  │ │  MongoDB   │ │  Redis + BullMQ      │
│  (Prisma)   │ │  (Logs)    │ │  (Cache + Jobs)      │
└─────────────┘ └────────────┘ └─────────────────────┘
```

### Multi-Tenant Request Flow

```
Request → Resolve Tenant (slug) → Load Tenant Context
        → Authenticate JWT      → Authorize RBAC
        → Scope Data to TenantId → Return Response
```

---

## 🗃️ Database Schema (ER Diagram)

```
tenants ──────┬──── users ──────── user_roles ──── roles ──── role_permissions ──── permissions
              ├──── buildings ──── floors ──── rooms ──── desks
              │                               └──────────────── bookings ◄── users
              ├──── subscriptions ──── payments ──── invoices
              ├──── notifications
              └──── (MongoDB: activityLogs, auditLogs, systemLogs)
```

---

## 📁 Folder Structure

```
workspace-saas/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # PostgreSQL schema
│   └── src/
│       ├── controllers/            # Request handlers
│       ├── routes/                 # Express routers + Swagger docs
│       ├── services/               # Business logic layer
│       ├── repositories/           # Data access layer
│       ├── middlewares/            # auth, tenant, validate, error
│       ├── validators/             # Zod schemas
│       ├── jobs/                   # BullMQ workers
│       ├── socket/                 # Socket.io events
│       ├── config/                 # Swagger config
│       ├── utils/                  # logger, jwt, response helpers
│       ├── database/               # Prisma client, MongoDB, seed
│       ├── app.js                  # Express app setup
│       └── server.js               # HTTP server entry point
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── auth/               # Login, Register, ForgotPassword
│       │   ├── dashboard/          # Main analytics dashboard
│       │   ├── bookings/           # Booking management
│       │   ├── workspaces/         # Buildings/floors/rooms
│       │   ├── users/              # Team management
│       │   ├── analytics/          # Full charts dashboard
│       │   ├── billing/            # Subscription & billing
│       │   └── settings/           # Profile & workspace settings
│       ├── components/
│       │   ├── layout/             # DashboardLayout, AuthLayout
│       │   └── common/             # StatCard, PageHeader, ...
│       ├── redux/
│       │   ├── store.js
│       │   └── slices/             # authSlice, uiSlice
│       ├── services/
│       │   └── api.js              # Axios instance + all API calls
│       └── utils/
│           └── theme.js            # MUI dark theme
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- MongoDB 7+ *(optional — for logs)*
- Docker + Docker Compose *(for containerized setup)*

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/workspace-saas.git
cd workspace-saas

# 2. Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets

# 3. Start all services
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Seed demo data
docker-compose exec backend node src/database/seed.js

# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

### Option B: Local Development

```bash
# ── Backend ─────────────────────────────────────
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, etc.

npx prisma generate
npx prisma migrate dev
node src/database/seed.js
npm run dev

# ── Frontend ─────────────────────────────────────
cd frontend
npm install
cp .env.example .env
# Edit VITE_API_URL=http://localhost:5000/api

npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `MONGODB_URI` | ⚠️ | MongoDB URI (for logs, optional) |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_ACCESS_SECRET` | ✅ | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | — | Default: `15m` |
| `JWT_REFRESH_EXPIRES` | — | Default: `7d` |
| `SMTP_HOST` | ⚠️ | SMTP2GO host |
| `SMTP_USER` | ⚠️ | SMTP username |
| `SMTP_PASS` | ⚠️ | SMTP password |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ⚠️ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ⚠️ | Cloudinary API secret |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS + email links |
| `PORT` | — | Default: `5000` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_SOCKET_URL` | ✅ | Socket.io server URL |

---

## 🔐 Demo Credentials

After running the seed:

| Role | Email | Password | Workspace |
|------|-------|----------|-----------|
| **Owner** | demo@example.com | Demo1234! | demo-workspace |
| **Manager** | manager@example.com | Demo1234! | demo-workspace |
| **Employee** | alice@example.com | Demo1234! | demo-workspace |

---

## 📡 API Reference

Full interactive documentation available at `/api/docs` (Swagger UI).

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new tenant + owner |
| `POST` | `/api/auth/login` | Login with workspace slug |
| `POST` | `/api/auth/refresh` | Rotate access + refresh tokens |
| `POST` | `/api/auth/logout` | Revoke refresh token |
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `POST` | `/api/auth/reset-password` | Reset with token |
| `GET` | `/api/auth/verify-email` | Verify email address |
| `GET` | `/api/auth/me` | Current user profile |

### Core Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/bookings` | List bookings (scoped to role) | ✅ |
| `POST` | `/api/bookings` | Create booking | ✅ |
| `PATCH` | `/api/bookings/:id/approve` | Approve booking | Manager+ |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel booking | ✅ |
| `GET` | `/api/buildings` | List buildings + floors + rooms | ✅ |
| `POST` | `/api/buildings` | Create building | Manager+ |
| `GET` | `/api/users` | List workspace members | ✅ |
| `POST` | `/api/users` | Invite new member | Manager+ |
| `GET` | `/api/analytics/dashboard` | KPI stats | Manager+ |
| `GET` | `/api/analytics/revenue` | Revenue chart data | Manager+ |
| `GET` | `/api/notifications` | User notifications | ✅ |

---

## 🔌 Role-Based Access Control

```
TENANT_OWNER → all permissions
MANAGER      → workspace:read/update, booking:*, user:read, analytics:view
EMPLOYEE     → workspace:read, booking:create/read/cancel
```

Permission format: `resource:action` (e.g., `booking:approve`, `analytics:view`)

---

## 🐳 Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:16-alpine | 5432 | Primary database |
| `mongodb` | mongo:7 | 27017 | Logs & dynamic config |
| `redis` | redis:7-alpine | 6379 | Cache + BullMQ queues |
| `backend` | Custom | 5000 | Express API server |
| `frontend` | Custom + Nginx | 3000 | React SPA |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set all required environment variables (strong JWT secrets)
- [ ] Run `prisma migrate deploy` (not `dev`)
- [ ] Enable HTTPS (SSL/TLS via nginx or load balancer)
- [ ] Set `NODE_ENV=production`
- [ ] Configure Redis password
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Add rate limiting tuning for your traffic
- [ ] Set `FRONTEND_URL` to your actual domain

### Zero-Downtime Deployment

```bash
# Pull latest images
docker-compose pull

# Rolling update
docker-compose up -d --no-deps --build backend frontend

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Clean up old images
docker image prune -f
```

---

## 📊 Subscription Plans

| Feature | Free | Basic | Business | Enterprise |
|---------|------|-------|----------|------------|
| Users | 5 | 25 | 100 | Unlimited |
| Buildings | 1 | 3 | 10 | Unlimited |
| Bookings/mo | 50 | 500 | Unlimited | Unlimited |
| Analytics | Basic | Advanced | Full | Custom |
| Support | Community | Email | Priority | Dedicated |
| Price | $0 | $49/mo | $149/mo | $499/mo |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://conventionalcommits.org/).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ by the WorkspaceOS Team<br>
<strong>Star ⭐ this repo if it helped you!</strong>
</div>
