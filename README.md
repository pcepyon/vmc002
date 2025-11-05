# VMC002 - 최소 스펙 LMS (Learning Management System)

강사가 코스를 개설·운영하고, 학습자가 수강·과제 제출·피드백 수령까지 할 수 있는 경량 LMS 형태의 웹 애플리케이션입니다.

## 프로젝트 개요

**핵심 목표**
- 역할 기반 플로우의 정확한 가드 (강사/학습자)
- 마감/지각/재제출 등 상태 기반 비즈니스 룰 구현
- 문서 주도(Usecase) 개발 프로세스의 실전 적용

**주요 특징**
- Supabase Auth 기반 인증 시스템
- Next.js 15 App Router + React 19 기반
- Hono를 활용한 타입 세이프 백엔드 API
- 완전한 TypeScript 지원

## 주요 기능

### 학습자 (Learner)
- 코스 탐색 및 수강신청
- 과제 제출 및 재제출
- 성적 및 피드백 확인
- 개인 대시보드 (진행률, 마감 임박 과제)

### 강사 (Instructor)
- 코스 생성 및 관리 (draft/published/archived)
- 과제 생성 및 관리 (draft/published/closed)
- 제출물 채점 및 피드백 제공
- 재제출 요청 관리
- 강사 전용 대시보드

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 15.1.0 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI, Radix UI
- **Icons**: Lucide React
- **State Management**:
  - Zustand (클라이언트 상태)
  - TanStack React Query 5 (서버 상태)
- **Form**: React Hook Form 7 + Zod
- **Utilities**:
  - date-fns 4 (날짜 처리)
  - es-toolkit (유틸리티 함수)
  - ts-pattern 5 (패턴 매칭)
  - react-use 17 (React 훅 모음)

### 백엔드
- **API Framework**: Hono 4.9.9
- **BaaS**: Supabase (Database + Auth)
- **Validation**: Zod 3 + @hono/zod-validator
- **HTTP Client**: Axios 1.7.9

### 개발 도구
- **Linting**: ESLint 9
- **Package Manager**: npm

## 시작하기

### 1. 환경 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Configuration (optional)
NEXT_PUBLIC_API_BASE_URL=
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 마이그레이션

Supabase 프로젝트에 마이그레이션 파일을 적용합니다:

```bash
# supabase/migrations/ 디렉토리의 SQL 파일들을
# Supabase 대시보드의 SQL Editor에서 실행하거나
# Supabase CLI를 사용하여 적용
```

주요 마이그레이션:
- `0001_create_base_schema.sql`: 기본 테이블 및 비즈니스 로직
- `0002_create_auth_user_trigger.sql`: 인증 사용자 트리거

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

### 5. 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── app/                      # Next.js App Router
│   ├── (protected)/         # 인증 보호된 라우트
│   │   └── dashboard/       # 대시보드 페이지
│   ├── api/[[...hono]]/     # Hono API 엔드포인트
│   ├── auth/                # 인증 관련 페이지
│   ├── courses/             # 코스 페이지
│   ├── manage/              # 강사 관리 페이지
│   └── my-courses/          # 학습자 코스 페이지
│
├── backend/                  # 백엔드 레이어
│   ├── hono/                # Hono 앱 설정
│   ├── middleware/          # 공통 미들웨어
│   ├── http/                # HTTP 응답 헬퍼
│   ├── supabase/            # Supabase 클라이언트
│   └── config/              # 환경 변수 설정
│
├── features/                 # 기능별 모듈
│   ├── [feature]/
│   │   ├── backend/         # 백엔드 로직
│   │   │   ├── route.ts     # Hono 라우터
│   │   │   ├── service.ts   # 비즈니스 로직
│   │   │   ├── schema.ts    # Zod 스키마
│   │   │   └── error.ts     # 에러 코드
│   │   ├── components/      # React 컴포넌트
│   │   ├── hooks/           # React 훅
│   │   └── lib/             # 유틸리티
│   │
│   ├── assignment/          # 과제 관리
│   ├── course/              # 코스 관리
│   ├── enrollment/          # 수강신청
│   ├── grades/              # 성적 관리
│   ├── grading/             # 채점 관리
│   ├── submission/          # 제출물 관리
│   ├── dashboard/           # 대시보드
│   └── profile/             # 프로필 관리
│
├── components/              # 공통 UI 컴포넌트
│   └── ui/                  # Shadcn UI 컴포넌트
│
├── lib/                     # 유틸리티 함수
├── hooks/                   # 공통 훅
├── constants/               # 상수
└── middleware/              # Next.js 미들웨어

supabase/
└── migrations/              # 데이터베이스 마이그레이션

docs/                        # 프로젝트 문서
├── prd.md                   # 제품 요구사항 문서
├── ia.md                    # 정보 구조
├── database.md              # 데이터베이스 설계
└── userflow.md              # 사용자 플로우
```

## 데이터베이스 스키마

### 주요 테이블

- **profiles**: 사용자 프로필 (역할: learner/instructor)
- **courses**: 코스 정보
- **enrollments**: 수강신청
- **assignments**: 과제
- **submissions**: 과제 제출물
- **terms_agreements**: 약관 동의 이력

### 주요 Enum 타입

- **user_role**: `learner`, `instructor`
- **course_status**: `draft`, `published`, `archived`
- **assignment_status**: `draft`, `published`, `closed`
- **submission_status**: `submitted`, `graded`, `resubmission_required`
- **difficulty_level**: `beginner`, `intermediate`, `advanced`

## 주요 비즈니스 로직

### 역할 기반 권한
- 강사만 코스 생성 가능 (DB 트리거로 검증)
- 학습자만 수강신청 가능 (DB 트리거로 검증)

### 과제 제출 정책
- 마감일 확인 및 지각 처리
- 지각 제출 허용 여부 정책
- 재제출 허용 여부 정책
- 버전 관리 지원

### 상태 전환
- 코스: draft → published → archived
- 과제: draft → published → closed
- 제출물: submitted → graded / resubmission_required

## API 아키텍처

### Hono + Next.js Route Handler

모든 API 요청은 `/api/*` 경로로 Hono 앱에 위임됩니다:

```typescript
// src/app/api/[[...hono]]/route.ts
export const { GET, POST, PUT, PATCH, DELETE } = handle(createHonoApp());
```

### 미들웨어 체인

1. **errorBoundary**: 에러 로깅 및 5xx 응답 정규화
2. **withAppContext**: 환경 변수 파싱 및 logger 주입
3. **withSupabase**: Supabase 서버 클라이언트 주입 (service-role)

### 응답 포맷

모든 API 응답은 표준화된 포맷을 사용합니다:

```typescript
// 성공
{ success: true, data: {...} }

// 실패
{ success: false, error: { code: "ERROR_CODE", message: "..." } }
```

## 개발 가이드라인

프로젝트는 다음 원칙을 따릅니다:

### 코드 스타일
- 모든 컴포넌트는 Client Component (`'use client'`)
- Early Returns 패턴 사용
- 함수형 프로그래밍 선호
- 타입 안전성 최우선
- DRY (Don't Repeat Yourself) 원칙

### 라이브러리 사용 규칙
- 날짜 처리: `date-fns`
- 분기 로직: `ts-pattern`
- 서버 상태: `@tanstack/react-query`
- 클라이언트 상태: `zustand`
- 유틸리티: `es-toolkit`
- 아이콘: `lucide-react`
- 검증: `zod`
- UI: `shadcn-ui` + `tailwindcss`

### Shadcn UI 컴포넌트 추가

```bash
npx shadcn@latest add [component-name]
```

예시:
```bash
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
```

## Supabase 설정

### 마이그레이션 추가

새 테이블이나 스키마 변경이 필요한 경우:

1. `supabase/migrations/` 디렉토리에 새 SQL 파일 생성
2. 파일명 형식: `0001_description.sql` (번호 순서 중요)
3. 마이그레이션 작성 시 주의사항:
   - `IF NOT EXISTS` 사용으로 멱등성 보장
   - `updated_at` 트리거 추가
   - 적절한 인덱스 생성
   - RLS는 비활성화 (명시적으로 `DISABLE ROW LEVEL SECURITY`)

### 타입 생성 (선택사항)

```bash
npx supabase gen types typescript --project-id [project-id] > src/types/supabase.ts
```

## 사용 가능한 명령어

```bash
# 개발 서버 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 린팅
npm run lint
```

## 주요 페이지 라우트

### 공개 페이지
- `/` - 홈 (코스 카탈로그로 리다이렉트)
- `/courses` - 코스 카탈로그
- `/courses/[courseId]` - 코스 상세
- `/auth/signin` - 로그인
- `/auth/signup` - 회원가입
- `/auth/onboarding` - 온보딩 (역할 선택)

### 학습자 페이지 (인증 필요)
- `/dashboard/learner` - 학습자 대시보드
- `/my-courses` - 내 수강 코스
- `/my-courses/[courseId]` - 코스 상세
- `/my-courses/[courseId]/assignments/[assignmentId]` - 과제 상세
- `/my-courses/[courseId]/assignments/[assignmentId]/submit` - 과제 제출
- `/my-courses/[courseId]/grades` - 성적 확인

### 강사 페이지 (인증 + 강사 역할 필요)
- `/dashboard/instructor` - 강사 대시보드
- `/manage/courses` - 코스 관리
- `/manage/courses/new` - 코스 생성
- `/manage/courses/[courseId]/edit` - 코스 수정
- `/manage/courses/[courseId]/assignments` - 과제 관리
- `/manage/courses/[courseId]/assignments/[assignmentId]/submissions` - 제출물 관리

## 문서

상세한 프로젝트 문서는 `docs/` 디렉토리에서 확인할 수 있습니다:

- **PRD** (`prd.md`): 제품 요구사항 문서
- **IA** (`ia.md`): 정보 구조 및 페이지 플로우
- **Database** (`database.md`): 데이터베이스 설계
- **Userflow** (`userflow.md`): 사용자 여정 및 플로우

## 개발 가이드

### 새 기능 추가하기

1. `src/features/[feature-name]` 디렉토리 생성
2. 백엔드 레이어 구현:
   - `backend/schema.ts`: Zod 스키마 정의
   - `backend/service.ts`: Supabase 비즈니스 로직
   - `backend/route.ts`: Hono 라우터
   - `backend/error.ts`: 에러 코드
3. 프론트엔드 레이어 구현:
   - `components/`: React 컴포넌트
   - `hooks/`: React Query 훅
   - `lib/dto.ts`: 스키마 재노출 (필요시)
4. `src/backend/hono/app.ts`에 라우터 등록

### 환경 변수 추가하기

1. `src/backend/config/env.ts`에 Zod 스키마 추가
2. `.env.local`에 값 설정
3. `src/backend/hono/context.ts`의 `AppEnv` 타입 업데이트

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Hono 문서](https://hono.dev)
- [Shadcn UI](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)

## 라이선스

Private Project

---

이 프로젝트는 [`EasyNext`](https://github.com/easynext/easynext)를 기반으로 생성되었습니다.
