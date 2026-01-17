# CENCERA – Universal Trust Score Layer (MVP)

The MVP of CENCERA is a Next.js 16 application that computes a Universal Trust Score for Web3 entities (wallets, contracts, tokens) by blending on-chain heuristics, market data, social signals, and AI analysis. It includes wallet gating, an analysis UI, simulation tooling, and reporting integrations.

## Overview

- Next.js 16 (App Router) with React 19, TypeScript, TailwindCSS
- Chain engines per network using viem; wallet connect via Reown AppKit + Wagmi
- AI integration with ChainGPT for security/trust reports
- API endpoints for analysis, trust agent, simulation, and Telegram reporting

## Quick Start

- Prereqs: Node.js 20+ (recommended), npm 10+
- Install: `npm install`
- Configure environment: create `.env.local` (see Environment Variables)
- Develop: `npm run dev` then open <http://localhost:3000>
- Lint: `npm run lint`
- Build: `npm run build`
- Start (production): `npm run start`

## Environment Variables

Create a `.env.local` file in the project root with values as needed:

- NEXT_PUBLIC_SITE_URL: Site origin used for metadata and OG tags; e.g. <http://localhost:3000>
- NEXT_PUBLIC_REOWN_PROJECT_ID: Reown AppKit project ID for wallet connect
- CHAINGPT_API_KEY: ChainGPT Web3 LLM API key for AI features
- CHAINGPT_INSTRUCTIONS_PATH: Optional path to instructions file for the AI agent
- TELEGRAM_BOT_TOKEN: Telegram Bot API token for reporting
- TELEGRAM_CHAT_ID: Chat ID where reports are posted
- TELEGRAM_TOPIC_ID: Optional topic/thread ID for general reports
- TELEGRAM_ANALYSIS_TOPIC_ID: Optional topic/thread ID for analysis reports

References:

- Site URL usage: [layout.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/layout.tsx#L1-L31)
- Wallet connect config: [walletConfig.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/walletConfig.ts#L1-L31)
- ChainGPT engine and instructions path: [ChainGptEngine.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/ai/ChainGptEngine.ts#L1-L26)
- Engine factory and API key: [factory.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/factory.ts#L1-L25)
- Telegram reporting envs: [report route](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/report/route.ts#L16-L23) and [report-analysis route](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/report-analysis/route.ts#L18-L23)

## Scripts

- `npm run dev`: Start Next.js dev server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint (Next.js core web vitals configuration)

Package metadata: [package.json](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/package.json#L5-L10)

## Project Structure

- App Router pages and API:
  - UI: [src/app/page.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/page.tsx), [analysis/page.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/analysis/page.tsx), [dashboard/page.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/dashboard/page.tsx), [settings/page.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/settings/page.tsx)
  - API: [analyze](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/analyze/route.ts), [trust-agent](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/trust-agent/route.ts), [simulate](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/simulate/route.ts), [report](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/report/route.ts), [report-analysis](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/report-analysis/route.ts)
- Components: [src/components](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/components)
- Engines: [src/engine](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine) (per-chain agents + base engine + AI)
- Libraries: [src/lib](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib) (analysis, blockchain, market data, known tokens, social)

Key files:

- Analysis composition: [analysisEngine.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/analysisEngine.ts)
- Base EVM heuristic engine: [BaseEvmEngine.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/BaseEvmEngine.ts)
- Per-chain agents: [factory.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/factory.ts)
- AI agent orchestration: [aiAgent.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/aiAgent.ts)
- ChainGPT integration: [ChainGptEngine.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/ai/ChainGptEngine.ts), instructions: [chaingpt_instructions.txt](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/ai/chaingpt_instructions.txt)
- Wallet connect and gating: [Sidebar.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/components/Sidebar.tsx), [WalletProvider.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/components/WalletProvider.tsx), [walletConfig.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/walletConfig.ts)

## Operating the App

- Home page provides entry to analysis and quick actions.
- Connect wallet (Reown AppKit) to access gated pages (Dashboard, Settings).
- Analysis page:
  - Search by address or ENS; select chain; view trust gauge, risks, sentiment, market values.
  - Simulation panel supports native transfers, ERC-20 transfer/approve, proxy and paused checks.
- Reporting:
  - “Report Issue” opens a modal to submit bug/feature/other feedback, optionally with chain and address.
  - Backend posts to Telegram using configured bot and chat.

## API Reference

- GET `/api/analyze?q=<address_or_ens>&chain=<chainId>`
  - Returns trust_score, risk_level, flags, summary, sentiment, and market_data.
  - Implementation: [route.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/analyze/route.ts)
- GET `/api/trust-agent?q=<address_or_ens>&chains=<comma_separated_chainIds>`
  - Runs multi-engine trust agent, aggregates baseline score, and requests AI summary.
  - Implementation: [route.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/trust-agent/route.ts)
- POST `/api/simulate`
  - Body supports `action` values: `native_transfer`, `erc20_transfer`, `erc20_approve`, `contract_call`, `quick_native`, `quick_erc20_transfer`, `quick_erc20_approve`, `quick_proxy`, `quick_paused`.
  - Implementation: [route.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/simulate/route.ts)
- POST `/api/report`
  - Body: `{ type, severity, content, address?, chain? }`
  - Implementation: [route.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/report/route.ts)
- POST `/api/report-analysis`
  - Body: `{ reason, details, address?, chain? }`
  - Implementation: [route.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/app/api/report-analysis/route.ts)

### Example Requests

Analyze:

```bash
curl "http://localhost:3000/api/analyze?q=vitalik.eth&chain=1"
```

Trust agent:

```bash
curl "http://localhost:3000/api/trust-agent?q=vitalik.eth&chains=1,10,42161,56,8453"
```

Simulate ERC-20 transfer:

```bash
curl -X POST "http://localhost:3000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"chainId":"1","action":"erc20_transfer","from":"0x0000000000000000000000000000000000000001","to":"0x0000000000000000000000000000000000000002","token":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","amount":"1"}'
```

## Trust Score Logic

- Chain engines collect: address/ENS, native balance, transaction count, contract code size, token metadata.
- Heuristics produce per-chain scores and flags; scores normalized and labeled.
- AI agent generates summary, risk level, and audit notes, either single-chain or multi-chain.
- Market data adds USD normalizations via CoinGecko native prices.

References:

- Analysis composition: [analysisEngine.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/analysisEngine.ts)
- Native price sourcing: [marketData.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/marketData.ts)
- Base engine rules: [BaseEvmEngine.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/engine/BaseEvmEngine.ts)

## Wallet Gating

- Dashboard and Settings pages prompt to connect when no wallet.
- Uses Reown AppKit with Wagmi; project ID configured via env.

References:

- Sidebar gating: [Sidebar.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/components/Sidebar.tsx)
- Wallet provider: [WalletProvider.tsx](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/components/WalletProvider.tsx)
- Config: [walletConfig.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/src/lib/walletConfig.ts)

## Development Notes

- TypeScript target: ES2017; avoid BigInt literals in server responses.
- ESLint config: Next.js core web vitals setup; run `npm run lint`.
- React Compiler enabled in Next config for performance: [next.config.ts](file:///c:/Users/RealShahriya/Desktop/CENCERA/mvp/next.config.ts#L3-L6)

## Security

- Do not commit secrets; keep all keys in `.env.local` or your host environment.
- Validate inputs server-side for API endpoints; current routes sanitize and guard common errors.
- Be cautious with simulation endpoint; it performs read/simulate calls only and does not send transactions.

## Deployment

- Vercel or any Node host: set environment variables in the host, build with `npm run build`, run `npm run start`.
- Ensure `NEXT_PUBLIC_SITE_URL` matches the deployed origin for correct OG metadata.
- Provide `CHAINGPT_API_KEY` on the server for AI features.

## Troubleshooting

- Missing telegram configuration returns `telegram_not_configured` from report endpoints.
- Invalid analyze query returns 400 with guidance; check `q` and `chain` params.
- Simulation `not_contract` indicates token address lacks bytecode.
- If AI features fail, app falls back to deterministic summaries; check ChainGPT key and instructions path.
