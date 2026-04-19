# GiveChain API 문서

Base URL: `http://localhost:3000`

모든 응답 형식:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "오류 메시지" }
```

인증이 필요한 엔드포인트는 `Authorization: Bearer <token>` 헤더 필요.

---

## Auth

### POST /api/auth/register
회원가입 (rate limit: 20req/15min)

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "nickname": "닉네임",
  "role": "INDIVIDUAL | ORGANIZATION",
  "orgName": "단체명 (role=ORGANIZATION 필수)"
}
```

### POST /api/auth/login
로그인 (rate limit: 20req/15min)

**Body:**
```json
{ "email": "user@example.com", "password": "Password1!" }
```

**Response data:** `{ token, user: { userId, email, nickname, role } }`

---

## Users

### GET /api/users/me `[AUTH]`
내 프로필 조회

**Response data:** `{ id, email, nickname, role, walletAddress, createdAt, organization? }`

### PATCH /api/users/me `[AUTH]`
내 프로필 수정

**Body:** `{ nickname: "새닉네임" }` (2~20자)

---

## Organizations

### GET /api/organizations
승인된 단체 목록 조회

**Response data:** `Organization[]`

### GET /api/organizations/:id
단체 상세 조회 (승인된 세션 포함)

**Response data:** `Organization & { sessions: DonationSession[] }`

---

## Sessions

### GET /api/sessions
기부 세션 전체 목록 (마감 세션 자동 CLOSED 처리)

**Response data:** `DonationSession[]` (organization 포함)

### GET /api/sessions/:id
세션 상세 조회 (기부 내역 포함, 금액 내림차순)

**Response data:** `DonationSession & { donations: DonationRecord[] }`

### POST /api/sessions `[AUTH, ORGANIZATION]`
세션 생성 (단체 승인 상태 APPROVED 필수)

**Body:**
```json
{
  "title": "캠페인 제목",
  "description": "설명 (선택)",
  "goalAmount": 1000000,
  "deadline": "2025-12-31T23:59:59Z"
}
```

**Response data:** 생성된 `DonationSession` (approvalStatus: PENDING)

### POST /api/sessions/:id/plan `[AUTH, ORGANIZATION]`
사용계획서 파일 제출 (재제출 시 approvalStatus 자동 PENDING 초기화)

**Form-data:** `plan` 필드에 파일 첨부 (PDF/DOC/DOCX/HWP, 최대 10MB)

### PATCH /api/sessions/:id `[AUTH, ORGANIZATION]`
세션 수정 (본인 단체 세션, ACTIVE 상태만 가능)

**Body:** `{ title?, description?, deadline? }`

### DELETE /api/sessions/:id `[AUTH, ORGANIZATION]`
세션 삭제 (기부 기록 없고, COMPLETED 아닌 세션만 가능)

---

## Donations

### POST /api/donations `[AUTH, INDIVIDUAL]`
기부 생성 (세션 approvalStatus APPROVED 필수)

**Body:**
```json
{
  "sessionId": "uuid",
  "amount": 10000,
  "txHash": "0x..."
}
```

### GET /api/donations/me `[AUTH]`
내 기부 내역 조회 (최신순)

**Response data:** `DonationRecord[]` (session 정보 포함)

---

## Admin `[AUTH, ADMIN]`

모든 어드민 API는 ADMIN 역할 계정 필요.
초기 어드민 계정: `npm run db:seed` 으로 생성 (`.env`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD` 참조)

### GET /api/admin/organizations
전체 단체 목록 (승인 상태 포함)

### PATCH /api/admin/organizations/:id/approve
단체 승인

### PATCH /api/admin/organizations/:id/reject
단체 거절

**Body:** `{ reason: "거절 사유" }`

### GET /api/admin/sessions
전체 기부 세션 목록 (승인 상태 포함)

### PATCH /api/admin/sessions/:id/approve
세션 승인 (이후 기부 가능)

### PATCH /api/admin/sessions/:id/reject
세션 거절

**Body:** `{ reason: "거절 사유" }`

### DELETE /api/admin/sessions/:id
세션 강제 삭제 (관련 기부 기록 함께 삭제)

---

## 파일 접근

업로드된 사용계획서: `GET /uploads/plans/<filename>`

---

## 역할별 권한 요약

| 기능 | INDIVIDUAL | ORGANIZATION | ADMIN |
|------|-----------|--------------|-------|
| 회원가입/로그인 | ✓ | ✓ | - |
| 내 프로필 조회/수정 | ✓ | ✓ | ✓ |
| 세션 목록/상세 조회 | ✓ | ✓ | ✓ |
| 세션 생성/수정/삭제 | ✗ | ✓ (승인 후) | ✗ |
| 사용계획서 제출 | ✗ | ✓ | ✗ |
| 기부 | ✓ | ✗ | ✗ |
| 내 기부 내역 | ✓ | ✗ | ✗ |
| 단체/세션 승인 관리 | ✗ | ✗ | ✓ |

## 세션 상태 흐름

```
ACTIVE (생성 시)
  → CLOSED (deadline 경과, lazy update)
  → COMPLETED (currentAmount >= goalAmount)

approvalStatus:
  PENDING (생성/사용계획서 제출 시)
  → APPROVED (관리자 승인, 기부 가능)
  → REJECTED (관리자 거절, 재제출 가능)
```
