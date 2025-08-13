# OpenBiz Udyam Registration Demo

Monorepo with:
- frontend: Next.js + TypeScript + Tailwind
- backend: Express + Prisma + Zod
- scraper: Puppeteer + Cheerio (outputs JSON schemas)
- schema: Shared Zod schemas and types

## Quickstart

1. Install deps

```bash
npm i
```

2. Build shared schemas

```bash
npm --workspace schema run build
```

3. Start backend and frontend in parallel

```bash
npm run dev
```

Backend: http://localhost:4000
Frontend: http://localhost:3000

### Scraper

```bash
npm run scrape
```
Outputs to `schema/generated/step1.json`.

### Database
Set `DATABASE_URL` (PostgreSQL) in `backend/.env` then run:

```bash
npm --workspace backend run prisma:migrate
```

If DB is not configured, the backend validates and returns `202` without storing. 