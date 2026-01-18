# CENCERA — What & Why

## What

- A Universal Trust Score for wallets, contracts, and tokens across chains.
- Outputs a 0–100 score with a short AI summary, risk level, and flags.
- Provides quick simulations (read-only) and simple reporting.

## Why

- Web3 trust signals are scattered; users need one clear, explainable score.
- Faster triage reduces fraud exposure and time-to-confidence.
- Explainable AI notes make decisions auditable for teams.

## Design Choices (Necessary)

- Background: Dark static grid for clarity, legibility, and performance. Animation/“eyes” removed to avoid distraction and keep focus on analysis results.
- Wallet gating: Reown AppKit + Wagmi for minimal friction and familiar UX.
- Scoring: Lightweight heuristics + market USD normalization + concise AI summary for a balance of speed and signal.

## How (Brief)

- Chain engines gather basics (balance, tx count, contract/token hints).
- Heuristics produce per-chain score/flags; AI generates short summary & risk.
- Market data maps native tokens to USD for consistent comparisons.

## Use (Quick)

- Analyze: UI Quick Analysis or GET `/api/analyze?q=<ens_or_address>&chain=<id>`
- Multi-chain: GET `/api/trust-agent?q=<ens_or_address>&chains=1,10,42161,56,8453`
- Simulate: POST `/api/simulate` with `action` like `erc20_transfer`, `proxy`, `paused`
- Report: POST `/api/report` to send feedback to Telegram

## Setup (Minimal)

- `.env.local`: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_REOWN_PROJECT_ID`, `CHAINGPT_API_KEY` (+ optional Telegram keys)
- `npm install` → `npm run dev` → open `http://localhost:3000`
