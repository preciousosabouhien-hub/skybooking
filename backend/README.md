# SkyBook Backend

Full REST API for the SkyBook flight-booking frontend.

## Run locally

1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Run:
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   npm run dev

API: http://localhost:4000
Health: GET /api/health

Seed admin:
admin@skybook.test
Admin123!

Change the credentials before any real deployment.

## Main endpoints

POST /api/auth/register
POST /api/auth/login
GET  /api/flights
GET  /api/flights/:id
GET  /api/flights/airports
POST /api/bookings
GET  /api/bookings/mine
POST /api/bookings/:id/cancel
GET  /api/admin/stats
POST /api/admin/flights
DELETE /api/admin/flights/:id
