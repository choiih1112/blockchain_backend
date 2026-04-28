# Backend Feature Map

## Included Features

| Feature | Main files |
| --- | --- |
| User and organization registration | `src/domains/auth/*` |
| Login and JWT issuing | `src/domains/auth/*` |
| JWT authentication middleware | `src/middleware/auth.ts` |
| Admin authorization middleware | `src/middleware/admin.ts` |
| Current user lookup | `src/domains/users/*` |
| Approved organization list/detail | `src/domains/organizations/*` |
| Campaign create/update/delete | `src/domains/sessions/*` |
| Approved campaign list/detail | `src/domains/sessions/*` |
| Campaign plan upload | `src/config/upload.ts`, `src/domains/sessions/*` |
| Admin organization approval/rejection | `src/domains/admin/*` |
| Admin campaign approval/rejection/delete | `src/domains/admin/*` |
| Initial admin seed | `prisma/seed.ts` |
| PostgreSQL/Prisma schema | `prisma/schema.prisma` |

## API Surface

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

## Removed From Current Scope

```text
Donation creation API
My donation history API
Wallet address API
Profile update API
Platform stats API
Campaign currentAmount/status/contractSessionId fields
Multi-step Prisma migrations
```
