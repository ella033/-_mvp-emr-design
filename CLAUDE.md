# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Rules (MANDATORY)

All code MUST follow:

- Clean Code principles
- React Best Practices

These rules are strictly enforced.

## Project Overview

This is **NextGen EMR** (Electronic Medical Record), a Next.js 15 React application built for UBcare. It's a comprehensive healthcare management system with Korean language support.

**Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn/ui, Zustand, TanStack React Query, React Hook Form, Zod

## Cross-Project Context (NextEMR 멀티 프로젝트)

이 프로젝트는 NextEMR 시스템의 **프론트엔드 클라이언트** 입니다. 아래 3개 프로젝트가 하나의 시스템을 구성합니다.

| 프로젝트              | 경로                                   | 기술 스택                                    | 설명                                         |
| --------------------- | -------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| **백엔드 API**        | `C:\Users\woonbeombaek\nestjs-emr-api` | NestJS + Fastify + Prisma + PostgreSQL       | REST API 서버, DB 스키마 관리, 비즈니스 로직 |
| **프론트엔드** (현재) | `C:\Users\woonbeombaek\react-frontend` | Next.js 15 + React 19 + Tailwind + Shadcn/ui | 의료진용 EMR 클라이언트 (포트 8080)          |
| **어드민**            | `C:\Users\woonbeombaek\nextemr-admin`  | Next.js 16 + Tailwind v4 + Shadcn/ui         | 슈퍼 관리자 대시보드 (포트 3001)             |

### 크로스 프로젝트 작업 가이드

- **API 연동 시**: 백엔드의 컨트롤러, DTO, Swagger 문서를 참조하여 타입과 엔드포인트를 정확히 맞출 것. 백엔드 DTO가 source of truth.
- **다른 프로젝트 참조가 필요할 때**: 해당 프로젝트의 `CLAUDE.md`와 소스 코드를 직접 읽어서 컨텍스트를 파악할 것.
- **참조 전 최신화 확인**: 다른 프로젝트 코드를 참조할 때, 먼저 해당 프로젝트 디렉토리에서 `git log -1 --format="%h %s (%cr)"` 으로 마지막 커밋 시점을 확인하고, 1일 이상 오래된 경우 사용자에게 `cd {프로젝트경로} && git pull` 을 제안할 것.

## Development Commands

```bash
# Development
pnpm run dev          # Start dev server on port 8080 with turbopack
pnpm run dev:8081     # Alternative dev server on port 8081

# Building & Testing
pnpm run build        # Production build
pnpm run build-stats  # Build with bundle analyzer
pnpm run start        # Start production server
pnpm run test         # Run Vitest tests

# Code Quality
pnpm run lint         # ESLint check
pnpm run lint:fix     # ESLint with auto-fix
pnpm run check-types  # TypeScript type checking

# Git & Commits
pnpm run commit       # Commitizen for conventional commits
```

## Architecture Overview

### Authentication & Authorization

- **Cookie-based auth**: Uses httpOnly cookies (`accessToken`) for session management
- **Middleware**: `src/middleware.ts` protects routes - redirects to `/auth/sign-in` if unauthenticated
- **Auto token refresh**: `useAuthCheck()` hook refreshes tokens every 5 minutes
- **Protected routes**: All main application routes require authentication (reception, medical, payment, etc.)

### Data Flow Architecture

```
UI Components → Custom Hooks → Services → API Client → API Proxy → Backend API
```

1. **Custom Hooks** (`src/hooks/`): React Query hooks for data fetching/mutations
2. **Services** (`src/services/`): Business logic layer, calls ApiClient
3. **ApiClient** (`src/lib/api/api-client.ts`): Generic HTTP client with retry logic
4. **ApiProxy** (`src/lib/api/api-proxy.ts`): Low-level fetch wrapper with error handling

### State Management

- **React Query**: Server state, caching, and async data management
- **Zustand**: Client-side global state (selected patients, UI state, etc.)
- **React Hook Form + Zod**: Form state and validation

### Provider Hierarchy (Root Layout)

```
CustomThemeProvider (next-themes)
├── ReactQueryProvider (TanStack Query)
    ├── SidebarProvider (Shadcn sidebar)
        ├── AppSidebar
        ├── TopMenubar
        ├── InitialDataFetcher (loads base data)
        └── ToastProvider + SocketProvider + {children}
```

### API Configuration

- **API Proxy**: Next.js rewrites `/api/proxy/*` to backend API
- **Config**: Environment-based API URLs in `src/lib/config.ts`
- **Error Handling**: Automatic retry (3x) for 5xx errors with exponential backoff

## Key Development Patterns

### Custom Hook Pattern

```typescript
// Example: src/hooks/patient/use-patients-by-hospital.ts
export function usePatientsbyHospital(hospitalId: number) {
  return useQuery({
    queryKey: ["patients", "hospital", hospitalId],
    queryFn: () => PatientsService.getPatientsByHospital(hospitalId),
    enabled: !!hospitalId,
  });
}
```

### Service Layer Pattern

```typescript
// Example: src/services/patients-service.ts
export class PatientsService {
  static async getPatientsByHospital(hospitalId: number): Promise<Patient[]> {
    return await ApiClient.get(`/api/hospitals/${hospitalId}/patients`);
  }
}
```

### Store Pattern (Zustand)

```typescript
// Example: src/store/patient-store.ts
export const usePatientStore = create<PatientState>((set) => ({
  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
}));
```

## Component Organization

- **Pages**: `src/app/` (Next.js App Router)
- **Reusable UI**: `src/components/ui/` (Shadcn components)
- **Feature Components**: `src/components/` and `src/app/[feature]/_components/`
- **Types**: `src/types/` (TypeScript definitions)
- **Constants**: `src/constants/` (form options, enums, etc.)

## Development Guidelines

### File Organization

- Keep related files close together (hooks, services, types for same feature)
- Use feature-based folders for complex features
- Place shared components in `src/components/`

### API Patterns

- Always use custom hooks for data fetching
- Handle loading/error states in hooks, not components
- Use React Query for all server state
- Implement optimistic updates where appropriate

### No Magic Strings / Numbers

- 코드에 하드코딩된 문자열·숫자 값 대신 **enum, 상수(const), 타입**을 사용할 것
- 프로젝트에 이미 정의된 enum/상수가 있으면 반드시 재사용 (예: `ItemTypeCode.주사료_주사` 대신 `"0401"` 사용 금지)
- 새 매직 값이 필요하면 `src/constants/` 에 enum 또는 상수로 먼저 정의한 뒤 참조

### Error Handling

- ApiClient automatically retries 5xx errors
- Use try/catch in service methods
- Display user-friendly error messages
- Log errors for debugging

### Form Handling

- Use React Hook Form + Zod for all forms
- Define validation schemas in separate files
- Handle form submission errors gracefully

### Testing (TDD)

새로운 기능이나 버그 수정 시 **테스트 주도 개발(TDD)** 을 따른다:

1. **Red**: 실패하는 테스트를 먼저 작성
2. **Green**: 테스트를 통과하는 최소한의 코드 작성
3. **Refactor**: 코드를 정리하되 테스트는 계속 통과해야 함

#### 테스트 도구 및 실행

```bash
pnpm run test                   # Vitest 전체 실행
pnpm run test -- --watch        # 워치 모드
```

#### 테스트 작성 규칙

- **단위 테스트**: Vitest + React Testing Library
- **E2E 테스트**: Playwright (`src/tests/e2e/`)
- **파일 위치**: 소스 파일과 같은 위치에 `*.test.ts(x)` 파일 생성
- **Hook 테스트**: `renderHook` + QueryClient wrapper
- **API 모킹**: `vi.mock`으로 서비스 레이어 mock
- **컴포넌트 테스트**: `render`, `screen`, `userEvent` 패턴 사용

#### React 컴포넌트 테스트 패턴

```typescript
// Example: patient-list.test.tsx
describe('PatientList', () => {
  it('환자 목록을 렌더링한다', async () => {
    render(<PatientList />);
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
  });
});
```

#### Hook 테스트 패턴

```typescript
// Example: use-patients.test.ts
describe("usePatients", () => {
  it("환자 목록을 조회한다", async () => {
    const { result } = renderHook(() => usePatients(), {
      wrapper: QueryClientWrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

## Environment Setup

**Required**: Node.js 20+, pnpm

**Environment files needed**:

- `.env` (shared)
- `.env.local` (local overrides)
- `.env.development` (dev-specific)
- `.env.production` (prod-specific)

Reference `.env.example` for required variables.

## Monitoring & Quality

- **Sentry**: Error tracking and performance monitoring
- **Bundle Analyzer**: `pnpm run build-stats` for bundle analysis
- **Husky**: Pre-commit hooks for linting/formatting
- **Conventional Commits**: Use `pnpm run commit` for standardized commit messages
