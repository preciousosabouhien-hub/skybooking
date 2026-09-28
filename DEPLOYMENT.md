# SkyBook deployment guide

This project is prepared for a split deployment:

- Frontend: Vercel
- Backend: Render (or another Node.js host)
- Database: hosted PostgreSQL

## 1. PostgreSQL

Create a production PostgreSQL database with a provider such as Neon, Supabase, Render PostgreSQL, Railway, or another managed PostgreSQL service.

Copy its connection string into the backend `DATABASE_URL` environment variable.

The backend runs `prisma migrate deploy` on startup, so the Prisma schema will be applied when the service starts.

## 2. Backend on Render

Create a Web Service from this repository.

Use:

- Root directory: `backend`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npx prisma migrate deploy && npm start`
- Health check: `/api/health`

Set these environment variables:

- `DATABASE_URL` = your production PostgreSQL URL
- `JWT_SECRET` = a long random secret
- `CLIENT_URL` = your Vercel frontend URL

A ready-to-use `render.yaml` is included at the repository root.

## 3. Frontend on Vercel

Import the repository into Vercel and set the project root to `frontend`.

Use:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set:

`VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api`

The included `frontend/vercel.json` handles client-side routes such as `/admin` and `/admin/login`.

## 4. CORS

After deploying the frontend, set the backend `CLIENT_URL` to the exact Vercel URL. If you later add a custom domain, use a comma-separated list, for example:

`https://skybook.vercel.app,https://www.example.com`

## 5. Admin

After the database is migrated, run the seed command once against the production database if you want the included demo admin account:

`npm run prisma:seed`

Do not keep the demo credentials in a real production deployment. Change the password or create a new admin account before sharing the site.

## 6. Production checklist

- [ ] Production PostgreSQL URL configured
- [ ] Strong random `JWT_SECRET` configured
- [ ] `CLIENT_URL` set to the deployed frontend origin
- [ ] `VITE_API_URL` set to the deployed backend `/api` URL
- [ ] Prisma migrations applied
- [ ] Admin account secured
- [ ] Test flight search
- [ ] Test booking creation
- [ ] Test ticket verification
- [ ] Test admin dashboard
- [ ] Test booking cancellation
