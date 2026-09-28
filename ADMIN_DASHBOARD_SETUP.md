# SkyBook Admin Dashboard

## Admin account

After seeding the database:

- URL: `http://localhost:5173/admin/login`
- Email: `admin@skybook.test`
- Password: `Admin123!`

Change the seeded password before using this outside a local demo.

## Admin features

The admin dashboard is connected to PostgreSQL through the Express/Prisma API.

- Overview statistics
- Recent bookings
- Flight create/edit/delete
- Flight search
- Seat availability
- Booking search
- Booking details
- Confirm/cancel/restore bookings
- User search
- Promote users to admin
- Demote admins to users
- JWT-protected admin API
- Admin logout and expired-session handling

## Frontend routes

- `/` — public flight booking app
- `/admin/login` — admin login
- `/admin` — protected admin dashboard

The Vite dev server should fall back to `index.html` for these routes during local development. For static hosting, configure SPA rewrites to `/index.html`.
