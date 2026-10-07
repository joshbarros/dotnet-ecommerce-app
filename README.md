# DevStore

A complete interactive ecommerce frontend and an intentionally empty C# backend workbook, in an Nx monorepo. English UI, BRL prices, Angular 21 and .NET 10.

## What works today

- Home, searchable/filterable/sortable/paginated catalog, product detail and wishlist.
- Cart with quantity controls, stock limits, removal and totals.
- Validated simulated checkout, confirmation, order history and order detail.
- Validated demo sign-in/registration forms and editable local profile.
- Demo management dashboard, product create/edit/delete and order status updates.
- About, FAQ, shipping/returns, contact-form demonstration, privacy, demo terms and 404.
- Responsive layouts, CSS product illustrations, keyboard focus states and route titles.
- Local persistence for cart, favorites, profile, product changes and demo orders.

This is **not a real commerce backend**. No payment is collected, no email is sent, nothing is delivered and no real authentication occurs. Use fictional information. Demo management is openly accessible and modifies only browser state.

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

## Backend: write it yourself

All hand-written `.cs` files in `apps/api` and `tests/api` are empty by request. The project temporarily compiles as a library. API execution, F5 debugging and API smoke tests become useful after you implement the entry point and endpoints.

Start with [the backend workbook](docs/backend-roadmap.md). It maps each empty file to its responsibility and provides incremental acceptance criteria. [API contracts](docs/api-contracts.md) describe the intended frontend/backend interface.

The former catalog API is preserved locally in `.local/backend-before-learning` and in the original Git history. No C# business logic, database packages, migrations or authentication implementation has been added for you.

The first exercise: implement `Program.cs`, remove `<OutputType>Library</OutputType>` from the API project, return a health response, and run `npm run dev:api`. Then write the Product model and list/detail endpoints. Prices should use `decimal`.

## Source map

- `apps/web/src/app/app.routes.ts`: all frontend routes.
- `apps/web/src/app/core/models.ts`: frontend data contracts.
- `apps/web/src/app/core/catalog.data.ts`: fictional seed products.
- `apps/web/src/app/core/store.service.ts`: local demo rules/state and persistence.
- `apps/web/src/app/pages`: page components and templates.
- `apps/web/src/app/shared`: reusable product cards and illustrations.
- `apps/web/src/app/products/products.service.ts`: optional HTTP catalog reads for future integration; current demo pages do not use them.
- `apps/api`: empty controllers, contracts, models, data, services and validation files.
- `tests/api`: empty future C# test files.

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

Frontend tests execute the actual Angular store and login/registration form logic using Node, TypeScript transpilation and the Angular runtime. HTTP smoke tests request the SPA document at each route; they do not execute page components or prove visual behavior. The API smoke tests cover the intended paged catalog contract and are available as `npm run test:api:smoke`, for when you implement those endpoints.

See [validation](docs/validation.md) and [manual frontend checklist](docs/frontend-checklist.md). No connected browser was available for visual verification during development. Desktop/mobile review and end-to-end interaction testing remain outstanding. No screenshot is claimed. The updated GitHub Actions workflow has not run remotely. Nothing was published.

The next real-commerce steps are server-side persistence, authentication/authorization, validated pricing and stock, transactional order creation, idempotency and integration tests. They are described in the backend workbook so you can implement and compile them yourself.
