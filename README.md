# GiveChain Backend

Express, Prisma, and PostgreSQL backend for organization approval and campaign management.

## Features

- User and organization registration
- Login with JWT
- Initial admin account creation
- Role-based access control for `INDIVIDUAL`, `ORGANIZATION`, and `ADMIN`
- Approved organization list and detail lookup
- Campaign create, update, delete, list, and detail lookup
- Campaign plan file upload
- Admin organization approval/rejection
- Admin campaign approval/rejection/delete
- Prisma schema and a single initial migration

## Scripts

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set:

```text
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/database
JWT_SECRET=change_this_to_a_strong_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin1234!
```

## API Summary

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/users/me

GET    /api/organizations
GET    /api/organizations/:id

GET    /api/sessions
GET    /api/sessions/:id
POST   /api/sessions
PATCH  /api/sessions/:id
DELETE /api/sessions/:id
POST   /api/sessions/:id/plan

GET    /api/admin/organizations
PATCH  /api/admin/organizations/:id/approve
PATCH  /api/admin/organizations/:id/reject
GET    /api/admin/sessions
PATCH  /api/admin/sessions/:id/approve
PATCH  /api/admin/sessions/:id/reject
DELETE /api/admin/sessions/:id

GET    /health
```

See `docs/api.md` for request details.
