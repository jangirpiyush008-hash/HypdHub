# HYPD Deals Hub

Premium HYPD-inspired Next.js front-end for:

- Daily top-deal discovery
- HYPD affiliate link conversion
- Creator dashboard views
- Telegram and WhatsApp connection flows
- Public homepage previews plus creator-gated deal feed and dashboard
- API scaffolding for HYPD, marketplaces, ranking, refresh, and Telegram ingestion

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current scope

This build now includes:

- Public homepage previews
- Creator-gated full deal feed
- Creator-gated dashboard and converter
- Mock auth provider ready for HYPD SSO replacement
- `/api/deals`, `/api/ranking`, `/api/refresh`, `/api/session`, `/api/ingestion/telegram`
- Ranking model scaffolding for HYPD + marketplace + Telegram signals

Real integrations still need:

- HYPD authentication and user sync
- HYPD link-save and click tracking APIs
- Playwright scraping workers
- MongoDB, Redis, and BullMQ
- Telegram and WhatsApp bot backends
