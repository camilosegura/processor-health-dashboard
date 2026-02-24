# Processor Health Dashboard - Mirage Retail

A real-time payment processor health monitoring dashboard built for Mirage Retail's operations team. Designed to make performance degradation immediately visible so teams can react within minutes, not days.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

No additional setup, environment variables, or databases required. The application generates realistic mock data on startup.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** (App Router) | React framework with API routes |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling for a dark, monitoring-grade UI |
| **Recharts** | Data visualization (line charts, area charts, bar charts) |
| **Lucide React** | Icon library |

### Why this stack?

- **Next.js API routes** allow the mock backend and frontend to live in one project with zero configuration
- **Recharts** provides composable chart components that work well with React's rendering model and handle responsive layouts out of the box
- **Tailwind CSS** enables rapid iteration on visual design without context-switching to CSS files
- **Dark theme** was chosen deliberately - operations dashboards are often monitored for extended periods, and dark interfaces reduce eye strain in NOC/war room environments

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Main dashboard (single-page app)
│   └── api/
│       ├── processors/     # GET processor health + time series
│       ├── metrics/        # GET multi-processor comparison data
│       └── transactions/   # GET paginated transaction drill-down
├── components/
│   ├── overview/           # Processor cards, health indicators
│   ├── charts/             # Recharts-based visualization components
│   ├── compare/            # Comparison table
│   ├── alerts/             # Alert thresholds, transaction drill-down
│   └── ui/                 # Shared UI primitives
├── lib/
│   ├── data/               # Mock data generation engine
│   │   ├── generators.ts   # Core data orchestrator (cached in-memory)
│   │   ├── processors.ts   # 5 processor definitions
│   │   ├── anomalies.ts    # Anomaly pattern injection
│   │   ├── time-series.ts  # Time-bucketed metric aggregation
│   │   └── seed.ts         # Deterministic PRNG for reproducibility
│   └── utils/              # Formatting, health calculation
└── types/                  # TypeScript interfaces
```

### Data Generation

The dashboard uses a deterministic mock data generator (`seed=42`) that produces:

- **~82,000+ transactions** across 7 days
- **5 payment processors** with distinct baseline performance profiles
- **Realistic anomaly patterns**:
  - **PayFastMX**: Authorization rate dropped from 82% to ~61% starting 18 hours ago (ongoing)
  - **Andean Gateway**: Response times spiked to 5-8x baseline starting 12 hours ago (ongoing)
  - **Cloudbank**: Brief auth rate dip 3 days ago (recovered)
  - **NovaPago**: Latency blip 2 days ago (recovered)
  - **LatamPay**: Minor auth wobble yesterday (recovered)
- **Geographic distribution**: Mexico (40%), Colombia (30%), Brazil (30%)
- **Time-of-day patterns**: Higher volume during business hours, lower overnight

Data is generated once on the first API request and cached in module-level memory. No persistence layer needed.

## Features Completed

### Core Requirement 1: Real-Time Processor Health Overview
- 5 processor cards showing current auth rate, response time, and volume
- Visual health status (healthy/degraded/critical) with color-coded borders, icons, and gradient backgrounds
- Trend indicators showing change vs. previous hour
- Auto-refresh every 30 seconds
- Cards sorted by severity (critical first)

### Core Requirement 2: Time-Based Performance Analysis
- Time range selector: 1H, 6H, 24H, 7D
- **Authorization Rate Chart**: Multi-line chart showing approval % over time per processor
- **Response Time Chart**: Area chart showing P50 (solid) and P95 (dashed) latency
- **Volume Chart**: Stacked bar chart showing transaction volume distribution
- Adaptive time bucket granularity (5min for 1H, 15min for 6H, 30min for 24H, 2H for 7D)
- Custom tooltips with formatted values

### Core Requirement 3: Comparative Processor View
- Click processor cards to select 2-4 for comparison
- **Comparison table**: Side-by-side metrics with BEST/WORST highlighting
- **Comparison charts**: Overlaid authorization rate and response time charts
- Dedicated "Compare" tab with clear empty state when fewer than 2 selected

### Stretch Goal A: Alert Threshold Visualization
- Configurable warning and critical thresholds for auth rate and response time
- Reference lines displayed on charts showing threshold boundaries
- Settings modal with enable/disable toggles and adjustable values
- Alert banner at page top when processors are in critical/degraded state

### Stretch Goal B: Transaction-Level Drill-Down
- Modal overlay showing individual transactions for a processor
- Filterable by status (approved/declined/timeout/error) and country (MX/CO/BR)
- Paginated table with 20 transactions per page
- Color-coded response times (red >5s, amber >3s)
- Decline reason display for rejected transactions

## Data Visualization Approach

### Why these chart types?

| Chart | Type | Rationale |
|-------|------|-----------|
| Authorization Rate | **Line chart** | Rate changes are best seen as continuous trends. Multiple overlaid lines make degradation patterns immediately obvious through divergence. |
| Response Time | **Area chart** with P50+P95 | Area fills make latency spikes visually dominant. Showing both P50 and P95 lets teams distinguish between "most users are slow" vs "some users are very slow". |
| Volume | **Bar chart** | Discrete time buckets of volume are natural for bar representation. Makes it easy to spot traffic shifts between processors. |
| Health Status | **Color + icon** | Red/amber/green with pulsing animation for critical states follows universal traffic-light convention. Requires zero training to understand. |
| Comparison | **Table + overlay charts** | Tables give precise numbers; overlay charts show temporal patterns. Both are needed for different decision types. |

### Design Decisions

- **Dark theme**: Operations dashboards are monitored continuously. Dark themes reduce eye strain in NOC environments.
- **Critical sorting**: Processor cards are sorted by severity so the most urgent issues are always top-left.
- **Pulsing animation**: Critical processors have a subtle pulsing dot to draw attention without being distracting.
- **Alert banner**: Persistent top-of-page banner ensures the problem is visible even when scrolled down in charts.
- **Threshold reference lines**: Dashed lines on charts make it visually clear when metrics cross alert boundaries.

## Known Limitations

1. **Static mock data**: Data is generated at startup and doesn't change between refreshes (the same seed produces identical data). In production, this would connect to a real-time data pipeline.
2. **No custom time range**: Only preset ranges (1H/6H/24H/7D) are implemented. Custom date picker was deprioritized in favor of core functionality.
3. **No annotations (Stretch Goal C)**: Performance annotation feature was not implemented.
4. **No persistent state**: Alert thresholds reset on page refresh (stored in React state only).
5. **Single page app**: The compare and drill-down features are integrated into the main page rather than separate routes, which simplifies state management but limits deep-linking.

## What I'd Improve With More Time

- WebSocket-based real-time updates instead of polling
- Custom date range picker with calendar UI
- Performance annotations with persistence
- Export to PDF/CSV for incident reports
- Mobile-responsive layout improvements
- E2E tests with Playwright
- Error boundary components for graceful failure handling

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com):

```bash
npm run build
# or deploy directly via Vercel CLI
npx vercel
```

No environment variables or external services needed.
