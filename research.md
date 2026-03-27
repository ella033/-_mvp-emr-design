# NextEMR Frontend (react-frontend) - Research Document

> 이 문서는 프론트엔드 프로젝트의 구조, 아키텍처, 상태관리, 데이터 흐름을 깊이 분석한 결과입니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | NextGen EMR (UBcare) |
| **버전** | 0.1.0 |
| **프레임워크** | Next.js 15.3 + React 19 (App Router) |
| **언어** | TypeScript 5 (strict mode) |
| **패키지 매니저** | pnpm 10.17 |
| **Node.js** | >= 20 |
| **빌드 도구** | Turbopack (dev), Webpack (prod) |
| **UI 라이브러리** | Shadcn/ui (New York style) + Tailwind CSS 4 |
| **상태관리** | Zustand 5 (클라이언트) + TanStack React Query 5 (서버) |
| **폼 관리** | React Hook Form 7 + Zod 3 |
| **실시간 통신** | Socket.io Client |
| **개발 포트** | 8080 (기본), 8081 (대체) |
| **소스 규모** | ~1,834 TSX/TS 파일, ~19MB |

---

## 2. 기술 스택 상세

### 2.1 핵심 프레임워크 & UI

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | 15.3.6 | SSR/SSG 프레임워크 |
| `react` / `react-dom` | 19.1.2 | UI 라이브러리 |
| `tailwindcss` | 4.1.10 | 유틸리티 CSS |
| `@radix-ui/*` | 다수 | Headless UI 프리미티브 |
| `lucide-react` | 0.517 | 아이콘 |
| `motion` | 12.35 | 애니메이션 |
| `next-themes` | 0.4.6 | 다크모드 |

### 2.2 데이터 관리

| 패키지 | 용도 |
|--------|------|
| `zustand` 5.0 | 클라이언트 상태 (32개 스토어) |
| `@tanstack/react-query` 5.80 | 서버 상태 캐싱/동기화 |
| `react-hook-form` 7.58 | 폼 상태 관리 |
| `zod` 3.25 | 스키마 유효성 검증 |
| `axios` 1.13 | HTTP 클라이언트 |
| `socket.io-client` 4.8 | WebSocket 실시간 통신 |

### 2.3 리치 텍스트 & 문서

| 패키지 | 용도 |
|--------|------|
| `@tiptap/*` | 리치 텍스트 에디터 (14+ 확장) |
| `pdfjs-dist` 5.4 | PDF 뷰어 |
| `pdf-lib` 1.17 | PDF 생성/편집 |
| `jspdf` + `jspdf-autotable` | PDF 테이블 내보내기 |
| `react-pdf` 10.2 | PDF 렌더링 |
| `html-to-image` | 스크린샷 캡처 |
| `pagedjs` 0.4 | 인쇄 레이아웃 |

### 2.4 의료/비즈니스 특화

| 패키지 | 용도 |
|--------|------|
| `xlsx` 0.18 | Excel 가져오기/내보내기 |
| `hangul-js` 0.2 | 한글 초성 검색 |
| `react-daum-postcode` | 한국 주소 검색 (다음 API) |
| `react-calendar` 6.0 | 달력 컴포넌트 |
| `konva` + `react-konva` | 캔버스 기반 드로잉 |
| `qrcode.react` | QR 코드 생성 |

### 2.5 드래그앤드롭 & 가상화

| 패키지 | 용도 |
|--------|------|
| `@dnd-kit/*` | 드래그 앤 드롭 (정렬 포함) |
| `@tanstack/react-virtual` | 대규모 리스트 가상 스크롤 |
| `@floating-ui/react` | 플로팅 UI 요소 |
| `rc-dock` | 도킹 가능한 패널 레이아웃 |

### 2.6 차트 & 분석

| 패키지 | 용도 |
|--------|------|
| `recharts` 3.1 | 데이터 시각화 |
| `posthog-js` 1.258 | 사용자 분석 |
| `@spotlight-js/spotlight` | 디버깅 |

### 2.7 시스템 통합

| 패키지 | 용도 |
|--------|------|
| `xterm` + `@xterm/addon-fit` | 터미널 에뮬레이션 |
| `puppeteer` 24.28 | 헤드리스 브라우저 (PDF 생성) |
| `@azure/storage-blob` | Azure Blob Storage |
| `jsonwebtoken` | JWT 토큰 처리 |

### 2.8 개발 도구

| 도구 | 용도 |
|------|------|
| ESLint 9 (`@antfu/eslint-config`) | 코드 린팅 |
| Prettier 3.5 | 코드 포맷팅 |
| Vitest 3.2 + Testing Library | 단위 테스트 |
| Playwright 1.53 | E2E 테스트 |
| Husky 9.1 | Git 훅 |
| commitlint | 커밋 메시지 규칙 |
| semantic-release | 자동 버전 관리 |
| `@next/bundle-analyzer` | 번들 크기 분석 |

---

## 3. 프로젝트 디렉토리 구조

```
react-frontend/
├── src/
│   ├── app/                     # Next.js App Router (22개 주요 라우트)
│   ├── components/              # 재사용 UI 컴포넌트 (375+ TSX)
│   ├── hooks/                   # 커스텀 React 훅 (315개, 62+ 도메인)
│   ├── services/                # 비즈니스 로직 레이어 (91개)
│   ├── store/                   # Zustand 스토어 (32개)
│   ├── types/                   # TypeScript 타입 정의 (40+)
│   ├── lib/                     # 유틸리티 라이브러리 (15개 하위 디렉토리)
│   │   ├── api/                 # HTTP 클라이언트 & API 라우트 (90+)
│   │   ├── agent/               # AI 에이전트 유틸
│   │   ├── insurance/           # 보험 계산 로직
│   │   ├── label-printer/       # 라벨 인쇄
│   │   ├── medical-record/      # 의무기록 유틸
│   │   ├── pdf/                 # PDF 생성
│   │   ├── prescription/        # 처방전 유틸
│   │   ├── print/               # 인쇄 관리
│   │   ├── printable/           # 인쇄 가능 문서
│   │   ├── query-keys/          # React Query 키 팩토리
│   │   ├── reception/           # 접수 유틸
│   │   └── ui/                  # UI 헬퍼
│   ├── constants/               # 상수 & 열거형 (17+)
│   ├── contexts/                # React Context (2개)
│   ├── config/                  # 설정 파일
│   ├── data/                    # 정적 데이터
│   ├── domains/                 # 도메인별 로직
│   ├── generated/               # 자동 생성 파일
│   ├── mocks/                   # 테스트 모의 데이터
│   ├── styles/                  # 글로벌 스타일 (CSS/SCSS)
│   ├── tests/                   # 테스트 지원 파일
│   ├── utils/                   # 범용 유틸리티
│   └── middleware.ts            # Next.js 미들웨어 (인증)
├── public/                      # 정적 자산
├── docs/                        # 문서
├── scripts/                     # 유틸리티 스크립트
├── styles/                      # 루트 스타일
├── .github/workflows/           # CI/CD (6개 워크플로우)
├── Dockerfile                   # 멀티스테이지 빌드
├── next.config.ts               # Next.js 설정
├── tailwind.config.js           # Tailwind CSS 설정
├── components.json              # Shadcn/ui 설정
├── vitest.config.mts            # Vitest 테스트 설정
├── playwright.config.ts         # E2E 테스트 설정
└── env.mjs                      # 환경변수 유효성 검증 (Zod)
```

---

## 4. 데이터 흐름 아키텍처

### 4.1 전체 데이터 흐름
```
┌──────────────────────────────────────────────────┐
│                  UI Components                    │
│   (pages, feature components, shared components)  │
└─────────────┬────────────────────┬───────────────┘
              │                    │
     React Query Hooks        Zustand Stores
     (서버 상태)               (클라이언트 상태)
              │
     Service Layer (static class methods)
              │
     ApiClient (retry, error handling)
              │
     ApiProxy (token refresh, fetch wrapper)
              │
     Next.js API Routes (/api/*)
              │
     NestJS Backend API
```

### 4.2 API 클라이언트 구조

**`ApiProxy`** (저수준 fetch 래퍼)
- httpOnly 쿠키 기반 인증
- 401 응답 시 자동 토큰 갱신
- 에러 응답 표준화

**`ApiClient`** (고수준 HTTP 클라이언트)
- GET/POST/PUT/PATCH/DELETE 메서드
- 5xx 에러 시 자동 재시도 (3회, 지수 백오프)
- 응답 타입 제네릭 지원

**API Route 파일** (90+ 개)
```typescript
// lib/api/routes/patients-api.ts
export const patientsApi = {
  list: (query) => `/patients?${query}`,
  detail: (id) => `/patients/${id}`,
  create: "/patients",
  update: (id) => `/patients/${id}`,
  search: (query) => `/patients/search?${query}`,
}
```

### 4.3 Service Layer 패턴
```typescript
// services/patients-service.ts
export class PatientsService {
  static async getPatients(query): Promise<PatientsListResponse> {
    return ApiClient.get(patientsApi.list(queryString));
  }
  static async getPatient(id: number): Promise<Patient> {
    return ApiClient.get(patientsApi.detail(id));
  }
  static async createPatient(data: CreatePatientRequest): Promise<Patient> {
    return ApiClient.post(patientsApi.create, data);
  }
}
```

### 4.4 Custom Hook 패턴 (React Query)
```typescript
// hooks/patient/use-patients-by-hospital.ts
export function usePatientsByHospital(hospitalId: number) {
  return useQuery({
    queryKey: ["patients", "hospital", hospitalId],
    queryFn: () => PatientsService.getPatientsByHospital(hospitalId),
    enabled: !!hospitalId,
  });
}
```

### 4.5 Hook Factory 패턴
```typescript
// hooks/common/use-query-factory.ts
createQueryHook(queryKey, queryFn, options?)
createDetailQueryHook(baseQueryKey, queryFn)
createMutationHook(mutationFn, options?)
createCrudMutationHooks(baseQueryKey, service)
```

### 4.6 React Query 설정
- `refetchOnWindowFocus`: **비활성화**
- `refetchOnReconnect`: **비활성화**
- `refetchOnMount`: **비활성화**
- `retry`: **1회**
- Mutation 성공 시 자동 캐시 무효화

---

## 5. 앱 라우팅 구조 (App Router)

### 5.1 루트 레이아웃 Provider 계층
```
CustomThemeProvider (next-themes, 다크모드)
  └── ReactQueryProvider (TanStack Query, 서버 상태)
      └── ToastProvider (알림)
          └── SidebarProvider (사이드바 상태)
              ├── AppSidebar (좌측 내비게이션)
              └── main (메인 컨텐츠 영역)
                  ├── InitialDataFetcherWrapper (초기 데이터 로딩)
                  ├── TopMenubar (상단 메뉴바)
                  └── SocketProvider (WebSocket 연결)
                      ├── GlobalSocketListener (실시간 이벤트)
                      └── ClearProvider (상태 초기화)
                          ├── TabletContentWrapper (태블릿 반응형)
                          ├── DocumentPrintPopup (no-SSR, 인쇄 팝업)
                          ├── TemplateCodePopupGate (템플릿 코드 모달)
                          └── {children} (페이지 컨텐츠)
              └── AgentationWrapper (AI 에이전트 UI)
```

### 5.2 보호된 라우트 (인증 필수)

| 라우트 | 설명 | 주요 하위 라우트 |
|--------|------|-----------------|
| `/reception` | 접수/수납 | `consent-list`, `credit-card-approval`, `daily-receipt`, `management` |
| `/medical` | 진료/차트 | patient-list, info-bar, panels, widgets |
| `/payment` | 결제 처리 | - |
| `/tests` | 검사 관리 | `item/`, `order/`, `result/` |
| `/reservation` | 예약 관리 | - |
| `/stats` | 통계/보고서 | - |
| `/crm` | CRM | `send/`, `history/`, `template/`, `settings/`, `cost/`, `event-send/` |
| `/claims` | 보험청구 | `[id]/`, `material-report/`, `preparation-report/` |
| `/master-data` | 마스터 데이터 | - |
| `/admin` | 관리자 | - |
| `/did` | DID 시스템 | `sign-in/` (별도 인증) |
| `/lab` | 검사실 | - |
| `/external-lab-orders` | 외부검사 | - |
| `/tablet` | 태블릿 UI | `consent/`, `consent-form/` |

### 5.3 공개 라우트

| 라우트 | 설명 |
|--------|------|
| `/auth/sign-in` | 로그인 |
| `/auth/sign-up` | 회원가입 |
| `/auth/forgot-password` | 비밀번호 찾기 |
| `/auth/reset-password` | 비밀번호 재설정 |
| `/auth/change-password` | 비밀번호 변경 |
| `/auth/invite/[invitationId]` | 초대 기반 가입 |
| `/auth/forbidden` | 접근 거부 |
| `/auth/tablet/sign-in` | 태블릿 로그인 |
| `/auth/did/sign-in` | DID 인증 |
| `/proxy/druginfo` | 약품정보 프록시 |

### 5.4 내부 API 라우트 (14+ 엔드포인트)

| 라우트 | 용도 |
|--------|------|
| `/api/agent-print` | 에이전트 인쇄 요청 |
| `/api/claims` | 보험청구 처리 |
| `/api/consents` | 동의서 PDF 생성 |
| `/api/direct-print` | 직접 인쇄 |
| `/api/document` | 문서 생성 |
| `/api/medical-record` | 의무기록 PDF |
| `/api/prescription` | 처방전 PDF |
| `/api/debug/*` | 디버깅 (개발용) |
| `/api/dev/*` | 개발 유틸리티 |

### 5.5 개발/데모 라우트

| 라우트 | 용도 |
|--------|------|
| `/(demo)/examination-label-demo` | 검사 라벨 데모 |
| `/(demo)/medical-record-demo` | 의무기록 데모 |
| `/(demo)/patient-label-demo` | 환자 라벨 데모 |
| `/(document-dev)/field-editor` | 필드 에디터 |
| `/(document-dev)/pdf-perf-test` | PDF 성능 테스트 |
| `/(document-dev)/prescription-preview` | 처방전 미리보기 |
| `/document-test` | 문서 테스트 |

### 5.6 설정 라우트 (14개 섹션)

```
/settings/
├── hospital-info/             # 병원 정보
├── hospital-certificates/     # 병원 인증서
├── space-info/                # 시설 정보
├── users/                     # 사용자 관리
├── permissions/               # 권한 설정
├── operating-days/            # 운영일/시간
├── printer/                   # 프린터 설정
├── claim-settings/            # 청구 설정
├── lab-management/            # 검사실 관리
├── access-logs/               # 접근 로그
├── ip-restrictions/           # IP 제한
├── consent-management/        # 동의서 관리
├── patient-management/        # 환자 관리
├── personal-privacy/          # 개인정보 보호
└── integrations/              # 외부 연동
```

---

## 6. 인증 & 미들웨어

### 6.1 인증 흐름
```
1. POST /auth/sign-in → 로그인 요청
2. 백엔드에서 JWT 발급 → httpOnly 쿠키 저장 (accessToken)
3. middleware.ts → 모든 보호 라우트에서 쿠키 검증
4. 인증 실패 → /auth/sign-in 으로 리다이렉트
5. 5분마다 토큰 자동 갱신 (useAuthCheck 훅)
6. DID 라우트는 별도 쿠키 (accessToken_did) 사용
```

### 6.2 미들웨어 동작 (middleware.ts)
```typescript
// 보호 라우트 패턴 (정규식)
const protectedRoutes = [
  /^\/$/, /^\/reception/, /^\/payment/, /^\/medical/,
  /^\/tests/, /^\/reservation/, /^\/stats/, /^\/crm/,
  /^\/claims/, /^\/master-data/, /^\/admin/, /^\/did/
];

// DID 라우트 → accessToken_did 쿠키 확인
// 일반 라우트 → accessToken 쿠키 확인
// 미인증 → /auth/sign-in 리다이렉트
```

### 6.3 에러 처리
- **401 Unauthorized** → 자동 토큰 갱신 시도, 실패 시 로그인 페이지
- **403 Forbidden** → `/auth/forbidden` 페이지
- **5xx** → ApiClient에서 3회 재시도 (지수 백오프)
- **중복 데이터** (unique constraint) → 사용자 친화적 메시지

---

## 7. 상태관리 아키텍처

### 7.1 Zustand 스토어 (32개)

#### 핵심 스토어
| 스토어 | 역할 | 주요 상태 |
|--------|------|----------|
| `user-store` | 현재 사용자 | 로그인 사용자 정보 |
| `hospital-store` | 현재 병원 | 선택된 병원 정보 |
| `patient-store` | 선택 환자 | 현재 선택된 환자 |
| `encounter-store` | 진료 데이터 | 진료 기록, 드래프트, 변경 추적 |
| `department-store` | 진료과 | 선택된 진료과 |
| `doctors-store` | 의사 목록 | 병원 내 의사 리스트 |
| `permission-store` | 권한 | 현재 사용자 권한 |

#### 기능 스토어
| 스토어 | 역할 |
|--------|------|
| `appointment-store` | 예약 상태 |
| `appointment-rooms-store` | 진료실 정보 |
| `benefits-store` | 보험 급여 |
| `facility-store` | 시설 정보 |
| `printers-store` | 프린터 목록 |
| `patient-groups-store` | 환자 그룹 |
| `external-lab-orders-store` | 외부검사 오더 |
| `settings-store` | 시스템 설정 |
| `ui-store` | UI 상태 |

#### 접수 관련 스토어 (`/common` + `/reception`)
| 스토어 | 역할 |
|--------|------|
| `reception-store` | 접수 상태 |
| `reception-tabs-store` | 접수 탭 네비게이션 |
| `reception-view-tabs-store` | 접수 뷰 탭 |
| `reception-panel-store` | 패널 레이아웃 |
| `selected-date-store` | 날짜 선택 |
| `insurance-store` | 보험 정보 |
| `patient-status-store` | 환자 상태 |

#### 기타 스토어
| 스토어 | 역할 |
|--------|------|
| `print-popup-store` | 인쇄 다이얼로그 |
| `rc-dock-store` | 도킹 워크스페이스 |
| `search-setting-store` | 검색 설정 |
| `selected-detail-patient-info-store` | 환자 상세 |
| `access-history-store` | 접근 이력 |
| `terms-agree-store` | 약관 동의 |
| `user-code-store` | 사용자 코드 |
| `users-store` | 사용자 목록 |

### 7.2 Zustand 스토어 패턴
```typescript
export const usePatientStore = create<PatientState>((set) => ({
  selectedPatientId: null,
  selectedPatient: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  clearPatient: () => set({ selectedPatientId: null, selectedPatient: null }),
}));
```

### 7.3 encounter-store (핵심 스토어)
진료 화면의 중심 스토어로, 다음을 관리:
- 진료 요약, 환자 메모, 임상 메모
- 증상, 질병 목록, 처방 목록
- 특정내역 (수가 계산용)
- PCI 점검 결과
- **드래프트 필드** - 저장 전 임시 데이터
- **변경 추적** - dirty state 감지
- **저장 콜백** - 저장 시 호출할 함수 등록

---

## 8. React Context (2개)

### 8.1 SocketContext
```typescript
// 제공하는 값
{
  socket: Socket,                    // Socket.io 인스턴스
  localAgentStatus: 'online' | 'offline',  // 로컬 에이전트 상태
  hospitalAgentOnline: boolean,       // 병원 에이전트 접속 여부
  connectedAgentIds: string[],        // 연결된 에이전트 ID 목록
  currentAgentId: string | null,      // 현재 바인딩된 에이전트 ID
  agentPresenceStatus: object,        // 에이전트 프레즌스 정보
}
```

### 8.2 ClearContext
```typescript
// 제공하는 값
{
  registerClear: (id, callback) => void,   // 정리 함수 등록
  unregisterClear: (id) => void,           // 정리 함수 해제
  clearAll: () => void,                     // 전체 정리 실행
  clearById: (id) => void,                 // 특정 정리 실행
  getRegisteredIds: () => string[],        // 등록된 ID 목록
}
```

---

## 9. 커스텀 훅 (315개, 62+ 도메인)

### 9.1 도메인별 훅 분류

#### 환자 관리
| 디렉토리 | 주요 훅 |
|----------|---------|
| `patient/` | usePatients, usePatientById, useCreatePatient, useUpdatePatient |
| `patient-family/` | usePatientFamilies, useCreatePatientFamily |
| `registration/` | useRegistrations, useCreateRegistration |
| `eligibility/` | useEligibilityCheck |

#### 진료
| 디렉토리 | 주요 훅 |
|----------|---------|
| `encounter/` | useEncounters, useCreateEncounter, useUpdateEncounter |
| `disease/` | useDiseases, useCreateDisease |
| `disease-library/` | useDiseaseLibrarySearch |
| `order/` | useOrders, useCreateOrder |
| `medical/` | useMedicalRecords |
| `medical-info/` | useMedicalInfo |
| `medical-record/` | useMedicalRecordDocument |
| `vital/` | useVitalSigns |
| `vital-sign-item/` | useVitalSignItems |
| `vital-sign-measurement/` | useVitalSignMeasurements |
| `vital-sign-sub-items/` | useVitalSignSubItems |

#### 예약/접수
| 디렉토리 | 주요 훅 |
|----------|---------|
| `appointment/` | useAppointments, useCreateAppointment |
| `appointment-contents-panel/` | 예약 패널 UI 훅 |
| `reception/` | useReception |

#### 결제/청구
| 디렉토리 | 주요 훅 |
|----------|---------|
| `payment/` | usePayments |
| `claims/` | useClaims |
| `benefits/` | useBenefits |
| `pci/` | usePciCheck |

#### 처방/약품
| 디렉토리 | 주요 훅 |
|----------|---------|
| `drug/` | useDrugs, useDrugSearch |
| `prohibited-drugs/` | useProhibitedDrugs |
| `scheduled-order/` | useScheduledOrders |
| `verbal-orders/` | useVerbalOrders |
| `usage/` | useUsageCodes |
| `specimen-libraries/` | useSpecimenLibraries |
| `specific-detail-codes/` | useSpecificDetailCodes |

#### CRM
| 디렉토리 | 주요 훅 |
|----------|---------|
| `crm/` | useCrmSendEvents, useCrmHistory, useCrmTemplates |

#### 관리/설정
| 디렉토리 | 주요 훅 |
|----------|---------|
| `auth/` | useAuthCheck, useLogin, useLogout |
| `user/` | useUsers, useCurrentUser |
| `hospital/` | useHospital |
| `department/` | useDepartments |
| `facility/` | useFacilities |
| `permissions/` | usePermissions |
| `invitations/` | useInvitations |
| `master-data/` | useMasterData |

#### 문서/인쇄
| 디렉토리 | 주요 훅 |
|----------|---------|
| `document/` | useDocuments |
| `forms/` | useForms |
| `form-issuances/` | useFormIssuances |
| `print/` | usePrint |
| `examination-label/` | useExaminationLabel |
| `patient-label/` | usePatientLabel |
| `consent/` | useConsent |

#### 유틸리티 훅 (루트)
| 훅 | 역할 |
|----|------|
| `use-debounce` | 디바운싱 |
| `use-debounced-input` | 디바운스 입력 |
| `use-mobile` | 모바일 감지 |
| `use-permission` | 권한 확인 |
| `use-popout-manager` | 팝아웃 창 관리 |
| `use-resize-observer` | 크기 관찰 |
| `use-sidebar-menus` | 사이드바 메뉴 |
| `use-tiptap-editor` | 리치 텍스트 에디터 |
| `use-window-size` | 윈도우 크기 |
| `use-agent-dur` | 약물 상호작용 체크 |
| `use-menu-navigation` | 메뉴 내비게이션 |

---

## 10. 서비스 레이어 (91개)

### 10.1 주요 서비스

#### 대형 서비스 (27KB+)
| 서비스 | 크기 | 도메인 |
|--------|------|--------|
| `payments-services.ts` | 27KB | 결제 처리 |
| `reception-service.ts` | 27KB | 접수 운영 |

#### 핵심 서비스
| 서비스 | 도메인 |
|--------|--------|
| `auth-service.ts` | 인증 |
| `patients-service.ts` | 환자 관리 |
| `encounters-service.ts` | 진료 기록 |
| `orders-service.ts` | 처방 관리 |
| `registrations-service.ts` | 접수 관리 |
| `appointments-service.ts` | 예약 |
| `hospitals-service.ts` | 병원 정보 |
| `users-service.ts` | 사용자 관리 |
| `claims-service.ts` | 보험청구 |
| `diseases-service.ts` | 진단 관리 |
| `drugs-service.ts` | 약품 정보 |
| `documents-service.ts` | 문서 관리 |

#### CRM 서비스 (7개)
| 서비스 | 역할 |
|--------|------|
| `crm-send-events-service.ts` | 발송 이벤트 |
| `crm-send-history-service.ts` | 발송 이력 |
| `crm-sender-service.ts` | 발신 관리 |
| `crm-message-service.ts` | 메시지 |
| `crm-condition-search-service.ts` | 조건 검색 |
| `crm-cost-service.ts` | 비용 분석 |
| `crm-user-message-template-service.ts` | 메시지 템플릿 |

#### 하위 디렉토리
| 디렉토리 | 역할 |
|----------|------|
| `agent/` | AI 에이전트 통합 |
| `closing/` | 기간 마감 |
| `master-data/` | 마스터 데이터 CRUD |
| `nhmp/` | 건강보험 연동 |
| `pay-bridge/` | 결제 게이트웨이 |
| `reservation/` | 예약 관리 |

---

## 11. 컴포넌트 구조 (375+ TSX)

### 11.1 컴포넌트 분류

#### 기반 UI (`/ui`)
- Shadcn/ui 래퍼 컴포넌트
- `my-rc-dock/` - 커스텀 도킹 패널

#### 도메인 컴포넌트
| 디렉토리 | 설명 |
|----------|------|
| `appointment/` | 예약 UI |
| `auth/` | 인증 UI |
| `charts/` | Recharts 래퍼 |
| `consent/` | 동의서 |
| `disease-order/` | 진단/처방 입력 (`bundle/`, `disease/`, `order/`, `common-action-row/`) |
| `dock-workspace/` | 도킹 가능 워크스페이스 (hooks, store, styles) |
| `document/` | 문서 편집/조회 |
| `examination-label/` | 검사 라벨 |
| `library/` | 참조 라이브러리 UI (약품분리예외, 외인코드, 특정내역, 검체, 용법) |
| `medical-info/` | 의료 정보 표시 |
| `nhic-form/` | 건강보험 양식 |
| `patient-form/` | 환자 등록/수정 |
| `patient-label/` | 환자 라벨 |
| `qualification-check/` | 자격 확인 |
| `reception/` | 접수 UI (`print-center/`, `board-patient/`) |
| `settings/` | 설정 UI (18+ 하위 디렉토리) |
| `vital/` | 활력징후 |
| `widget/` | 위젯 |

#### 커스텀 UI 툴킷 (`/yjg`)
| 하위 디렉토리 | 설명 |
|---------------|------|
| `common/` | 공통 UI |
| `my-grid/` | 커스텀 그리드 |
| `my-tiptap-editor/` | Tiptap 에디터 래퍼 |
| `my-tree-grid/` | 트리 그리드 |

#### 글로벌 컴포넌트
| 컴포넌트 | 역할 |
|----------|------|
| `app-sidebar.tsx` | 좌측 사이드바 내비게이션 |
| `top-menubar.tsx` | 상단 메뉴바 |
| `react-query-provider.tsx` | React Query 프로바이더 |
| `theme-provider.tsx` | 테마 관리 |
| `global-socket-listener.tsx` | WebSocket 이벤트 핸들러 |
| `tablet-content-wrapper.tsx` | 태블릿 반응형 래퍼 |
| `agentation-wrapper.tsx` | AI 에이전트 UI 래퍼 |
| `document-print-popup.no-ssr.tsx` | 인쇄 팝업 (클라이언트 only) |
| `template-code-popup-gate.tsx` | 템플릿 코드 모달 |
| `initial-data-fetcher-wrapper.tsx` | 초기 데이터 로딩 |

---

## 12. 타입 시스템 (40+ 파일)

### 12.1 도메인별 타입

| 파일/디렉토리 | 도메인 |
|--------------|--------|
| `patient-types.ts` | 환자 핵심 데이터 |
| `patient-family-types.ts` | 가족관계 |
| `patient-groups-types.ts` | 환자 그룹 |
| `auth-types.ts` | 인증/인가 |
| `hospital-types.ts` | 병원 정보 |
| `department-types.ts` | 진료과 |
| `department-position-types.ts` | 직급 |
| `facility-types.ts` | 시설 |
| `drug-types.ts` | 약품 |
| `billing-types.ts` | 수가/청구 |
| `benefits-types.ts` | 보험 급여 |
| `eligibility-checks-types.ts` | 자격 확인 |
| `consents-types.ts` | 동의서 |
| `form-types.ts` | 양식 |
| `permission-types.ts` | 권한 |
| `printer-types.ts` | 프린터 |
| `printer-settings.ts` | 프린터 설정 |
| `file-types.ts` / `file-types-v2.ts` | 파일 |
| `did-types.ts` | DID |
| `calendar-types.ts` | 달력 |
| `panel-config-types.ts` | 패널 설정 |
| `/chart/` | 차트 데이터 (disease, order, encounter, patient-chart) |
| `/vital/` | 활력징후 |
| `/document/` | 의료 문서 |
| `/appointments/` | 예약 |
| `/claims/` | 보험청구 |
| `/closings/` | 기간 마감 |
| `/common/` | 공통 (페이지네이션, 필터 등) |
| `/crm/` | CRM |
| `/master-data/` | 마스터 데이터 |
| `/elasticsearch/` | 검색 엔진 |
| `/payment/` | 결제 |
| `/receipt/` | 영수증 |
| `/pci/` | PCI |
| `/registration-types.ts` | 접수 |

---

## 13. 상수 & 열거형 (17+)

| 파일 | 내용 |
|------|------|
| `constants.ts` | 범용 상수 |
| `menu.ts` | 메뉴 열거형 |
| `form-options.ts` | 폼 필드 옵션 |
| `department.ts` | 진료과 코드 |
| `patient.ts` | 환자 관련 상수 |
| `reception.ts` | 접수 열거형 (초재진, 보험구분 등) |
| `crm-enums.ts` | CRM 옵션 |
| `user-enums.ts` | 사용자 역할 |
| `master-data-enum.ts` | 마스터 데이터 타입 |
| `bundle-price-type.ts` | 가격 유형 |
| `decimal-point-option.ts` | 소수점 포맷 |
| `printer.ts` | 프린터 설정 |
| `pdf-scale.ts` | PDF 줌 레벨 |
| `nhmp-error-codes.ts` (23KB) | 건강보험 에러 코드 |
| `validate-constants.ts` | 유효성 검증 규칙 |
| `/common/` | 공통 열거형 |
| `/library-option/` | 라이브러리 선택 옵션 |

---

## 14. 유틸리티 라이브러리 (30+ 파일)

### 14.1 핵심 유틸리티

| 파일 | 크기 | 역할 |
|------|------|------|
| `date-utils.ts` | 36KB | 날짜/시간 처리 (종합) |
| `patient-utils.ts` | - | 환자 데이터 조작 |
| `eligibility-utils.ts` | - | 보험 자격 확인 |
| `nhic-form-utils.ts` | - | 건강보험 양식 |
| `registration-utils.ts` | - | 접수 로직 |
| `reservation-utils.ts` | - | 예약 로직 |
| `encounter-util.ts` | - | 진료 작업 |
| `calc-result-data-util.ts` | - | 수가 계산 |
| `payments-utils.ts` | - | 결제 유틸 |
| `master-data-utils.ts` | - | 마스터 데이터 |
| `holiday-utils.ts` | - | 공휴일 계산 |
| `business-utils.ts` | - | 비즈니스 로직 |

### 14.2 공통 유틸리티

| 파일 | 역할 |
|------|------|
| `utils.ts` | `cn()` (clsx + twMerge), `getChosung()` (한글 초성) |
| `common-utils.ts` | 범용 유틸 |
| `auth-utils.ts` | 인증 유틸 |
| `error-utils.ts` | 에러 처리 |
| `enum-utils.ts` | 열거형 헬퍼 |
| `file-utils.ts` | 파일 작업 |
| `form-utils.ts` | 폼 유틸 |
| `number-utils.ts` | 숫자 포맷 |
| `field-converters.ts` | 필드 타입 변환 |
| `field-value-resolvers.ts` | 폼 필드 해석 |
| `sort-position.ts` | 정렬 |
| `config.ts` | 환경 설정 |
| `token-storage.ts` | 토큰 저장 |
| `validation.ts` | 입력 검증 |
| `popout-channel.ts` | 팝아웃 창 통신 |

---

## 15. 스타일링

### 15.1 CSS/SCSS 파일
| 파일 | 역할 |
|------|------|
| `globals.css` | 글로벌 스타일 |
| `figma-colors.css` | 디자인 시스템 색상 변수 |
| `variables.css` | CSS 커스텀 속성 |
| `rc-dock.css` (24KB) | 도킹 레이아웃 스타일 |
| `react-calendar.css` | 달력 위젯 |
| `did.css` | DID 모듈 |
| `keyframe-animations.scss` | 애니메이션 |
| `fonts/` | 웹 폰트 |

### 15.2 Tailwind CSS 설정
- CSS Variables 기반 테마 (Shadcn/ui)
- 커스텀 키프레임: `sparkle`, `swing`
- Shadcn/ui New York 스타일 테마

---

## 16. 테스팅 인프라

### 16.1 단위 테스트 (Vitest)

| 항목 | 설정 |
|------|------|
| **환경** | jsdom |
| **라이브러리** | `@testing-library/react`, `@testing-library/jest-dom` |
| **커버리지** | `src/lib/**`, `src/utils/**`, `src/app/**/_utils/**`, `src/components/**/model/**` |
| **임계값 (gate)** | lines 74%, functions 94%, branches 92%, statements 74% |
| **설정** | 콘솔 에러 시 테스트 실패 강제 |

### 16.2 E2E 테스트 (Playwright)

| 항목 | 설정 |
|------|------|
| **브라우저** | Chrome (Desktop) |
| **프로젝트** | `setup` (인증), `ui-contract`, `live-business` |
| **워커** | 1개 (세션 충돌 방지) |
| **타임아웃** | 테스트 45초, 어설션 10초 |
| **추적** | 첫 재시도 시 캡처, 실패 시 스크린샷/비디오 |

---

## 17. 빌드 & 배포

### 17.1 Next.js 설정 (next.config.ts)
- **Output**: `standalone` (Docker 최적화)
- **Turbopack**: 개발 모드에서 SVG 로더
- **API Rewrites**: 외부 API 프록시
- **이미지**: 원격 이미지 허용 패턴 설정

### 17.2 Docker 멀티스테이지 빌드

| 스테이지 | 역할 |
|---------|------|
| **deps** | pnpm 의존성 설치 (캐시 마운트) |
| **builder** | Next.js 앱 빌드 (NODE_OPTIONS 4096MB) |
| **runner** | 프로덕션 런타임 (Node 20 Alpine, non-root, dumb-init) |

**빌드 시 주입 환경변수:**
- `NEXT_PUBLIC_APP_API_URL` - 백엔드 API URL
- `NEXT_PUBLIC_SOCKET_SERVER_URL` - WebSocket 서버

### 17.3 CI/CD (GitHub Actions - 6개 워크플로우)

| 워크플로우 | 트리거 | 환경 |
|-----------|--------|------|
| `docker-publish-main.yml` | main push | 프로덕션 |
| `docker-publish-qa.yml` | qa push | QA/스테이징 |
| `docker-publish-dev.yml` | dev/develop push | 개발 |
| `docker-publish-conv.yml` | conv push | 컨버전 |
| `CI.yml` | PR/push | CI 검증 |
| `release.yml` | - | 시맨틱 릴리즈 |

### 17.4 배포 파이프라인
```
코드 Push → GitHub Actions → Docker Build → Azure ACR Push
                                                  ↓
                        Helm Chart 레포 업데이트 (emr-helm-chart)
                                                  ↓
                        Kubernetes (AKS) 배포
```

### 17.5 환경별 설정

| 환경 | API URL | WebSocket |
|------|---------|-----------|
| **Production** | `https://nextemr-api.ubcare.co.kr` | `wss://ws.ubcare.co.kr` |
| **QA** | (QA Helm values) | (QA WebSocket) |
| **Dev** | (Dev Helm values) | (Dev WebSocket) |

---

## 18. 환경변수 (.env.example)

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_APP_API_URL` | 백엔드 API 엔드포인트 |
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | WebSocket 서버 URL |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry 에러 추적 |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog 분석 키 |
| `NEXTAUTH_SECRET` | 세션 암호 |

**환경변수 유효성 검증** (`env.mjs`)
- Zod 스키마로 빌드/실행 시 환경변수 타입 검증
- 서버/클라이언트 변수 분리

---

## 19. 특수 기능

### 19.1 한국어 특화
- `hangul-js` → 초성 검색 (ㅎㅈ → 환자)
- `react-daum-postcode` → 한국 주소 검색
- `moment` → 한국식 날짜 포맷 (YYYYMMDD)
- RRN(주민등록번호) 마스킹/검증 처리
- 건강보험 에러 코드 23KB 상수

### 19.2 의무기록 시스템
- Tiptap 리치 텍스트 에디터 (14+ 확장)
- 문서 템플릿 엔진 (처방전, 진단서, 소견서 등)
- PDF 생성/미리보기 (pdf-lib, jspdf, react-pdf)
- 인쇄 레이아웃 (pagedjs)
- 라벨 인쇄 (환자/검체)

### 19.3 실시간 기능
- Socket.io 기반 실시간 업데이트
- 에이전트 프레즌스 모니터링 (online/offline)
- 글로벌 이벤트 리스너

### 19.4 AI 통합
- AI 에이전트 래퍼 (AgentationWrapper)
- AI 예측 서비스 (ai-predictions-service.ts)
- 에이전트 통신 유틸 (lib/agent/)

### 19.5 도킹 워크스페이스
- `rc-dock` 기반 도킹 가능한 패널 시스템
- 사용자별 레이아웃 저장/복원
- 전용 스토어 + 스타일 (24KB CSS)

### 19.6 외부 연동
- 똑닥 (ddocdoc) 연동
- 외부 검사기관 연동
- 결제 게이트웨이 (pay-bridge)
- 건강보험 API (NHMP)

---

## 20. 파일 규모 통계

| 카테고리 | 수량 |
|----------|------|
| 전체 TypeScript/TSX 파일 | 1,834 |
| 컴포넌트 파일 (.tsx) | 375+ |
| 커스텀 훅 | 315개 (62+ 도메인) |
| 서비스 파일 | 91개 |
| API 라우트 파일 | 90+ |
| 타입 정의 파일 | 40+ |
| Zustand 스토어 | 32개 |
| 상수/열거형 파일 | 17+ |
| 유틸리티 파일 | 30+ |
| 앱 라우트 | 22개 주요 라우트 |
| 설정 파일 | 20+ |

---

## 21. 핵심 아키텍처 패턴 요약

1. **App Router 기반 라우팅** - Next.js 15 App Router + file-based routing
2. **분리된 상태관리** - Zustand (클라이언트) + React Query (서버), 명확한 관심사 분리
3. **3계층 데이터 접근** - Hook → Service → ApiClient, 계층별 책임 분리
4. **자동 재시도** - 5xx 에러 3회 자동 재시도 (지수 백오프)
5. **쿠키 기반 인증** - httpOnly 쿠키 + 자동 토큰 갱신
6. **도메인 기반 모듈화** - 기능별 hooks, services, types, constants 분리
7. **Shadcn/ui 컴포넌트** - 커스터마이즈 가능한 Radix UI 기반 컴포넌트
8. **실시간 통신** - Socket.io로 에이전트 상태, 알림 실시간 동기화
9. **PDF/인쇄 파이프라인** - pdf-lib → jspdf → pagedjs → 인쇄/다운로드
10. **Hook Factory 패턴** - 반복적인 CRUD 훅 생성 자동화
