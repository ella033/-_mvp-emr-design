/*
이 파일은 React + TypeScript + Vite + Vitest 환경에서 테스트를 위한 설정 파일입니다.

- .mts 확장자는 TypeScript ESModule임을 의미합니다.
- @vitejs/plugin-react: Vite에서 React 지원
- vite-tsconfig-paths: tsconfig의 경로 별칭 지원
- loadEnv: Vite 환경변수 로딩
- defineConfig: 타입 안전한 설정 정의

주요 옵션:
- plugins: React, tsconfig 경로 별칭 플러그인 적용
- test.globals: Jest 스타일 전역 테스트 함수 사용
- test.include: 테스트 파일 패턴 지정
- test.coverage: 커버리지 측정 대상/제외 파일 지정
- test.workspace: 워크스페이스별 테스트 환경 분리(jsdom 등)
- test.setupFiles: 테스트 실행 전 실행할 파일(전역 설정 등)
- test.env: 환경변수 로딩
*/

import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const coverageProfile = process.env.VITEST_COVERAGE_PROFILE ?? "ui-contract";
const coverageThresholds =
  coverageProfile === "ui-contract-gate"
    ? {
        lines: 74,
        functions: 94,
        branches: 92,
        statements: 74,
      }
    : undefined;

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true, // This is needed by @testing-library to be cleaned up after each test
    include: ["src/**/*.test.{js,jsx,ts,tsx}"],
    // Frontend coverage is scoped to UI contracts that support scenario generation.
    // API wrappers, state containers, and backend-owned integration details are gated elsewhere.
    coverage: {
      all: true,
      clean: true,
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: `./coverage/${coverageProfile}`,
      thresholds: coverageThresholds,
      include: [
        "src/lib/**",
        "src/utils/**",
        "src/app/**/_utils/**",
        "src/components/**/model/**",
      ],
      exclude: [
        "src/**/*.stories.*",
        "**/*.d.ts",
        "src/generated/**",
        "src/tests/**",
        "src/services/**",
        "src/hooks/**",
        "src/store/**",
        "src/lib/api/**",
        "src/lib/agent/**",
        "src/lib/insurance/**",
        "src/lib/label-printer/**",
        "src/lib/medical-record/**",
        "src/lib/pdf/**",
        "src/lib/prescription/**",
        "src/lib/print/**",
        "src/lib/query-keys/**",
        "src/lib/reception/**",
        "src/lib/ui/**",
        "src/lib/utils/**",
        "src/lib/printable/*.tsx",
        "src/lib/printable/types.ts",
        "src/app/(document-dev)/_utils/create-pdf-from-image.ts",
        "src/utils/date-formatter.ts",
        "src/components/**/model/index.ts",
        "src/components/**/model/types.ts",
        "src/components/**/model/*types.ts",
        "src/components/**/model/api-types.ts",
        "src/components/**/model/ui-types.ts",
        "src/components/**/model/detail-dto-temp.ts",
        "src/components/**/model/user-action-types.ts",
        "src/**/*.test.*",
      ],
    },
    projects: [
      {
        extends: true, // Inherit root config (plugins, globals, coverage, setupFiles, env)
        test: {
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          name: "jsdom",
        },
      },
    ],
    setupFiles: ["./vitest.setup.ts"],
    env: loadEnv("", process.cwd(), ""),
  },
});
