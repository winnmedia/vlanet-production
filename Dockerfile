# VideoplaNet 프로덕션 Docker 이미지
# 멀티 스테이지 빌드로 최적화된 이미지 크기 달성

# ====================================
# 1. Dependencies 단계 - 의존성 설치
# ====================================
FROM node:20-alpine AS deps

WORKDIR /app

# pnpm 설치 및 설정
RUN npm install -g pnpm@8.15.0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 의존성 파일만 먼저 복사 (Docker 캐시 최적화)
COPY package.json pnpm-lock.yaml ./

# 프로덕션 의존성만 설치
RUN pnpm install --frozen-lockfile --prod

# ====================================
# 2. Builder 단계 - 애플리케이션 빌드
# ====================================
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm@8.15.0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 소스 코드 복사
COPY package.json pnpm-lock.yaml ./
COPY . .

# 전체 의존성 설치 (개발 의존성 포함)
RUN pnpm install --frozen-lockfile

# 빌드 시 환경 변수 설정 (필요시)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

# 프로덕션 빌드
RUN pnpm build

# ====================================
# 3. Runtime 단계 - 프로덕션 이미지
# ====================================
FROM node:20-alpine AS runner

WORKDIR /app

# 보안을 위한 유저 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 타임존 설정
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul

# 런타임에 필요한 파일들만 복사
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Next.js standalone 출력 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 보안 및 성능을 위한 유저 전환
USER nextjs

# 포트 설정
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 애플리케이션 실행
CMD ["node", "server.js"]