# 백엔드 기능 현황 정리

> 기준: 2026-04-17

---

## 1. 구현 완료된 기능

| 기능 | 파일 |
|------|------|
| 회원가입 (INDIVIDUAL / ORGANIZATION / ADMIN) | `src/domains/auth/auth.service.ts`, `auth.router.ts`, `auth.controller.ts` |
| 로그인 (JWT 발급) | `src/domains/auth/auth.service.ts` |
| JWT 인증 미들웨어 | `src/middleware/auth.ts` |
| 관리자 권한 미들웨어 | `src/middleware/admin.ts` |
| 내 정보 조회 / 닉네임 수정 | `src/domains/users/users.service.ts`, `users.router.ts`, `users.controller.ts` |
| 지갑 주소 연결 (`PATCH /api/users/me/wallet`) | `src/domains/users/users.service.ts` → `updateWallet()`, `users.controller.ts`, `users.router.ts` |
| 단체 목록 조회 | `src/domains/organizations/organizations.service.ts` → `getAll()` |
| 단체 상세 조회 (승인된 세션 포함) | `src/domains/organizations/organizations.service.ts` → `getById()` |
| 캠페인(세션) 생성 (ORGANIZATION 전용) | `src/domains/sessions/sessions.service.ts` → `create()` |
| 캠페인 목록 조회 (승인된 것만 공개) | `src/domains/sessions/sessions.service.ts` → `getAll()` |
| 캠페인 상세 조회 | `src/domains/sessions/sessions.service.ts` → `getById()` |
| 캠페인 수정 / 삭제 | `src/domains/sessions/sessions.service.ts` → `update()`, `remove()` |
| 캠페인 계획서(사용계획서) 파일 업로드 | `src/domains/sessions/sessions.service.ts` → `uploadPlan()`, `src/config/upload.ts` |
| 기부 기록 생성 (txHash 중복 검사, 원자적 금액 누적) | `src/domains/donations/donations.service.ts` → `create()` |
| 내 기부 내역 조회 | `src/domains/donations/donations.service.ts` → `getMyDonations()` |
| 관리자 - 단체 목록 조회 | `src/domains/admin/admin.service.ts` → `getOrganizations()` |
| 관리자 - 단체 승인 / 거절 | `src/domains/admin/admin.service.ts` → `approveOrganization()`, `rejectOrganization()` |
| 관리자 - 세션(캠페인) 목록 조회 | `src/domains/admin/admin.service.ts` → `getSessions()` |
| 관리자 - 세션 승인 / 거절 | `src/domains/admin/admin.service.ts` → `approveSession()`, `rejectSession()` |
| 관리자 - 세션 강제 삭제 | `src/domains/admin/admin.service.ts` → `deleteSession()` |
| 관리자 계정 시드 생성 | `prisma/seed.ts` |
| 플랫폼 통계 (총 기부금 / 활성 캠페인 수 / 기부자 수) | `src/index.ts` → `GET /api/stats` |
| 정적 파일 서빙 (업로드된 계획서) | `src/index.ts` → `app.use('/uploads', ...)` |
| DB 스키마 (User / Organization / DonationSession / DonationRecord) | `prisma/schema.prisma` |
| Cascade 삭제 (단체 삭제 → 세션 → 기부기록) | `prisma/schema.prisma` → `onDelete: Cascade` |
| 마감일 자동 상태 전환 (ACTIVE → CLOSED) | `sessions.service.ts` → `getAll()`, `getById()` lazy update |
| 목표 달성 시 자동 완료 처리 (ACTIVE → COMPLETED) | `donations.service.ts` → `create()` 트랜잭션 내부 |

---

## 2. 미구현 — 스마트컨트랙트 연동 후 구현 예정

아래 기능은 백엔드 단독으로는 구현하지 않고, 스마트컨트랙트 배포 이후 연동 시 함께 개발한다.

| 기능 | 이유 |
|------|------|
| **출금 요청 API** | 실제 출금은 컨트랙트의 `withdraw()` 함수가 처리. 백엔드는 컨트랙트 호출 결과를 기록하는 역할로 제한 |
| **기관 사용 내역 등록 API** | 사용 내역 해시를 블록체인에 기록하는 컨트랙트 함수(`recordUsage()`)와 함께 구현 |
| **블록체인 이벤트 리스너** | 컨트랙트 이벤트(`Donated`, `GoalReached`, `Withdrawn` 등)를 수신해 DB를 동기화하는 리스너. 컨트랙트 배포 주소가 확정된 후 구현 |

---

## 3. 스마트컨트랙트와 역할 분담

현재 백엔드가 담당하는 아래 로직은 **컨트랙트가 없는 동안의 임시 구현**이다.
컨트랙트 배포 후 이벤트 리스너 방식으로 교체한다.

| 현재 백엔드 로직 | 위치 | 컨트랙트 연동 후 변경 방향 |
|----------------|------|--------------------------|
| 기부 금액 누적 (`currentAmount += amount`) | `donations.service.ts` → `create()` | 컨트랙트 `Donated` 이벤트 수신 후 업데이트 |
| 목표 달성 시 COMPLETED 전환 | `donations.service.ts` → `create()` | 컨트랙트 `GoalReached` 이벤트 수신 후 전환 |
| txHash 중복 검사 | `donations.service.ts` → `create()` | 컨트랙트가 온체인 중복을 막으므로 백엔드는 보조 검사로 유지 가능 |

---

## 4. API 엔드포인트 목록

```
POST   /api/auth/register              # 회원가입
POST   /api/auth/login                 # 로그인

GET    /api/users/me                   # 내 정보 조회
PATCH  /api/users/me                   # 닉네임 수정
PATCH  /api/users/me/wallet            # 지갑 주소 연결

GET    /api/organizations              # 단체 목록
GET    /api/organizations/:id          # 단체 상세

GET    /api/sessions                   # 캠페인 목록 (승인된 것만)
GET    /api/sessions/:id               # 캠페인 상세
POST   /api/sessions                   # 캠페인 생성 [ORGANIZATION]
PATCH  /api/sessions/:id               # 캠페인 수정 [ORGANIZATION]
DELETE /api/sessions/:id               # 캠페인 삭제 [ORGANIZATION]
POST   /api/sessions/:id/plan          # 사용계획서 업로드 [ORGANIZATION]

POST   /api/donations                  # 기부 기록 생성 [INDIVIDUAL]
GET    /api/donations/me               # 내 기부 내역 [INDIVIDUAL]

GET    /api/admin/organizations              # 단체 목록 [ADMIN]
PATCH  /api/admin/organizations/:id/approve  # 단체 승인 [ADMIN]
PATCH  /api/admin/organizations/:id/reject   # 단체 거절 [ADMIN]
GET    /api/admin/sessions                   # 세션 목록 [ADMIN]
PATCH  /api/admin/sessions/:id/approve       # 세션 승인 [ADMIN]
PATCH  /api/admin/sessions/:id/reject        # 세션 거절 [ADMIN]
DELETE /api/admin/sessions/:id               # 세션 삭제 [ADMIN]

GET    /api/stats                      # 플랫폼 통계 (공개)
GET    /health                         # 헬스체크
```
