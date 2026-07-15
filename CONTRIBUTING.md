# Contributing to Cambium Web App

Thanks for your interest in contributing! This guide covers the setup and workflow for the frontend app.

## Prerequisites

- Node.js 20+
- pnpm (package manager)
- A Stellar-compatible wallet extension (e.g. [Freighter](https://www.freighter.app/)) for testing wallet flows

## Setup

```bash
git clone https://github.com/cambium-protocol/web-app.git
cd web-app
pnpm install
cp .env.example .env.local
```

Fill in the contract addresses in `.env.local` (see [README.md](./README.md#environment-variables)).

## Development

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build (includes type-checking) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:e2e` | Run Playwright E2E tests |

## Code Style

- TypeScript strict mode — no `any` types unless absolutely necessary
- Tailwind CSS utility classes — no inline styles
- `'use client'` directive on components that use hooks or browser APIs
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:
  - `feat(scope): description` for new features
  - `fix(scope): description` for bug fixes
  - `test: description` for test additions
  - `config: description` for config changes

## Project Structure

```
app/              # Next.js App Router pages
components/       # Reusable UI components organized by domain
lib/              # Shared utilities, SDK client, hooks
tests/            # Unit (unit/) and E2E (e2e/) tests
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes following the code style above
3. Run `pnpm lint` and `pnpm test` — both must pass
4. Run `pnpm build` to verify no type errors
5. Open a PR with a clear description of the change
6. Link any related issues

### What to include in PRs

- **Bug fixes**: Include steps to reproduce and what the fix does
- **New features**: Include screenshots/recordings of UI changes
- **UI changes**: Must include Playwright E2E coverage for trading or retirement flows

## Testing

- **Unit tests** go in `tests/unit/` and use Vitest + React Testing Library
- **E2E tests** go in `tests/e2e/` and use Playwright
- Test components in isolation where possible
- Mock SDK calls in unit tests (do not hit real testnet)

## Reporting Issues

Use GitHub Issues. Include:

- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
