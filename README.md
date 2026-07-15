# cambium-web-app

The public marketplace frontend for Cambium Protocol — browse projects, trade carbon credits, and retire credits for verifiable offsets, built on Stellar/Soroban.

> Part of the [Cambium Protocol](https://github.com/cambium-protocol) organization.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Building for production](#building-for-production)
- [Key flows](#key-flows)
- [Wallet support](#wallet-support)
- [Accessibility & i18n](#accessibility--i18n)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`web-app` is the reference frontend for Cambium Protocol. It is intentionally built as a thin client on top of [`sdk-js`](https://github.com/cambium-protocol/sdk-js) — almost no protocol logic lives here; this repo is about UX, data presentation, and wallet interaction. Anyone is free to build a competing or alternative frontend against `sdk-js` directly; this app is not privileged in the protocol in any way.

---

## Features

- **Project explorer** — browse registered carbon projects by methodology, geography, vintage, and available supply, with full provenance (registry cross-references, MRV proof status, dispute history if any).
- **Trading** — swap credits via the AMM pool or place/manage limit orders, with slippage estimates.
- **Fractional purchase** — buy credits down to the token's minimum unit (default 0.001 tCO2e) — no large minimum lot size.
- **Retirement flow** — retire credits for an offset claim, with an option for shielded (private) retirement using the ZK membership-proof path, and a downloadable/shareable public retirement certificate.
- **Portfolio dashboard** — view held, traded, and retired credits across projects and vintages.
- **Public retirement ledger** — a searchable, filterable view of all retirement events on the protocol (public by design — see the org README's design principles).
- **Proof transparency panel** — for any credit, view the underlying MRV proof status, methodology version, verifying key version, and (if applicable) dispute window status.

---

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State/data fetching:** TanStack Query
- **Protocol integration:** `@cambium-protocol/sdk`
- **Wallet connection:** Freighter browser wallet (via `window.freighter` API)

---

## Repository structure

```
web-app/
├── app/
│   ├── projects/
│   │   ├── page.tsx                # project explorer
│   │   └── [projectId]/page.tsx    # project detail + proof transparency panel
│   ├── trade/
│   │   └── page.tsx
│   ├── retire/
│   │   └── page.tsx
│   ├── portfolio/
│   │   └── page.tsx
│   ├── ledger/
│   │   └── page.tsx                # public retirement ledger
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── wallet/
│   │   └── ConnectWallet.tsx
│   └── ui/
│       └── Skeleton.tsx
├── lib/
│   ├── cambiumClient.ts             # sdk-js client instance + config
│   └── hooks/
│       ├── useWallet.ts
│       └── useToast.tsx
├── tests/
│   ├── unit/
│   └── e2e/                          # Playwright
├── .github/
│   ├── workflows/ci.yml
│   └── ISSUE_TEMPLATE/
├── Dockerfile
├── next.config.js
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js 20+
- A deployed (or local sandbox) instance of [`contracts`](https://github.com/cambium-protocol/contracts) — you'll need the deployed contract addresses
- A Stellar-compatible browser wallet extension for testing wallet flows (e.g. [Freighter](https://www.freighter.app/))

---

## Setup

```bash
git clone https://github.com/cambium-protocol/web-app.git
cd web-app
pnpm install
cp .env.example .env.local
```

---

## Environment variables

```bash
# .env.local

NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

NEXT_PUBLIC_REGISTRY_CONTRACT_ID=CBSLLVCIZBXKPHY73PN5DVHQKNGK4FAZBXMQLKZCJABABUX5OQGPHC43
NEXT_PUBLIC_CREDIT_TOKEN_CONTRACT_ID=CBRBMYB6UTJEMMSBQQPYHAIO5QWJAT4EBPIFTEEB6MRY6ZZD5NS5KY36
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID=CAKXZQTCVDSGVF2BU5FY636O4TDCAX5UJCWYGQKDKMOA5QNBDKPXZ5S7
NEXT_PUBLIC_RETIREMENT_CONTRACT_ID=CDIHLUARSMSYU27QRKXBWVK5HXIJRUAQ3SYQYCK3MZ2UKMCRB275H3G5

# Optional: only needed if enabling shielded retirement in the UI
NEXT_PUBLIC_ZK_PROVING_SERVICE_URL=
```

Contract addresses should match the output of `contracts`' `scripts/deploy.sh` for whichever network you're targeting.

---

## Running locally

```bash
pnpm dev
```

App runs at `http://localhost:3000`. Connect a testnet wallet with testnet XLM (use [Friendbot](https://developers.stellar.org/docs/tools/developer-tools#friendbot) to fund a testnet account) to exercise trading and retirement flows end-to-end.

---

## Building for production

```bash
pnpm build
pnpm start
```

Static analysis and type-checking run as part of `npm run build`; the build will fail on type errors by design.

---

## Key flows

### Buying credits
`app/trade/page.tsx` → quotes a price via `client.marketplace.quote()` (read-only, no wallet needed to view) → on confirm, builds a swap transaction via `client.marketplace.swap()` → prompts wallet signature → submits and polls for confirmation.

### Retiring credits
`app/retire/page.tsx` → user selects project/vintage/amount → optional "Make this retirement private" toggle (shielded path) → if shielded, the app calls the configured ZK proving service (see `NEXT_PUBLIC_ZK_PROVING_SERVICE_URL`) to generate a membership proof before building the retirement transaction → on success, generates a shareable retirement certificate (PDF, via a server route) referencing the public, verifiable on-chain retirement record.

### Viewing proof transparency
`app/projects/[projectId]/page.tsx` pulls proof metadata (methodology version, verifying key version, dispute window status) directly from `registry` via `sdk-js`, so this data is never hardcoded or cached from an off-chain source that could drift from on-chain truth.

---

## Wallet support

| Wallet | Status |
|---|---|
| Freighter | Supported |
| Albedo | Planned — requires Stellar Wallets Kit integration |
| Ledger (via Stellar Wallets Kit) | Planned |
| xBull | Planned |
| WalletConnect-based wallets | Planned |

Wallet integration currently uses the Freighter browser extension directly via `window.freighter`. See `lib/hooks/useWallet.ts`. Stellar Wallets Kit integration is on the roadmap for multi-wallet support.

---

## Accessibility

- Targets WCAG 2.1 AA
- Semantic HTML and proper form labels used throughout

## i18n

i18n is not yet implemented. All user-facing strings are hardcoded in English. Community contributions for localization are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Testing

```bash
pnpm test           # unit tests (Vitest + React Testing Library)
pnpm test:e2e        # Playwright, requires local contracts + a funded testnet wallet fixture
```

E2E tests use a scripted Freighter test-wallet fixture (`tests/e2e/fixtures/wallet.ts`) rather than a real browser extension, for CI reliability.

---

## Deployment

The app is a standard Next.js app deployable to Vercel, or as a Docker container (`Dockerfile` included) to any Node-compatible host. The Dockerfile uses a multi-stage build with `standalone` output mode for minimal image size.

No server-side secrets are required beyond standard analytics/monitoring keys — all protocol interaction happens client-side via the connected wallet, consistent with the protocol's non-custodial design.

---

## Status

**Version 0.1.0 — testnet**

| Page | Status |
|---|---|
| Landing / marketing | Working — renders, links to Projects/Trade/Retire |
| Project explorer | Working — loads projects from registry via SDK |
| Project detail + proof transparency | Working — shows methodology version, verifying key from on-chain data |
| Trade (AMM swap) | Working — quotes, builds swap tx, submits via wallet |
| Trade (limit orders) | Coming Soon — `placeLimitOrder` / `cancelOrder` not yet in SDK |
| Retire | Scaffolded — UI renders "Coming Soon" toggle for shielded retirement; public retirement builds unsigned tx via SDK |
| Portfolio dashboard | Scaffolded — renders holdings table, needs SDK integration |
| Public retirement ledger | Scaffolded — renders retirement list, needs SDK integration |

| Infrastructure | Status |
|---|---|
| Wallet connection (Freighter etc.) | Working via Stellar Wallets Kit |
| Unit tests (Vitest) | 10/10 passing |
| E2E tests (Playwright) | Scaffolded, requires browser install in CI |

---

## Roadmap

- [x] Implement portfolio dashboard page
- [x] Implement public retirement ledger page
- [ ] Wire up retirement flow end-to-end (unsigned tx → wallet sign → submit → certificate)
- [ ] Add Recharts integration for live price charts
- [ ] Multi-wallet support via Stellar Wallets Kit
- [ ] Public API/embeddable widget for the retirement ledger (so third parties can display verified retirements on their own sites)
- [ ] Mobile-optimized retirement certificate sharing
- [ ] Localization beyond English
- [ ] In-app dispute-flagging UI wired to `oracle-node`'s dispute endpoint

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). UI changes touching trading or retirement flows should include Playwright E2E coverage, not just unit tests, given the financial/claims stakes involved.

## License

[Apache License 2.0](./LICENSE)
