# MB Quizzes Operating System

Internal business operating system for MB Quizzes. Pulls live data from Ticket Tailor and Stripe, reconciles payments, calculates event economics, and supports go/no-go decisions.

## Architecture

```
mb-quizzes-ops/
├── backend/          # Express + TypeScript + Prisma + SQLite
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── services/ # Ticket Tailor, Stripe, Sync, Calculator
│       ├── routes/   # REST API endpoints
│       ├── lib/      # Shared utilities
│       └── __tests__/# Unit & integration tests
├── frontend/         # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/    # Dashboard, Event Detail, Bingo, Planner, etc.
│       ├── components/
│       └── lib/      # API client, helpers
└── README.md
```

## Quick Start

```bash
# 1. Install backend
cd backend
cp .env.example .env   # Add your API keys
npm install
npx prisma migrate dev
npm run seed
npm run dev

# 2. Install frontend (new terminal)
cd frontend
npm install
npm run dev
```

Backend runs on http://localhost:3001
Frontend runs on http://localhost:5173

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `TICKET_TAILOR_API_KEY` | Ticket Tailor API key (server-side only) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `DATABASE_URL` | SQLite path (default: `file:./dev.db`) |

**Never put API keys in frontend code.**

## Key Modules

### Calculation Engine (`backend/src/services/calculator.ts`)
Pure-function engine. No side effects. Fully testable. Computes:
- Gross charged, VAT, Stripe fees, PAYG
- Profit pool, host take, Lee/MB take
- Prize budgets and boards
- Go / Hold / Do Not Run decisions
- Bonus conversion forecasts

### Sync Engine (`backend/src/services/sync.ts`)
- Manual "Sync Now" or scheduled polling
- Idempotent upserts — safe to re-run
- Sync log with timestamps and error tracking

### Reconciliation (`backend/src/services/reconciliation.ts`)
- Matches Stripe payments to Ticket Tailor orders
- Flags: unmatched payments, missing charges, refunds, duplicates

### Saturday Bingo Module
- 4-game structure (3 standard + bonus jackpot)
- Dynamic prize board by sales level
- Bonus-buyer lag forecasting
- Run/Hold/Do Not Run decision logic

## Testing

```bash
cd backend
npm test
```

## Deployment

The app is designed for simple deployment:
- SQLite for v1 (single-file database)
- Swap `DATABASE_URL` to Postgres connection string for v2
- Frontend builds to static files: `cd frontend && npm run build`
- Serve frontend from backend or any static host

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | List all synced events |
| GET | `/api/events/:id` | Event detail with economics |
| GET | `/api/events/:id/economics` | Live economics calculation |
| POST | `/api/events/:id/decision` | Log run/hold/decline decision |
| POST | `/api/sync` | Trigger manual sync |
| GET | `/api/sync/log` | Sync history |
| GET | `/api/assumptions` | Current assumption set |
| PUT | `/api/assumptions` | Update assumptions |
| GET | `/api/bingo/:eventId` | Saturday bingo calculator |
| GET | `/api/reconciliation` | Exception report |
| GET | `/api/decisions` | Decision log |
| GET | `/api/planner` | Monthly planner data |
| GET | `/api/reports/bingo-matrix` | Bingo profit pool matrix |
