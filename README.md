# DevStore

A complete interactive ecommerce app in an Nx monorepo: an Angular 21 frontend and a real ASP.NET Core 10 API backed by PostgreSQL. English UI, BRL prices. The frontend runs in a local demo mode by default; a config flag switches it to the live API.

## What works today

Frontend (demo mode):

- Home, searchable/filterable/sortable/paginated catalog, product detail and wishlist.
- Cart with quantity controls, stock limits, removal and totals.
- Validated simulated checkout, confirmation, order history and order detail.
- Validated demo sign-in/registration forms and editable local profile.
- Demo management dashboard, product create/edit/delete and order status updates.
- About, FAQ, shipping/returns, contact-form demonstration, privacy, demo terms and 404.
- Responsive layouts, CSS product illustrations, keyboard focus states and route titles.

Backend (API, `apps/web/src/app/core/api-config.ts` → `useApi`):

- Paged, filtered, sorted catalog with case-insensitive search and `decimal` prices.
- ASP.NET Core Identity with HTTP-only cookie sessions and antiforgery validation.
- Orders with server-side pricing, atomic stock decrement, idempotency keys and ownership checks.
- Admin product management gated by the Admin role.
- PostgreSQL persistence with EF Core migrations; an admin and nine products are seeded in development.
- 19 integration tests covering pricing, stock races, idempotency, catalog and auth.

Local demo mode never touches the API. Switching to API mode makes catalog, orders, accounts and management read and write the backend. Demo management is openly accessible and modifies only browser state.

## Run the frontend

Prerequisites: Node 22.12+ in the Node 22 line, npm 10, .NET SDK 10.0.401 for the Nx .NET plugin. Docker Engine with Compose is optional.

```bash
# This laptop has an ignored local SDK. Other machines can use a regular SDK install.
source scripts/dev-env.sh
npm ci
npm run dev
```

Open http://localhost:4200. `npm run dev` starts only Angular; a running API is not required. `npm run dev:web` does the same.

```bash
npm run build
npm run test:frontend
WEB_BASE_URL=http://localhost:4200 npm run test:smoke
```

`npm run build` compiles Angular and the empty API library. `dotnet build Ecommerce.sln` additionally compiles the empty future test project. This proves the scaffold is syntactically buildable, not that API functionality exists.

## Docker

```bash
docker compose config --quiet
docker compose up --build --detach --wait
WEB_BASE_URL=http://localhost:8080 npm run test:smoke
```

Open http://localhost:8080. Only web starts by default and its health check verifies Nginx. The web build stage includes Node and .NET for Nx project discovery. The final web image contains static files and unprivileged Nginx, with the port bound to loopback.

The API service is behind the `backend` Compose profile. **Do not start it while the API is an empty library.** After implementing `Program.cs` and removing `OutputType=Library`, use `docker compose --profile backend up --build --detach --wait`. Nginx already reserves `/api/` for the API proxy, rather than returning the SPA document for those requests. Until the API exists, these routes can return 502.

Copy `.env.example` to `.env` to change `WEB_PORT`. Stop the current frontend with `npm run docker:down`. If an old catalog API container remains from the earlier checkpoint, stop it with `docker compose stop api`.

## Pages

| Route | Page |
| --- | --- |
| `/` | Home and featured collection |
| `/products` | Search, category, stock filter, sort and pagination |
| `/products/:id` | Product detail and related essentials |
| `/wishlist` | Saved essentials |
| `/cart` | Bag and totals |
| `/checkout` | Validated local demo checkout |
| `/orders/:id/confirmation` | Demo confirmation |
| `/orders`, `/orders/:id` | Local order history and details |
| `/login`, `/register`, `/account` | Demo profile screens; no real authentication |
| `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id`, `/admin/orders` | Local management demonstration |
| `/about`, `/help`, `/shipping`, `/contact`, `/privacy`, `/terms` | Information and contact-form demonstration |
| Any unmatched route | 404 page |

Routes load page components lazily. Query filters are preserved in the catalog URL. Router navigation restores scroll positions. The demo storage key is `devstore.demo.v1`, scoped to the current origin: ports 4200 and 8080 have separate saved state. “Reset demo data” in the footer resets the catalog, cart, favorites, profile and orders.

## Backend

The API lives in `apps/api`, built on ASP.NET Core 10 + EF Core with Npgsql and ASP.NET Core Identity. Run the dev API (already bound to port 5207 by `project.json`):

```bash
docker compose up -d db
source scripts/dev-env.sh
npm run dev:api
```

The database is created and migrated automatically on startup; the development seeder adds an `Admin` role, an admin user (`admin@devstore.local` / `DevStoreAdmin!42`) and nine products. API contracts are documented in [docs/api-contracts.md](docs/api-contracts.md). The original implementation workbook is preserved at [docs/backend-roadmap.md](docs/backend-roadmap.md) for reference.

To run the frontend against the real API instead of the local demo, set `useApi = true` in `apps/web/src/app/core/api-config.ts`. Sign in as the seeded admin to use the management screens.

## Source map

- `apps/web/src/app/app.routes.ts`: all frontend routes.
- `apps/web/src/app/core/models.ts`: frontend data contracts.
- `apps/web/src/app/core/catalog.data.ts`: fictional seed products (demo mode).
- `apps/web/src/app/core/store.service.ts`: local demo state plus API-mode catalog, orders and auth.
- `apps/web/src/app/core/api.service.ts`: typed HTTP client for the real backend (with CSRF handling).
- `apps/web/src/app/core/api-config.ts`: the `useApi` demo/API mode switch.
- `apps/web/src/app/pages`: page components and templates.
- `apps/web/src/app/shared`: reusable product cards and illustrations.
- `apps/api`: controllers, contracts, models, data (EF migrations + seeder), services and middleware.
- `tests/api`: xUnit integration tests against PostgreSQL (catalog, auth, orders, stock races).
- `tests/*.test.mjs`: frontend rule/smoke tests and API contract smoke tests.

## Formatting and VS Code

```bash
source scripts/dev-env.sh
# Restore first on a clean checkout:
dotnet restore Ecommerce.sln
npm run format
npm run format:check
```

Prettier handles TypeScript, CSS and Angular HTML templates. `.editorconfig` and `dotnet format` handle C#. Install the recommended VS Code extensions for formatting on save. Formatting is separate from linting.

Once your API has an entry point, open `Ecommerce.sln` in C# Dev Kit. Start Angular separately, stop any independently running API on port 5207, and use **C# API (F5)**. The debug configuration targets the `net10.0` DLL.

## Verification and limitations

Frontend tests execute the actual Angular store and login/registration form logic using Node, TypeScript transpilation and the Angular runtime. HTTP smoke tests request the SPA document at each route; they do not execute page components or prove visual behavior. `npm run test:api:smoke` covers the public API contract. `dotnet test tests/api` runs 19 integration tests against a dedicated `ecommerce_test` database (catalog contract, auth/session rules, order pricing/idempotency and competing-stock races).

See [validation](docs/validation.md) and [manual frontend checklist](docs/frontend-checklist.md). No connected browser was available for visual verification during development; desktop/mobile review and end-to-end browser interaction remain outstanding. No screenshot is claimed.

The backend now supports server-side persistence, authentication/authorization, server-validated pricing and stock, transactional order creation and idempotency. Still at demo level: there is no real payment processing, emailing or fulfillment, order status transitions on the server are not yet exposed, and the frontend defaults to local demo mode rather than the API.
