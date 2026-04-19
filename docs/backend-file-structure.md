# 백엔드 폴더 및 파일 구조

> 기준: 2026-04-17

---

## 전체 구조

```
backend/
├── prisma/
│   ├── schema.prisma          # DB 스키마 정의
│   ├── seed.ts                # 초기 관리자 계정 생성 스크립트
│   └── migrations/            # Prisma 자동 생성 마이그레이션 파일
├── src/
│   ├── index.ts               # 앱 진입점
│   ├── config/                # 환경 설정
│   ├── middleware/            # 공통 미들웨어
│   └── domains/               # 도메인별 비즈니스 로직
│       ├── auth/
│       ├── users/
│       ├── organizations/
│       ├── sessions/
│       ├── donations/
│       └── admin/
├── uploads/
│   └── plans/                 # 업로드된 사용계획서 파일 저장 경로
├── .env                       # 환경 변수 (git 제외)
├── package.json
└── tsconfig.json
```

---

## 파일별 설명

### 진입점

| 파일 | 설명 |
|------|------|
| `src/index.ts` | Express 앱 생성, 미들웨어 등록, 라우터 연결, `/api/stats` · `/health` 엔드포인트 정의, 서버 실행 |

---

### config/ — 환경 설정

| 파일 | 설명 |
|------|------|
| `src/config/env.ts` | 환경 변수를 타입 안전하게 로드. 필수 변수 누락 시 서버 시작을 막음 (`PORT`, `DATABASE_URL`, `JWT_SECRET` 등) |
| `src/config/database.ts` | PrismaClient 싱글턴 인스턴스 생성 및 export |
| `src/config/upload.ts` | multer 설정. 파일을 `uploads/plans/`에 저장, PDF/DOC/DOCX/HWP만 허용, 최대 10MB 제한 |

---

### middleware/ — 공통 미들웨어

| 파일 | 설명 |
|------|------|
| `src/middleware/auth.ts` | JWT 검증 미들웨어(`authenticate`). `Authorization: Bearer <token>` 헤더를 파싱해 `req.user = { userId, role }` 주입. `AuthRequest` 타입 export |
| `src/middleware/admin.ts` | 관리자 권한 검사 미들웨어(`requireAdmin`). `req.user.role !== 'ADMIN'`이면 403 반환 |
| `src/middleware/errorHandler.ts` | `AppError` 클래스 정의 + 전역 에러 핸들러. `AppError`는 `{ success: false, message }` 형식으로 응답, 그 외 에러는 500 반환 |

---

### domains/auth/ — 인증

| 파일 | 설명 |
|------|------|
| `auth.router.ts` | `/api/auth` 라우터. `POST /register`, `POST /login` |
| `auth.controller.ts` | 요청 파싱 및 유효성 검사 후 서비스 호출, 응답 반환 |
| `auth.service.ts` | 회원가입(이메일 중복 검사, 비밀번호 해싱, ORGANIZATION이면 단체 동시 생성), 로그인(비밀번호 검증, JWT 발급) |

---

### domains/users/ — 사용자

| 파일 | 설명 |
|------|------|
| `users.router.ts` | `/api/users` 라우터. `GET /me`, `PATCH /me`, `PATCH /me/wallet` — 모두 `authenticate` 필요 |
| `users.controller.ts` | 요청 유효성 검사(zod) 후 서비스 호출 |
| `users.service.ts` | 내 정보 조회(`getMe`), 닉네임 수정(`updateMe`), 지갑 주소 저장(`updateWallet`) |

---

### domains/organizations/ — 단체

| 파일 | 설명 |
|------|------|
| `organizations.router.ts` | `/api/organizations` 라우터. `GET /` (목록), `GET /:id` (상세) — 인증 불필요 |
| `organizations.controller.ts` | 서비스 호출 및 응답 반환 |
| `organizations.service.ts` | 단체 전체 목록 조회(`getAll`), 단체 상세 조회(`getById`) — 상세에는 APPROVED 세션 전체 포함 (ACTIVE/COMPLETED/CLOSED 모두) |

---

### domains/sessions/ — 기부 세션(캠페인)

| 파일 | 설명 |
|------|------|
| `sessions.router.ts` | `/api/sessions` 라우터. 목록·상세는 공개, 생성·수정·삭제·계획서 업로드는 `authenticate` 필요. multer 에러(파일 형식/크기)를 400으로 처리하는 래퍼 포함 |
| `sessions.controller.ts` | 요청 유효성 검사 후 서비스 호출 |
| `sessions.service.ts` | 세션 생성(단체 승인 여부 확인), 목록(APPROVED만 반환, 마감일 지난 것 자동 CLOSED 처리), 상세 조회, 수정, 삭제, 사용계획서 URL 저장(`uploadPlan`) |

---

### domains/donations/ — 기부

| 파일 | 설명 |
|------|------|
| `donations.router.ts` | `/api/donations` 라우터. `POST /` (기부), `GET /me` (내 내역) — 모두 `authenticate` 필요 |
| `donations.controller.ts` | 요청 유효성 검사 후 서비스 호출 |
| `donations.service.ts` | 기부 생성(세션 승인·활성 여부 확인, txHash 중복 검사, Prisma 트랜잭션으로 금액 누적 + 목표 달성 시 COMPLETED 전환), 내 기부 내역 조회 |

---

### domains/admin/ — 관리자

| 파일 | 설명 |
|------|------|
| `admin.router.ts` | `/api/admin` 라우터. 모든 경로에 `authenticate + requireAdmin` 적용 |
| `admin.controller.ts` | 요청 파싱 후 서비스 호출 |
| `admin.service.ts` | 단체 목록 조회, 단체 승인/거절, 세션 목록 조회, 세션 승인/거절/삭제 |

---

### prisma/ — 데이터베이스

| 파일/폴더 | 설명 |
|-----------|------|
| `prisma/schema.prisma` | DB 모델 정의. `User`, `Organization`, `DonationSession`, `DonationRecord`. `Role`, `SessionStatus`, `ApprovalStatus` enum 포함. Cascade 삭제 설정 |
| `prisma/seed.ts` | 환경 변수(`ADMIN_EMAIL`, `ADMIN_PASSWORD`)로 관리자 계정 생성. `npm run db:seed`로 실행 |
| `prisma/migrations/` | `prisma migrate dev` 실행 시 자동 생성되는 SQL 마이그레이션 파일 |

---

### uploads/ — 업로드 파일

| 경로 | 설명 |
|------|------|
| `uploads/plans/` | 단체가 제출한 사용계획서 파일이 저장되는 경로. `GET /uploads/plans/<파일명>`으로 정적 서빙됨 |
