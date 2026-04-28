# Backend API

Base URL: `http://localhost:3000`

All successful API responses use:

```json
{ "success": true, "data": {} }
```

Error responses use:

```json
{ "success": false, "message": "error message" }
```

Protected endpoints require `Authorization: Bearer <token>`.

## Auth

### POST /api/auth/register

Registers an individual user or organization account.

```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "nickname": "nickname",
  "role": "INDIVIDUAL",
  "orgName": "Organization name",
  "orgDescription": "Optional organization description"
}
```

`orgName` is required when `role` is `ORGANIZATION`.

### POST /api/auth/login

```json
{
  "email": "user@example.com",
  "password": "Password1!"
}
```

Returns `{ token, userId, role }`.

## Users

### GET /api/users/me `[AUTH]`

Returns the authenticated user's basic information and organization status when available.

## Organizations

### GET /api/organizations

Returns approved organizations only.

### GET /api/organizations/:id

Returns an approved organization's detail and approved campaigns.

## Campaigns

The code uses the existing `DonationSession` model and `/api/sessions` path for campaigns.

### GET /api/sessions

Returns approved campaigns only.

### GET /api/sessions/:id

Returns an approved campaign detail.

### POST /api/sessions `[AUTH, ORGANIZATION]`

Creates a campaign. The organization must already be approved.

```json
{
  "title": "Campaign title",
  "description": "Optional description",
  "goalAmount": 1000000,
  "deadline": "2026-12-31T23:59:59Z"
}
```

New campaigns start with `approvalStatus: PENDING`.

### PATCH /api/sessions/:id `[AUTH, ORGANIZATION]`

Updates an owned campaign and resets it to `PENDING`.

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "goalAmount": 1200000,
  "deadline": "2026-12-31T23:59:59Z"
}
```

### DELETE /api/sessions/:id `[AUTH, ORGANIZATION]`

Deletes an owned campaign when it has no donation records.

### POST /api/sessions/:id/plan `[AUTH, ORGANIZATION]`

Uploads a campaign plan file and resets the campaign to `PENDING`.

Form-data field: `plan`

Allowed extensions: `pdf`, `doc`, `docx`, `hwp`

Max size: 10MB

Uploaded files are served from `/uploads/plans/<filename>`.

## Admin

All admin endpoints require an `ADMIN` account.

Create the initial admin account with:

```bash
npm run db:seed
```

### GET /api/admin/organizations

Returns all organizations with approval status.

### PATCH /api/admin/organizations/:id/approve

Approves an organization.

### PATCH /api/admin/organizations/:id/reject

Rejects an organization.

```json
{ "reason": "Reject reason" }
```

### GET /api/admin/sessions

Returns all campaigns with approval status.

### PATCH /api/admin/sessions/:id/approve

Approves a campaign. A plan file must be uploaded first.

### PATCH /api/admin/sessions/:id/reject

Rejects a campaign.

```json
{ "reason": "Reject reason" }
```

### DELETE /api/admin/sessions/:id

Deletes a campaign and its donation records.

## Health

### GET /health

Returns `{ "status": "ok" }`.
