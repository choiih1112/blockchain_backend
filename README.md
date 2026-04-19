# GiveChain 백엔드

블록체인 기반 기부 플랫폼의 REST API 서버입니다.

---

## 목차

1. [기술 스택](#기술-스택)
2. [시작하기](#시작하기)
3. [환경 변수](#환경-변수)
4. [프로젝트 구조](#프로젝트-구조)
5. [API 명세](#api-명세)
6. [인증 방식](#인증-방식)
7. [역할(Role) 시스템](#역할role-시스템)
8. [응답 형식](#응답-형식)
9. [DB 스키마 요약](#db-스키마-요약)
10. [프론트엔드 개발자를 위한 안내](#프론트엔드-개발자를-위한-안내)
11. [스마트컨트랙트 개발자를 위한 안내](#스마트컨트랙트-개발자를-위한-안내)

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 런타임 | Node.js 20 |
| 언어 | TypeScript 5 |
| 프레임워크 | Express 4 |
| ORM | Prisma 5 |
| DB | PostgreSQL |
| 인증 | JWT (HS256) |
| 파일 업로드 | multer |
| 유효성 검사 | zod |

---

## 시작하기

### 1. 패키지 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 아래 항목을 채운다. ([환경 변수](#환경-변수) 참고)

### 3. DB 마이그레이션

```bash
npm run db:migrate    # 마이그레이션 실행
npm run db:generate   # Prisma 클라이언트 생성
```

### 4. 관리자 계정 생성

```bash
npm run db:seed
```

`.env`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD`로 관리자 계정이 생성된다.

> **Docker로 실행하는 경우:** `npm run db:seed`는 `.env`의 `DATABASE_URL`(localhost:5432)로 연결된다. Docker DB 포트가 호스트 5432에 매핑되어 있으면 동일하게 동작한다. Docker 내부에서 직접 실행하려면:
> ```bash
> docker compose exec app node -e "
>   const bcrypt = require('bcryptjs');
>   const { PrismaClient } = require('@prisma/client');
>   const prisma = new PrismaClient();
>   bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
>     .then(h => prisma.user.create({ data: { email: process.env.ADMIN_EMAIL, passwordHash: h, role: 'ADMIN', nickname: '관리자' } }))
>     .then(() => { console.log('Done'); prisma.\$disconnect(); });
> "
> ```

### 5. 개발 서버 실행

```bash
npm run dev    # port 3000
```

---

### Docker로 실행하기

```bash
cd backend
docker compose up --build -d   # 이미지 빌드 + 컨테이너 시작
```

초기 실행 후 마이그레이션 적용 (테이블이 없을 경우):

```bash
docker compose exec app npx prisma migrate deploy
```

관리자 계정 생성 (최초 1회):

```bash
docker compose exec app node -e "
  const bcrypt = require('bcryptjs');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    .then(h => prisma.user.create({ data: { email: process.env.ADMIN_EMAIL, passwordHash: h, role: 'ADMIN', nickname: '관리자' } }))
    .then(() => { console.log('Admin created'); prisma.\$disconnect(); });
"
```

`docker-compose.yml`의 환경 변수:
- `FRONTEND_URL`: 콤마로 구분하여 복수 허용 가능 (`http://localhost:3001,http://192.168.x.x:3001`)

### 주요 명령어

```bash
npm run dev          # 개발 서버 (nodemon + ts-node)
npm run build        # TypeScript 컴파일 → dist/
npm start            # 프로덕션 서버 (dist/index.js)
npm test             # Jest 전체 실행
npm run db:migrate   # Prisma 마이그레이션
npm run db:generate  # Prisma 클라이언트 재생성 (schema 변경 후 필수)
npm run db:studio    # Prisma Studio GUI (port 5555)
npm run db:seed      # 관리자 계정 시드
```

---

## 환경 변수

`.env` 파일을 `backend/` 루트에 생성한다.

```env
# 서버
PORT=3000
NODE_ENV=development

# 데이터베이스
DATABASE_URL=postgresql://유저:비밀번호@localhost:5432/givechain

# JWT
JWT_SECRET=여기에_랜덤하고_긴_시크릿키_입력
JWT_EXPIRES_IN=7d

# CORS (프론트엔드 주소, 복수 허용 시 콤마로 구분)
FRONTEND_URL=http://localhost:3001,http://192.168.x.x:3001

# 관리자 시드 (db:seed 명령에서 사용)
ADMIN_EMAIL=admin@givechain.com
ADMIN_PASSWORD=Admin1234!
```

---

## 프로젝트 구조

```
backend/
├── prisma/
│   ├── schema.prisma      # DB 스키마
│   ├── seed.ts            # 관리자 계정 생성 스크립트
│   └── migrations/        # 마이그레이션 파일 (자동 생성)
├── src/
│   ├── index.ts           # 앱 진입점, 라우터 연결
│   ├── config/
│   │   ├── env.ts         # 환경 변수 로더
│   │   ├── database.ts    # PrismaClient 싱글턴
│   │   └── upload.ts      # multer 파일 업로드 설정
│   ├── middleware/
│   │   ├── auth.ts        # JWT 인증 미들웨어
│   │   ├── admin.ts       # 관리자 권한 미들웨어
│   │   └── errorHandler.ts
│   └── domains/
│       ├── auth/          # 회원가입, 로그인
│       ├── users/         # 내 정보, 지갑 주소
│       ├── organizations/ # 단체 목록/상세
│       ├── sessions/      # 기부 세션(캠페인)
│       ├── donations/     # 기부 기록
│       └── admin/         # 관리자 전용
└── uploads/
    └── plans/             # 업로드된 사용계획서 파일
```

각 도메인은 `router → controller → service` 3계층 구조를 따른다.

---

## API 명세

### 인증

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/auth/register` | 회원가입 | 불필요 |
| POST | `/api/auth/login` | 로그인, JWT 반환 | 불필요 |

**회원가입 요청 바디**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동",
  "role": "INDIVIDUAL",
  "orgName": "",
  "orgDescription": ""
}
```
- `role`: `INDIVIDUAL` | `ORGANIZATION` (관리자는 시드로만 생성)
- `orgName`: role이 `ORGANIZATION`일 때 필수
- `orgDescription`: 선택

**로그인 응답**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": "uuid",
    "role": "INDIVIDUAL"
  }
}
```

---

### 사용자

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/users/me` | 내 정보 조회 | 필요 |
| PATCH | `/api/users/me` | 닉네임 수정 | 필요 |
| PATCH | `/api/users/me/wallet` | 지갑 주소 저장 | 필요 |

**내 정보 조회 응답 (ORGANIZATION)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "org@example.com",
    "nickname": "운영자",
    "role": "ORGANIZATION",
    "walletAddress": "0xabc...",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "organization": {
      "id": "uuid",
      "name": "희망나눔재단",
      "approvalStatus": "APPROVED",
      "rejectReason": null
    }
  }
}
```

**지갑 주소 저장 요청 바디**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```
- `0x`로 시작하는 40자리 hex 주소 형식만 허용

---

### 단체

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/organizations` | 단체 전체 목록 | 불필요 |
| GET | `/api/organizations/:id` | 단체 상세 + 승인된 세션 목록 | 불필요 |

---

### 기부 세션 (캠페인)

| 메서드 | 경로 | 설명 | 인증 | 역할 |
|--------|------|------|------|------|
| GET | `/api/sessions` | 캠페인 목록 (승인된 것만) | 불필요 | - |
| GET | `/api/sessions/:id` | 캠페인 상세 + 기부 내역 | 불필요 | - |
| POST | `/api/sessions` | 캠페인 생성 | 필요 | ORGANIZATION |
| PATCH | `/api/sessions/:id` | 캠페인 수정 | 필요 | ORGANIZATION |
| DELETE | `/api/sessions/:id` | 캠페인 삭제 | 필요 | ORGANIZATION |
| POST | `/api/sessions/:id/plan` | 사용계획서 업로드 | 필요 | ORGANIZATION |

**캠페인 생성 요청 바디**
```json
{
  "title": "어린이 교육 지원 프로젝트",
  "description": "설명 (선택)",
  "goalAmount": 5000000,
  "deadline": "2026-12-31"
}
```

**사용계획서 업로드**
- `Content-Type: multipart/form-data`
- 필드명: `plan`
- 허용 형식: PDF, DOC, DOCX, HWP
- 최대 크기: 10MB
- 업로드 후 관리자가 검토 및 승인 → 승인되면 기부 가능

---

### 기부

| 메서드 | 경로 | 설명 | 인증 | 역할 |
|--------|------|------|------|------|
| POST | `/api/donations` | 기부 기록 생성 | 필요 | INDIVIDUAL |
| GET | `/api/donations/me` | 내 기부 내역 | 필요 | INDIVIDUAL |

**기부 요청 바디**
```json
{
  "sessionId": "uuid",
  "amount": 10000,
  "txHash": "0xabc123..."
}
```
- 프론트에서 MetaMask로 블록체인 트랜잭션 완료 후 txHash를 백엔드에 전달
- txHash는 중복 불가 (이미 사용된 해시는 409 반환)
- 승인된 세션(`approvalStatus: APPROVED`)에만 기부 가능

---

### 관리자

> 모든 경로는 `role: ADMIN` 계정의 JWT가 필요하다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/organizations` | 전체 단체 목록 (승인 상태 포함) |
| PATCH | `/api/admin/organizations/:id/approve` | 단체 승인 |
| PATCH | `/api/admin/organizations/:id/reject` | 단체 거절 |
| GET | `/api/admin/sessions` | 전체 세션 목록 (승인 상태 포함) |
| PATCH | `/api/admin/sessions/:id/approve` | 세션 승인 |
| PATCH | `/api/admin/sessions/:id/reject` | 세션 거절 |
| DELETE | `/api/admin/sessions/:id` | 세션 강제 삭제 |

**거절 요청 바디**
```json
{
  "reason": "서류가 미비합니다."
}
```

---

### 기타

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/stats` | 플랫폼 통계 (총 기부금, 활성 캠페인 수, 기부자 수) |
| GET | `/health` | 서버 상태 확인 |
| GET | `/uploads/plans/:filename` | 업로드된 사용계획서 파일 다운로드 |

---

## 인증 방식

로그인 후 발급받은 JWT를 모든 인증 필요 요청의 헤더에 포함한다.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

- 알고리즘: HS256
- 만료: 7일 (기본값, `JWT_EXPIRES_IN`으로 변경 가능)
- 페이로드: `{ userId, role }`

---

## 역할(Role) 시스템

| 역할 | 설명 | 가능한 행동 |
|------|------|-------------|
| `INDIVIDUAL` | 개인 기부자 | 캠페인 조회, 기부 |
| `ORGANIZATION` | 기부 단체 | 캠페인 생성/수정/삭제, 사용계획서 제출 |
| `ADMIN` | 관리자 | 단체·캠페인 승인/거절, 전체 관리 |

### 승인 흐름

```
ORGANIZATION 회원가입
  → approvalStatus: PENDING (기본값)
  → 관리자 승인 → APPROVED (캠페인 생성 가능)
  → 관리자 거절 → REJECTED

캠페인 생성
  → approvalStatus: PENDING
  → 사용계획서 제출
  → 관리자 승인 → APPROVED (기부 가능, 공개 목록에 표시)
  → 관리자 거절 → REJECTED
```

---

## 응답 형식

모든 API는 아래 형식으로 응답한다.

**성공**
```json
{
  "success": true,
  "data": { ... }
}
```

**실패**
```json
{
  "success": false,
  "message": "오류 메시지"
}
```

**주요 HTTP 상태 코드**

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 실패 (토큰 없음 또는 만료) |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (이메일 중복, txHash 중복 등) |
| 500 | 서버 내부 오류 |

---

## DB 스키마 요약

```
User
├── id, email, passwordHash, nickname, role, walletAddress, createdAt
├── organization (1:1, ORGANIZATION role만)
└── donations (1:N)

Organization
├── id, userId, name, description, approvalStatus, rejectReason, createdAt
└── sessions (1:N)

DonationSession
├── id, organizationId, title, description
├── goalAmount, currentAmount, status, approvalStatus
├── planFileUrl, rejectReason, deadline, contractSessionId, createdAt
└── donations (1:N)

DonationRecord
└── id, donorId, sessionId, amount, txHash, createdAt
```

**관계 삭제 정책:** 단체 삭제 시 해당 단체의 세션 및 기부 기록 자동 삭제 (Cascade)

---

## 프론트엔드 개발자를 위한 안내

### API 베이스 URL
- 로컬: `http://localhost:3000`
- 프론트 기본 포트: `3001` (백엔드와 분리)

### 인증 토큰 처리
- 로그인/회원가입 응답의 `data.token`을 저장 (localStorage 등)
- 이후 요청 헤더에 `Authorization: Bearer <token>` 포함

### 파일 서빙
- 사용계획서 URL 형식: `http://localhost:3000/uploads/plans/<파일명>`
- `DonationSession.planFileUrl` 값 앞에 API 베이스 URL을 붙여 사용

### 기부 흐름
1. 프론트에서 MetaMask로 컨트랙트에 직접 트랜잭션 전송
2. 트랜잭션 완료 후 `txHash` 획득
3. `POST /api/donations` 에 `{ sessionId, amount, txHash }` 전송
4. 백엔드가 DB에 기록 및 금액 누적 처리

### 지갑 연결 흐름
1. 프론트에서 MetaMask 연결 → 지갑 주소 획득
2. `PATCH /api/users/me/wallet` 에 `{ walletAddress }` 전송하여 DB 저장

---

## 스마트컨트랙트 개발자를 위한 안내

### 현재 연동 방식
백엔드와 컨트랙트는 **txHash**를 매개로 느슨하게 연결되어 있다.
프론트가 컨트랙트 트랜잭션을 직접 실행하고, 완료된 txHash를 백엔드에 전달하는 방식이다.

### DB에 저장되는 컨트랙트 관련 필드

| 모델 | 필드 | 설명 |
|------|------|------|
| `DonationRecord` | `txHash` | 기부 트랜잭션 해시. UNIQUE 제약 |
| `DonationSession` | `contractSessionId` | 컨트랙트 내 캠페인 ID (현재 미사용, 연동 시 활용) |
| `User` | `walletAddress` | 사용자 지갑 주소 |

### 컨트랙트 배포 후 연동이 필요한 부분

| 현재 백엔드 임시 처리 | 연동 후 변경 방향 |
|---------------------|-----------------|
| 기부 시 `currentAmount` DB에서 직접 누적 | 컨트랙트 `Donated` 이벤트 수신 후 업데이트 |
| 목표 달성 시 `status: COMPLETED` 전환 | 컨트랙트 `GoalReached` 이벤트 수신 후 전환 |

### 컨트랙트 배포 후 추가 개발 예정인 API

| 기능 | 설명 |
|------|------|
| 출금 요청 | 기관이 컨트랙트 `withdraw()` 호출 후 결과를 백엔드에 기록 |
| 사용 내역 등록 | 기관이 사용 내역 해시를 컨트랙트에 등록 후 백엔드에도 기록 |
| 이벤트 리스너 | 컨트랙트 이벤트를 수신해 DB 상태 동기화 |

### `contractSessionId` 활용 방법
캠페인 생성 시 컨트랙트에 캠페인을 등록하고, 반환된 컨트랙트 내 ID를 백엔드에 저장한다.
현재는 컬럼만 존재하며 값은 `null`이다.

```
캠페인 생성 흐름 (컨트랙트 연동 후)
  1. 관리자가 세션 승인
  2. 백엔드 or 프론트가 컨트랙트의 createCampaign() 호출
  3. 반환된 캠페인 ID를 DonationSession.contractSessionId에 저장
  4. 이후 기부 시 contractSessionId를 컨트랙트에 전달
```
