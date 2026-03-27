# 차세대 EMR

## 데모

[![UptimeRobot Status](https://img.shields.io/uptimerobot/status/m800921834-e3135d034563980dcab4b41e?label=dev)](https://stats.uptimerobot.com/YEBSkq4AWP) [![UptimeRobot Status](https://img.shields.io/uptimerobot/status/m800921912-991a30f9e4dc665306e1efdf?label=prod)](https://stats.uptimerobot.com/YEBSkq4AWP)

| 환경 | 데모                                                        | Swagger                                                    |
| ---- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Dev  | [nextemr-dev.ubcare.co.kr](http://nextemr-dev.ubcare.co.kr) | [API Docs](http://nextemr-api-dev.ubcare.co.kr/api-docs#/) |
| QA   | [nextemr-qa.ubcare.co.kr](http://nextemr-qa.ubcare.co.kr)   | -                                                          |
| Prod | [nextemr.ubcare.co.kr](http://nextemr.ubcare.co.kr)         | [API Docs](http://nextemr-api.ubcare.co.kr/api-docs#/)     |

템플릿: [NextJS Boilerplate](https://github.com/ixartz/Next-js-Boilerplate/tree/main)

## 기술 스택

### 프레임워크 | 라이브러리 | 언어

- ⚡ [Next.js](https://nextjs.org)
- ⚛️ [React](https://react.dev)
- 🔥 [TypeScript](https://www.typescriptlang.org)

### 스타일링

- 💎 [Tailwind CSS](https://tailwindcss.com)
- 🧩 [Shadcn/ui](https://ui.shadcn.com)

### 상태 관리

- 🐻 [Zustand](https://zustand-demo.pmnd.rs/)
- 🍊 [TanStack React Query](https://tanstack.com/query/latest) (서버 상태/비동기 데이터 관리)

### 폼 & 검증

- ⌨️ [React Hook Form](https://react-hook-form.com) (폼 핸들링)
- 🔴 [Zod](https://zod.dev) (입력값 검증)

### 코드 품질

- ✅ [Strict Mode](https://react.dev/reference/react/StrictMode) for TypeScript and React 19 (타입/코드 품질)
- ♻️ [T3 Env](https://env.t3.gg) (타입 세이프 환경변수)
- 📏 [ESLint](https://eslint.org) (코드 린트)
- 💖 [Prettier](https://prettier.io) (코드 포매터)
- 🦊 [Husky](https://typicode.github.io/husky/) (Git Hooks)
- 🚫 [Lint-staged](https://github.com/lint-staged/lint-staged) (Git staged 파일 린트)
- 🚓 [Commitlint](https://commitlint.js.org) (커밋 메시지 린트)
- 📓 [Commitizen](https://commitizen-tools.github.io/commitizen/) (표준 커밋 메시지 작성)

### 테스트

- 🦺 [Vitest](https://vitest.dev), React Testing Library (유닛 테스트)
- 🎭 [Playwright](https://playwright.dev/) (E2E 테스트)

### IDE

- 🕋 [Cursor](https://cursor.com/) (코드 편집기)

### CI/CD & 자동화

- 👷 [Dependabot](https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide) (자동 의존성 업데이트)
- 🛣️ [GitHub Actions](https://github.com/features/actions) (도커 이미지 생성)
- 🎁 [Semantic Release](https://semantic-release.gitbook.io/semantic-release) (자동 changelog/릴리즈)

### 번들 분석

- ⚙️ [Bundler Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### 모니터링

- 🦔 [PostHog](https://posthog.com) (유저 행동 추적)
- 💯 [Lighthouse](https://chromewebstore.google.com/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk?hl=ko) (앱 성능 측정)
- 🚨 [Sentry](https://sentry.io/for/nextjs) (에러 모니터링)

## 환경

- Node.js 20+
- npm/pnpm

---

## 시작하기

프로젝트 소스를 다운받는다.

```shell
git clone https://github.com/NextEMR/react-frontend.git
cd react-frontend
pnpm install
```

개발 서버를 실행한다.

```shell
pnpm run dev
```

아래 주소로 접속하여 확인한다.

```text
http://localhost:8080
```

코드 변경 시 자동으로 새로고침된다.

## API 타입 생성

백엔드 API 스펙이 변경되었을 때, OpenAPI 스펙을 기반으로 TypeScript 타입을 생성할 수 있다.

```shell
# API 타입 생성
pnpm run generate:api

# API 타입 생성 (체크 모드 - 실패해도 계속 진행)
pnpm run generate:api:check
```

생성된 타입은 `src/generated/api/` 디렉토리에 저장된다.

> **참고**: `dev` 명령어 실행 시 자동으로 타입이 생성되지 않는다. 필요할 때만 위 명령어를 직접 실행하면 된다.

## .env 정보

`.env.example`을 참고하여 아래 파일들을 채워넣는다.

```text
.env
.env.local
.env.development
.env.production
```

## 프로젝트 구조

```shell
.
├── README.md                       # 프로젝트 설명서
├── .github/                        # GitHub 워크플로우 및 이슈/PR 템플릿
├── .husky/                         # Husky Git hook 설정
├── .vscode/                        # VSCode 에디터 설정
├── public/                         # 정적 파일(이미지, 폰트 등)
├── src/                            # 소스 코드 폴더
├── tests/                          # 테스트 코드(e2e, integration 등)
├── Dockerfile                      # Docker 컨테이너 빌드 설정
├── .dockerignore                   # Docker 빌드 제외 파일 목록
├── .gitignore                      # Git에서 무시할 파일/폴더 목록
├── commitlint.config.ts            # 커밋 메시지 규칙 설정 (Commitlint)
├── components.json                 # shadcn-ui 컴포넌트 설정
├── env.mjs                         # 환경변수 타입 세이프 설정 (T3 Env)
├── eslint.config.mjs               # ESLint 린트 설정
├── lint-staged.config.js           # lint-staged 설정 (커밋 전 린트 자동 실행)
├── next.config.ts                  # Next.js 프로젝트 설정
├── package.json                    # 프로젝트 의존성 및 스크립트
├── pnpm-lock.yaml                  # pnpm 패키지 락 파일(의존성 고정)
├── pnpm-workspace.yaml             # pnpm 워크스페이스 설정(모노레포용, 단일 프로젝트면 거의 비어있음)
├── postcss.config.mjs              # PostCSS 플러그인 설정 (Tailwind 등)
├── release.config.js               # semantic-release 자동 배포/버전 관리 설정
├── tsconfig.json                   # TypeScript 컴파일러 설정
├── vitest.config.mts               # Vitest(테스트 러너) 설정
├── vitest.setup.ts                 # Vitest 테스트 환경 초기화/글로벌 설정
└── next-env.d.ts                   # Next.js 타입 지원 파일
```

```shell
src/
├── app/                    # Next.js 13+ App Router (페이지, 레이아웃, API 라우트)
├── components/             # 재사용 가능한 UI 컴포넌트
├── lib/                    # 유틸리티 함수, API 클라이언트, 외부 라이브러리 설정
├── hooks/                  # React Query 커스텀 훅 및 기타 훅
├── services/               # 비즈니스 로직 및 API 서비스 클래스
├── store/                  # Zustand 전역 상태 관리
├── types/                  # TypeScript 타입 정의
├── constants/              # 상수 및 설정 값
├── contexts/               # React Context 정의
├── data/                   # 더미 데이터 및 정적 데이터
├── styles/                 # 전역 CSS 및 SCSS 파일
├── tests/                  # 테스트 파일
├── middleware.ts           # Next.js 미들웨어
├── instrumentation.ts      # 서버 사이드 모니터링 설정
└── instrumentation-client.ts # 클라이언트 사이드 모니터링 설정
```

---

## 인증

httpOnly 쿠키 활용

## 커밋 메시지 형식

이 프로젝트는 [Conventional Commits](https://www.conventionalcommits.org/) 명세를 따른다. 즉, 모든 커밋 메시지는 해당 규칙에 맞게 작성되어야 한다.  
커밋 메시지 작성을 도와주기 위해, 이 프로젝트는 [Commitizen](https://github.com/commitizen/cz-cli)이라는 대화형 CLI 도구를 사용한다.  
`Commitizen`을 사용하려면 아래 명령어를 실행한요.

```shell
npm run commit
```

`Conventional Commits`를 사용하면 `CHANGELOG` 파일을 자동으로 생성할 수 있다. 또한, 릴리즈에 포함된 커밋의 유형에 따라 다음 버전 번호를 자동으로 결정할 수 있다.

## 테스트 실행

모든 유닛 테스트는 소스 코드와 같은 디렉토리에 위치해 있다.
이 프로젝트는 유닛 테스트를 위해 `Vitest`와 `React Testing Library`를 사용한다.
아래 명령어로 테스트를 실행할 수 있다:

```shell
npm run test
```

## 배포

아래 명령어로 프로덕션 빌드를 생성한다.

```shell
pnpm run build
```

생성된 빌드를 테스트하려면 다음 명령어를 실행한다.

```shell
pnpm run start
```

이 명령어는 프로덕션 빌드를 사용하여 로컬 서버를 시작한다.
이제 브라우저에서 `http://localhost:8080`을 열어 결과를 확인할 수 있다.

## 모니터링 설정

오류 모니터링을 위해 `Sentry`를 사용한다.

## 번들 크기 최적화

아래 명령어를 실행하면 JavaScript 번들의 크기를 분석할 수 있다.

```shell
npm run build-stats
```

이 명령어를 실행하면 결과가 새로운 브라우저 창에서 보여진다.

## VSCode 정보

VSCode 및 Cursor 사용자의 경우, 모든 팀원이 공통으로 사용할 확장 프로그램 리스트가 `.vscode/extension.json`에 들어있다.
