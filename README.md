# North & Form — E-commerce Showcase

## Project Overview

# North & Form

**Full-Stack E-commerce Showcase**

North & Form is an independent e-commerce application based on my engineering experience working on the GROHE web platform.

The project incorporates architectural approaches, component patterns, development tools, and technologies I used while working on GROHE, where I contributed to building and delivering production web applications.

My goal was to demonstrate how I approach real-world frontend and full-stack development, from implementing designs and building reusable UI components to API integration, state management, backend development, and testing.

The application is built with Next.js, React, TypeScript, Express, Prisma, and PostgreSQL. It includes a product catalog, shopping cart, guest checkout, order management, and simulated payments.

**Note:** North & Form is an independent engineering showcase and is not affiliated with or endorsed by GROHE. It uses simulated payments and is not deployed as a production commerce service.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, TanStack Query, Zustand
- **Backend:** Node.js, Express, TypeScript, Zod, Prisma ORM, Swagger UI (OpenAPI 3.0.3)
- **Database:** PostgreSQL 17 (Docker Compose for local development)
- **Tooling:** pnpm workspace, Vitest, Supertest, Playwright, axe-core, Biome, Lefthook, GitHub Actions

## Features

- **Product catalogue:** product list and detail pages with live stock and availability.
- **Cart:** add products, change quantities, remove lines, empty the cart; header item count.
- **Vouchers:** database-backed discount codes (`DEMO10` gives 10 % off).
- **Guest checkout:** validated customer and delivery details, with postal codes checked against
  the selected country (Czech Republic, Germany, Netherlands, United Kingdom).
- **Orders:** immutable order snapshots with server-calculated totals (VAT included, €5 delivery)
  and duplicate-order protection.
- **Simulated payments:** choose a successful or declined outcome; declined payments can be retried.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10 (`corepack enable && corepack prepare pnpm@10.0.0 --activate`)
- Docker (for PostgreSQL)

### Quick start

### Quick start

```sh
pnpm install
pnpm run setup           # create .env files with generated secrets
```

> [!CAUTION]
> **Demo Environment Only**
>
> The automated generation of API tokens and database credentials via `pnpm setup` is intended solely for this demonstration project.
>
> In a production environment, secrets should be managed through a dedicated secrets management solution or secure deployment environment configuration, with appropriate access controls and rotation policies.
>
> **This setup script is not intended for production use.**
```sh

pnpm server:db:up        # start PostgreSQL in Docker (persistent volume)
pnpm server:db:deploy    # apply Prisma migrations
pnpm server:db:seed      # 10 products + DEMO10 voucher (safe to re-run)

pnpm server:dev          # terminal 1: Express API on http://127.0.0.1:4000
pnpm dev                 # terminal 2: storefront on http://127.0.0.1:3000
```

`pnpm run setup` (not `pnpm setup`, which is a built-in pnpm command) creates `server/.env` (Express, PostgreSQL) and `.env.local` (Next.js) from their
`.env.example` files. It generates a random database password and one shared
`INTERNAL_API_TOKEN` for both apps. Existing files and values are never overwritten, and secrets
are never printed.

If PostgreSQL was already initialised for this project with a different password, restore your
previous `server/.env`, or reset the local database (this deletes its data):

```sh
docker compose -f server/compose.yaml down -v
pnpm server:db:up && pnpm server:db:deploy && pnpm server:db:seed
```

### Environment variables

| File | Variable | Purpose |
|---|---|---|
| `server/.env` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Local PostgreSQL container |
| `server/.env` | `DATABASE_URL` | Development database used by Express and Prisma |
| `server/.env` | `TEST_DATABASE_URL` | Separate test database (name must end in `_test`) |
| `server/.env` | `HOST`, `PORT` | Express address (default `127.0.0.1:4000`) |
| `server/.env` | `INTERNAL_API_TOKEN` | Shared secret; required in production or on a non-loopback host |
| `server/.env` | `SESSION_TTL_HOURS` | Idle time before a guest cart is cleared (default 24) |
| `.env.local` | `COMMERCE_SERVER_URL` | Express base URL, e.g. `http://127.0.0.1:4000` (required) |
| `.env.local` | `INTERNAL_API_TOKEN` | Must match the Express value |

Never commit `.env` files; only the `.env.example` files are tracked.

- API documentation (Swagger UI): <http://127.0.0.1:4000/api-docs/>
- Database browser: `pnpm server:db:studio`
- Stop PostgreSQL: `pnpm server:db:down`

For the checkout, use fictional details, for example `Alex Taylor`, `alex@example.test`,
`12 Example Street`, `London`, `SW1A 1AA`, `United Kingdom`.

### Production build

```sh
pnpm server:build && pnpm server:start   # Express (after pnpm server:db:deploy)
pnpm build && pnpm start                 # storefront
```

## Project Structure

```text
src/
  app/            Next.js pages, layout and Route Handlers (app/api, shared _lib/route.ts)
  server/api/     Server-only services and HTTP client for the Express API
  features/       Cart, catalogue, checkout and payment components and hooks
  shared/         UI components, schemas, Zustand store, utilities
server/
  src/            Express app: routes, schemas, services, dto, middleware, db, docs
  prisma/         Prisma schema, migrations and seed
  test/           Backend tests (real PostgreSQL test database)
e2e/              Playwright end-to-end tests
docs/             Project documentation
```

## Testing

```sh
pnpm typecheck && pnpm lint && pnpm format:check   # storefront static checks
pnpm test                                          # storefront unit and component tests (Vitest)

pnpm server:typecheck
pnpm server:test        # backend API tests against the test database (applies migrations)

pnpm exec playwright install chromium
pnpm test:e2e           # full journey through Next.js, Express and PostgreSQL
```

E2E tests start Express and Next.js automatically. The database must be running, migrated and
seeded. GitHub Actions runs all of these checks with a PostgreSQL service container.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design, request flow, state management,
checkout and security model.

## Limitations

- **Payments are simulated.** No payment provider (such as Adyen) is integrated, and no card data
  is accepted or stored.
- **No authentication.** Shopping is guest-only; a guest's orders are reachable only while the
  session cookie exists.
- **Stock is not decremented.** Stock is validated per cart and order but not reserved or reduced.
- **Address validation** checks postal-code formats per country; it does not verify that a city
  exists in the selected country.
- **Demo limits:** 50 orders per session and 20 payment attempts per order. Idle carts are cleared
  after 24 hours; orders are kept.
- **Simplified tax and delivery:** 20 % VAT included in prices and a flat €5 delivery fee, EUR only.
- **Deployment:** the Dockerfile builds the storefront only. Express and PostgreSQL are deployed
  separately. No deployment has been performed.
