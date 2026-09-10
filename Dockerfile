# ==============================================================================
# Dockerfile — TradeFlow Next.js 15 Multi-Stage Production Image
# ==============================================================================

# 1. Dependency Resolution
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Provide dummy build-time environment variables for static route compilation
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SUPABASE_URL="https://mock-tradeflow.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_anon_key"
ENV SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_service_key"
ENV STRIPE_SECRET_KEY="sk_test_mock_stripe_key"
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_mock_stripe_pubkey"
ENV STRIPE_WEBHOOK_SECRET="whsec_mock_stripe_webhook_secret"
ENV STRIPE_STARTER_PRICE_ID="price_starter_mock_39"
ENV RESEND_API_KEY="re_mock_resend_api_key"
ENV EMAIL_FROM="TradeFlow <notifications@tradeflow.app>"

RUN npm run build

# 3. Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output traces and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
