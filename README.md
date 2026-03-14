# CENCERA — Web Dashboard (MVP)

A Next.js showcase platform for the CenceraAI On-Chain Immortal AI Agent and its Trust Protocol layer.

## Overview

This is the public-facing web platform for CENCERA. It presents:

- **Trust Score Engine** — Address search with a 4-domain trust analysis UI (On-Chain, Market, Off-Chain, AI-Derived)
- **Agent Dashboard** — Live activity feed, Innovation Score, Memory Hash, and on-chain state for the CenceraAI agent
- **Plans** — Tiered API pricing (Free / Growth / Enterprise) aligned with the Trust Protocol whitepaper
- **Settings** — Read-only showcase of the full agent configuration and system architecture

> **Note:** The trust score search and dashboard currently display demo data. Live integration with the BNB Chain contract and the backend agent is planned.

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** TailwindCSS, Framer Motion
- **Wallet Connect:** Reown AppKit + Wagmi *(config present, not actively gated in current version)*
- **Backend AI Agent:** Node.js backend in `../backend/` — separate service, not yet wired to this frontend

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home — trust score search + stat cards
│   ├── dashboard/page.tsx    # Agent Dashboard — Innovation Score, Activity Feed, Memory Hash
│   ├── plans/page.tsx        # Pricing tiers
│   └── settings/page.tsx     # Agent configuration showcase (read-only)
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar (desktop + mobile)
│   ├── SidebarClient.tsx     # Client wrapper for sidebar
│   ├── SearchInput.tsx       # Trust score search UI + result display
│   ├── TrustGauge.tsx        # Score gauge component
│   └── GlobalLoadingOverlay.tsx
└── lib/
    └── plans.ts              # Plan definitions (Free / Growth / Enterprise)
```

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_REOWN_PROJECT_ID=   # Reown AppKit project ID (for wallet connect)
```

## Pages

### Home (`/`)
Entry point. Address search bar for trust scoring + stat cards showing Entities Scored, Signal Domains, and Chain Coverage.

### Dashboard (`/dashboard`)
Shows the CenceraAI agent's on-chain identity:
- Agent ID, Innovation Score, uptime, last evolution timestamp
- Current Memory Hash (Unibase Membase)
- Chain status (BNB Chain Testnet)
- Live activity feed (evolution events, analysis, Telegram sync, Membase writes)

> Currently uses static demo data. Planned: live reads from `CenceraAgent.sol` smart contract.

### Plans (`/plans`)
Pricing tiers sourced from `src/lib/plans.ts`. Monthly/annual billing toggle.

| Plan | Price | Highlights |
|---|---|---|
| Free | $0 | 50 credits/mo, composite score, 18 chains |
| Growth | $29/mo | Full Trust Manifold, score trajectory, batch 100 |
| Enterprise | Custom | Signal-level detail, batch 500, webhooks, SLA |

> All plans are free during testnet showcase. Billing active at mainnet launch.

### Settings (`/settings`)
Read-only display of the agent's configuration: identity, memory layer, on-chain state, trust protocol parameters, ecosystem integrations, and infrastructure stack.

## Relationship to the Backend Agent

The `../backend/` directory contains the live CenceraAI agent (Node.js + Express) with:
- Telegram bot interface
- ASI-1 Mini / Gemini LLM
- Unibase Membase memory
- BNB Chain smart contract integration
- Autonomous evolution loop (~60s cycle)

This web dashboard is currently a standalone frontend. Future versions will connect to the backend API to serve live agent data and enable in-browser chat with Cencera.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Deployment

Deploy to Vercel or any Node host. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin. No server-side secrets required for the current demo version.
