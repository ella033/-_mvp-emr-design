# =============================================================================
# Multi-stage Dockerfile for Next.js Production Deployment (Standalone)
# =============================================================================
# syntax=docker/dockerfile:1.4

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat dumb-init

WORKDIR /app

# 패키지 파일만 복사
COPY package.json pnpm-lock.yaml ./

# Corepack: Node.js 내장 패키지 매니저 관리 도구
# - corepack enable: corepack을 활성화하여 pnpm/yarn 명령어를 가로채도록 설정
# - corepack prepare --activate: package.json의 "packageManager" 필드에 명시된
#   pnpm 버전(예: pnpm@10.17.1)을 미리 다운로드하고 활성화
# → 이를 통해 로컬/CI/Docker 모든 환경에서 동일한 pnpm 버전을 사용하여
#   lockfile 호환성 문제를 방지함
RUN corepack enable && corepack prepare --activate

# 의존성 설치
# - --mount=type=cache: Docker BuildKit 캐시 마운트로 pnpm store를 레이어 간 재사용
#   → 재빌드 시 이미 다운로드된 패키지를 다시 받지 않아 빌드 속도 향상
# - --frozen-lockfile: pnpm-lock.yaml을 수정하지 않고 그대로 사용
#   → lockfile과 package.json이 불일치하면 에러 발생 (프로덕션 빌드 안전성 보장)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# package.json을 먼저 복사해야 corepack이 packageManager 버전을 읽을 수 있음
COPY package.json pnpm-lock.yaml ./

# Corepack으로 pnpm 활성화 (package.json의 packageManager 버전과 동일하게 설치)
# → builder 스테이지는 deps와 별개의 이미지이므로 pnpm을 다시 활성화해야 함
RUN corepack enable && corepack prepare --activate

# node_modules 복사
COPY --from=deps /app/node_modules ./node_modules
COPY next.config.ts tsconfig.json ./
COPY tailwind.config.js postcss.config.* ./

# 빌드 아규먼트
ARG NEXT_PUBLIC_APP_API_URL
ARG NEXT_PUBLIC_SOCKET_SERVER_URL
ARG APP_API_URL

# 환경 변수 설정
ENV NEXT_PUBLIC_APP_API_URL=$NEXT_PUBLIC_APP_API_URL
ENV NEXT_PUBLIC_SOCKET_SERVER_URL=$NEXT_PUBLIC_SOCKET_SERVER_URL
ENV APP_API_URL=$APP_API_URL
ENV NODE_ENV=production

# 소스 코드 복사
COPY src ./src
COPY public ./public
COPY scripts ./scripts

# FIXME: 메모리 필요 크기 확인 후 조정 필요요
# Next.js 빌드 시 Node 힙 메모리 확장 (빌드 OOM 방지)
ARG NEXTJS_BUILD_MAX_OLD_SPACE_SIZE=4096

# Next.js 빌드 (캐시 마운트)
RUN --mount=type=cache,id=nextjs-build,target=/app/.next/cache \
  NODE_OPTIONS="--max-old-space-size=${NEXTJS_BUILD_MAX_OLD_SPACE_SIZE}" pnpm run build

# 프로덕션 의존성만 남기기 (선택사항: standalone이 이미 처리함)
# RUN pnpm prune --prod --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production with Standalone)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Puppeteer/Chrome 실행에 필요한 패키지 설치
# NOTE: 현재 Puppeteer 기반 API를 사용하지 않으므로 빌드 시간/이미지 크기 절감을 위해 주석 처리
# RUN apk add --no-cache \
#   chromium \
#   nss \
#   freetype \
#   harfbuzz \
#   ca-certificates \
#   ttf-freefont \
#   ttf-dejavu \
#   ttf-droid \
#   ttf-liberation \
#   ttf-opensans \
#   dumb-init \
#   wget \
#   unzip \
#   fontconfig

# NOTE: dumb-init은 CMD에서 사용 중이라 유지
RUN apk add --no-cache dumb-init

# 한글 폰트 설치를 위한 디렉토리 생성 (나중에 public/fonts 복사 후 설치)
# NOTE: 현재 서버에서 폰트 설치를 사용하지 않으므로 주석 처리
# RUN mkdir -p /usr/share/fonts/nanumfont

# Non-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=production
# NOTE: Puppeteer/Chromium 미사용이므로 주석 처리
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# ⭐ Standalone 빌드 산출물 복사 (핵심!)
# Next.js가 필요한 파일만 자동으로 추출해서 standalone 디렉토리에 넣음
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# ⭐ Static 파일 복사 (standalone에는 static 파일이 없음)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ⭐ Public 파일 복사
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 한글 폰트 설치 (public/fonts의 나눔고딕을 시스템 폰트로 등록)
# 웹폰트와 시스템 폰트가 동일한 파일을 사용하여 브라우저/PDF 렌더링 일치
# NOTE: 현재 서버에서 폰트 설치를 사용하지 않으므로 주석 처리
# RUN cp /app/public/fonts/NanumGothic*.ttf /usr/share/fonts/nanumfont/ && \
#   fc-cache -f

USER nextjs

EXPOSE 3000

# ⭐ Node.js로 직접 실행 (npm 오버헤드 없음)
CMD ["dumb-init", "node", "server.js"] 
