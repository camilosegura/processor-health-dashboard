# Processor Health Dashboard

## Project Overview
Real-time payment processor health monitoring dashboard for Mirage Retail. Built as a frontend-focused code challenge. Single-page dashboard that visualizes authorization rates, response times, and transaction volumes across 5 payment processors operating in Mexico, Colombia, and Brazil.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (dark theme only)
- **Charts**: Recharts v3
- **Icons**: Lucide React
- **Dates**: date-fns v4
- **No database** - all data is generated in-memory via a seeded PRNG

## Commands
```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (also runs TypeScript checks)
npm run lint     # ESLint
npm start        # Serve production build
```

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Main dashboard (all UI state lives here)
│   ├── layout.tsx                  # Root layout with fonts and metadata
│   ├── globals.css                 # Tailwind imports + custom CSS (dark theme vars, animations)
│   └── api/
│       ├── processors/route.ts     # GET /api/processors - current health for all 5 processors
│       ├── processors/[id]/route.ts # GET /api/processors/:id?range=24h - time series for one
│       ├── metrics/route.ts        # GET /api/metrics?ids=a,b&range=24h - multi-processor comparison
│       └── transactions/route.ts   # GET /api/transactions?processorId=...&status=...&page=1
├── components/
│   ├── overview/                   # ProcessorGrid, ProcessorCard, HealthIndicator, MetricStat
│   ├── charts/                     # AuthorizationRateChart, ResponseTimeChart, VolumeChart, CustomTooltip
│   ├── compare/                    # ComparisonTable
│   ├── alerts/                     # AlertConfig (threshold modal), TransactionDrillDown (modal)
│   └── ui/                         # TimeRangeSelector
├── lib/
│   ├── data/
│   │   ├── generators.ts           # Main data engine - generates ~82K transactions, caches in module scope
│   │   ├── processors.ts           # 5 processor configs (PayFastMX, Cloudbank, Andean Gateway, LatamPay, NovaPago)
│   │   ├── anomalies.ts            # Anomaly patterns (auth rate drops, latency spikes with timing)
│   │   ├── time-series.ts          # Aggregation into time-bucketed MetricSnapshots
│   │   └── seed.ts                 # Mulberry32 PRNG + helpers (randomBetween, weightedChoice)
│   └── utils/
│       ├── health.ts               # calculateHealthStatus() + status color helpers
│       └── format.ts               # formatPercent, formatMs, formatNumber, formatCurrency, formatDateTime
└── types/
    ├── processor.ts                # ProcessorConfig, ProcessorHealth, ProcessorWithHealth, HealthStatus
    ├── transaction.ts              # Transaction, TransactionStatus, DeclineReason
    ├── metrics.ts                  # TimeSeriesPoint, MetricSnapshot, TimeRange, TimeRangeOption
    └── alerts.ts                   # AlertThreshold, Annotation
```

## Key Architecture Decisions
- **Single page app**: All dashboard state (selected processors, time range, active tab) lives in `page.tsx` via `useState`. No global state management library needed.
- **Server-side data generation**: Mock data is generated in API routes (Node.js), cached in module-level variables. First request takes ~500ms, subsequent requests are instant.
- **Deterministic seed (42)**: All random data uses a seeded PRNG so the dataset is reproducible across restarts.
- **All chart components are client components** (`'use client'`) because Recharts requires browser APIs.
- **API routes follow REST**: `/api/processors` for list, `/api/processors/[id]` for detail with `?range=` query param.

## Data Model
- 5 processors with different baseline auth rates (78-85%) and response times (800-1500ms)
- Active anomalies: PayFastMX has auth rate crash (~56%), Andean Gateway has latency spike (~8.4s)
- Health thresholds: critical if auth <65% or response >5000ms; degraded if auth <75% or response >3000ms
- Time series bucket sizes adapt to range: 5min (1H), 15min (6H), 30min (24H), 2h (7D)

## Conventions
- Named exports for all components (no default exports except page components)
- `'use client'` directive only on interactive components
- TypeScript interfaces in `src/types/`, one file per domain
- Constants use `as const` with derived types
- Path alias `@/*` maps to `src/*`
- Color palette: processor colors defined in `processors.ts`, status colors in `health.ts`
- All monetary amounts are in local currency (MXN, COP, BRL)
