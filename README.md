# StaffSync – Modern Human Resource Management Solution

Responsive full-stack HRM starter built with React, Bootstrap, Node.js, Express, MongoDB/Mongoose, JWT and MVC-style controllers/routes.

## Features
- JWT login, registration endpoint, password hashing, HR/Manager/Employee role authorization
- HR: employee CRUD, announcements, attendance/leave overview, leave review
- Manager: employee directory, leave review, training creation
- Employee: leave application/status, attendance check-in/out/history, announcements, training enrollment
- Notifications for announcements and leave workflow
- Dashboard summary, responsive sidebar, tables, cards, forms, validation and success/error feedback
- Demo seed endpoint and sample accounts

## Requirements
Node.js 18+, MongoDB Community or MongoDB Atlas, npm.

## Setup
1. Install MongoDB and ensure it is running locally, or create an Atlas database.
2. Copy `backend/.env.example` to `backend/.env`; set `MONGO_URI` and a strong `JWT_SECRET`.
3. Copy `frontend/.env.example` to `frontend/.env` if using a non-default API URL.
4. From project root run:
   ```bash
   npm run install-all
   npm run dev
   ```
5. Open http://localhost:5173. API runs at http://localhost:5500.

Demo users (seeded on first HR login via `POST /api/demo/seed`):
- `hr@staffsync.demo`
- `manager@staffsync.demo`
- `employee@staffsync.demo`
- Password for each: `StaffSync123!`

To seed, sign in as HR and send `POST http://localhost:5500/api/demo/seed` with `Authorization: Bearer <token>`. Demo seeding is deliberately HR-protected.

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- Employees: `GET/POST /api/employees`, `PATCH/DELETE /api/employees/:id`
- Leaves: `GET/POST /api/leaves`, `PATCH /api/leaves/:id/review`
- Attendance: `GET/POST /api/attendance`, `POST /api/attendance/checkout`
- Announcements: `GET/POST /api/announcements`
- Training: `GET/POST /api/training`, `POST /api/training/:id/enroll`
- Notifications: `GET /api/notifications`, `PATCH /api/notifications/:id/read`
- Health: `GET /api/health`

## GitHub
```bash
git init
git add .
git commit -m "Build StaffSync HR management application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/staffsync.git
git push -u origin main
```
Do not commit `.env` files. Add them to `.gitignore` and configure secrets in your deployment dashboard.

## Deployment outline
- MongoDB Atlas: create cluster/database user, allow your hosting provider's network, copy Atlas connection URI.
- Backend: deploy `backend` to Render/Railway/Fly.io; set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`; build command `npm install`, start command `npm start`.
- Frontend: deploy `frontend` to Vercel/Netlify; set `VITE_API_BASE_URL` to your deployed backend URL plus `/api`; build command `npm run build`, output `dist`.
- Configure CORS `CLIENT_URL` to the deployed frontend origin.

## Important production hardening
This is a runnable demo/starter, not a fully audited production HR platform. Add email verification, password reset, rate limiting, audit logs, pagination, stricter employee/team scoping, policy-based leave rules, file storage, backups, and tests before handling real employee data. Restrict registration role assignment in production (public registration should not allow self-selecting HR/Manager); use an invite/admin flow. Never use demo credentials in production.
