# SkyBook Full Stack

## Run backend
cd backend
npm install
cp .env.example .env
# set DATABASE_URL for PostgreSQL
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

## Run frontend
cd frontend
npm install
cp .env.example .env
npm run dev

Frontend: http://localhost:5173
Backend: http://localhost:4000

The frontend now calls the backend for airports, flight search, registration/login-on-booking, and booking creation.

## Production deployment

See `DEPLOYMENT.md` for the Vercel + Render + hosted PostgreSQL setup. The frontend includes a Vercel SPA rewrite and the backend includes a Render deployment manifest.
