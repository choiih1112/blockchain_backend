# Backend File Structure

```text
backend/
  prisma/
    schema.prisma
    seed.ts
    migrations/
      20260415000000_init/
        migration.sql
      migration_lock.toml
  src/
    index.ts
    config/
      database.ts
      env.ts
      upload.ts
    middleware/
      admin.ts
      auth.ts
      errorHandler.ts
    domains/
      admin/
      auth/
      organizations/
      sessions/
      users/
  uploads/
    plans/
```

## Main Files

| Path | Purpose |
| --- | --- |
| `src/index.ts` | Express app setup, middleware, static upload serving, router registration |
| `src/config/env.ts` | Environment variable loading |
| `src/config/database.ts` | Prisma client export |
| `src/config/upload.ts` | Campaign plan upload settings |
| `src/middleware/auth.ts` | JWT authentication |
| `src/middleware/admin.ts` | Admin role guard |
| `src/middleware/errorHandler.ts` | Shared error response handling |
| `src/domains/auth` | Registration and login |
| `src/domains/users` | Current user lookup |
| `src/domains/organizations` | Approved organization list/detail |
| `src/domains/sessions` | Campaign list/detail/create/update/delete and plan upload |
| `src/domains/admin` | Organization and campaign approval management |
| `prisma/schema.prisma` | Final DB schema |
| `prisma/migrations/20260415000000_init/migration.sql` | Single initial migration |
| `prisma/seed.ts` | Initial admin account creation |
