# Railway production image for HYPD Hub.
#
# Uses Microsoft's official Playwright image which ships with Chromium +
# every shared library the headless browser needs (libglib, libnss, libatk,
# xorg, fontconfig, etc). Nixpacks + apt refused to install these reliably
# because Railway's Nix base doesn't have apt, and nix package names kept
# drifting. This is the canonical "just works" approach for Playwright
# on a PaaS.

FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS builder

WORKDIR /app

# Install deps first for layer caching.
COPY package.json package-lock.json ./
# --ignore-scripts avoids running playwright install a second time — the base
# image already has browsers at /ms-playwright. PLAYWRIGHT_BROWSERS_PATH is
# set at runtime so Playwright finds them.
RUN npm ci --ignore-scripts

COPY . .

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
RUN npm run build

# ─── Runtime image ───────────────────────────────────────────────────────
# Keep the same base so shared libs are still present.
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_OPTIONS=--max-old-space-size=512
ENV PORT=3000

# Copy only what's needed at runtime.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
