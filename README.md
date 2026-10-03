# DevStore

A learning and portfolio project: an English storefront with BRL prices, an Angular client and a C# ASP.NET Core API in an Nx monorepo.

## Prerequisites

- Node.js 22.12 or newer in the Node 22 line, npm 10.
- .NET SDK 10.0.401 (see `global.json`). .NET 10 is an LTS release.
- Docker Engine and Docker Compose for the container workflow.
- VS Code with C# Dev Kit, Angular Language Service and Nx Console (recommended).

A local SDK was installed in `.local/dotnet` on this laptop. It is ignored by Git and is not included in Docker builds. From the repository root, run `source scripts/dev-env.sh` before using it. Other machines can use a normal .NET installation and do not need that script.

## Native development

```bash
# Only on this laptop when using the local SDK:
source scripts/dev-env.sh
npm ci
npm run build
npm run dev
```

Open http://localhost:4200/products. The API listens on http://localhost:5207. Angular's development proxy forwards `/api/**` to it. Use `npm run dev:api` or `npm run dev:web` to start a single app. `npm run graph` opens the Nx graph. The API build explicitly depends on restore, including on a clean checkout.

```bash
API_BASE_URL=http://localhost:5207 WEB_BASE_URL=http://localhost:4200 npm run test:smoke
```

## Docker

```bash
docker compose config --quiet
docker compose up --build --detach --wait
API_BASE_URL=http://localhost:8080 WEB_BASE_URL=http://localhost:8080 npm run test:smoke
docker compose ps
docker compose logs
```

Open http://localhost:8080/products. Only Nginx publishes a port, bound to loopback. Copy `.env.example` to `.env` to change `WEB_PORT`; update test URLs accordingly. Stop services with `npm run docker:down`.

The multi-stage Dockerfile produces two final images. The Angular build stage includes Node and .NET because the Nx .NET plugin inspects the API project. The final web image contains Nginx and static assets only. Both final containers run without root. Nginx proxies `/api/` and uses Docker DNS; other routes fall back to the Angular document. The web health check reaches the API through Nginx.

## Architecture and endpoints

```text
Browser → Angular ProductsPage → ProductsService → /api/products
                      Development proxy / production Nginx
                                       ↓
                     ASP.NET Core ProductsController → Product records
```

- `GET /api/health`: readiness response `Healthy`.
- `GET /api/products`: sample product collection.
- `GET /api/products/{id}`: product or HTTP 404 Problem Details.

Source: `apps/api/Controllers/ProductsController.cs`, `apps/api/Models/Product.cs`, and `apps/web/src/app/products/`. Money uses C# `decimal`. Angular uses standalone components, signals, Router and HttpClient. The catalog handles loading, empty and error states, with retry. Product illustrations use CSS.

## Debugging and learning

1. Source the local SDK environment, then launch VS Code from that terminal (`code .`). Open `Ecommerce.sln` with C# Dev Kit.
2. Stop a separately running API to free port 5207. Start Angular with `npm run dev:web`.
3. Set a breakpoint on `var product = ...` inside `GetById`.
4. Choose **C# API (F5)** and request http://localhost:5207/api/products/1.
5. Inspect `id` and `product` in Variables/Watch. Press F10 to step or F5 to continue.

A C# record resembles a TypeScript data object, but its type exists at runtime and this positional record exposes init-only properties. `decimal` is suited to monetary values; TypeScript `number` uses binary floating-point. Angular's service is injected just as ASP.NET services are resolved by dependency injection.

Exercise: add a fourth product in the controller, build the API, and check that Angular displays it. Then request a missing ID and inspect the Problem Details response.

## Validation and limitations

See `docs/validation.md` for checks actually executed on Linux. The smoke suite covers health, product contract, lookup, missing-product errors, unknown API routes and direct SPA navigation. `WEB_BASE_URL` is required to include the SPA test.

This is an in-memory catalog prototype. Persistence, product management, authentication, cart, checkout and payments are not implemented. A future increment will introduce EF Core/PostgreSQL with migrations and a persistent volume. No public deployment has been performed. Configure the actual hostname in `AllowedHosts` before deployment.

The GitHub Actions workflow builds Compose and runs smoke tests, but no workflow run has been verified. Browser interaction and responsive rendering require a browser review; HTTP smoke tests do not prove those behaviors. There are no screenshots yet.

The lockfile includes overrides for patched build dependencies (`piscina`, `axios`, `smol-toml`, `brace-expansion`). These avoid major framework changes and should be reviewed when upgrading Nx/Angular. No secrets or generated build artifacts belong in Git.
