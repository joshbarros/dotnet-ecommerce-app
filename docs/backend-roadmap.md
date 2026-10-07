# Backend implementation workbook

The C# source files in `apps/api` and `tests/api` are intentionally empty. Implement them yourself, one compiling checkpoint at a time. This file describes responsibilities, contracts and acceptance criteria; it does not provide the implementation.

## Start here

`Ecommerce.Api.csproj` temporarily uses `OutputType=Library`. An empty library builds; an empty executable cannot start. When implementing `Program.cs`, remove that property (the Web SDK defaults to an executable). Then `npm run dev:api`, the F5 debug profile and the Docker `backend` profile can execute your API.

```bash
source scripts/dev-env.sh  # only with the local SDK on this laptop
npm run build
# Compile the API and the future test project:
dotnet build Ecommerce.sln
```

The old three-file catalog implementation was copied to `.local/backend-before-learning` before emptying it. It is a local backup, ignored by Git. Git also contains the original baseline. You do not need to restore it to follow this workbook.

## Files and responsibilities

| Location | What you will write |
| --- | --- |
| `Program.cs` | Application entry point; service registrations, consistent errors, authentication, routing and health endpoint. |
| `Models/Product.cs` | Product identity, name, description, decimal price, stock, category, illustration kind/color and featured flag. |
| `Models/Category.cs` | Category identity/name, if a separate entity is useful. |
| `Models/Customer.cs` | Customer identity and profile; use ASP.NET Core Identity for password handling instead of a custom password algorithm. |
| `Models/Address.cs` | Delivery address fields. |
| `Models/Cart.cs`, `Models/CartItem.cs` | Optional server-side cart; browser cart is sufficient for the first backend increment. |
| `Models/Order.cs`, `Models/OrderItem.cs`, `Models/OrderStatus.cs` | Persisted order, immutable item price/name snapshots and permitted status values/transitions. |
| `Contracts/Products/*` | Read DTOs, query parameters, paged response and validated write request. |
| `Contracts/Auth/*` | Registration/login inputs and public customer response; never return password hashes. |
| `Contracts/Orders/*` | Checkout request, item identifiers/quantities and order responses. |
| `Contracts/Account/*` | Profile update request and address response. |
| `Controllers/ProductsController.cs`, `CategoriesController.cs` | Public catalog endpoints. |
| `Controllers/AuthController.cs`, `AccountController.cs` | Real authentication and the authenticated customer's own profile. |
| `Controllers/OrdersController.cs` | Create an order and list/read only the caller's orders. |
| `Controllers/CartController.cs` | Optional authenticated persisted cart endpoints. |
| `Controllers/AdminProductsController.cs`, `AdminOrdersController.cs` | Authorized administrator operations. |
| `Data/StoreDbContext.cs` | EF Core mappings, relationships, money precision, constraints and concurrency strategy. |
| `Data/DevelopmentSeeder.cs` | Repeatable development-only seed data. |
| `Data/Migrations/` | EF-generated migrations after the entities and context exist; do not hand-write empty migrations. |
| `Services/ProductService.cs` | Async catalog queries and product maintenance. |
| `Services/OrderService.cs` | Checkout business rules, transaction, stock updates and idempotency. |
| `Services/AccountService.cs` | Account operations that are not already handled by Identity. |
| `Validation/ProductValidation.cs`, `OrderValidation.cs` | Input/business validation where built-in DTO validation is insufficient. |
| `Middleware/ExceptionHandler.cs` | Consistent Problem Details without leaking internal errors. |
| `Options/DatabaseOptions.cs` | Typed connection configuration when needed. |
| `tests/api/*Tests.cs` | Business-rule, authorization, persistence and competing-stock tests. |

These are starting locations, not a requirement to create unnecessary abstractions. A simple controller is sufficient for the first catalog endpoint. Add services when the business logic has a reason to be separate. The test project is an empty library: select and add a real test framework when you start writing tests.

## Checkpoint 1 — A tiny runnable API

Write `Program.cs` and change the project from a library to an executable. Register controllers, Problem Details and health checks. Implement `GET /api/health`. Bind development to port 5207. Keep existing Nx restore/build targets.

Acceptance: the API starts, `/api/health` returns 200, and an unknown `/api/` route returns 404. Set a breakpoint in your first request handler.

Learning: top-level statements are the executable entry point. Dependency injection resembles injected Angular services; ASP.NET resolves registered services per their configured lifetime.

## Checkpoint 2 — Product model and catalog DTOs

Define the product and public response. Start with the nine fictional products in `apps/web/src/app/core/catalog.data.ts`. Implement list/detail, filtering, sort and pagination. Use decimal for prices, never floating-point money in C#.

Acceptance: list returns the documented contract; product 1 works; unknown IDs produce 404 Problem Details; invalid query values produce 400. Add controller tests. Reconnect catalog/detail in the frontend before moving on.

Learning: a DTO defines the HTTP contract, while the entity represents stored data. A C# record is useful for response data; EF entities typically need mutable properties and a persistent identity.

## Checkpoint 3 — EF Core and PostgreSQL

Install compatible EF Core and Npgsql packages, write the context and mappings, generate the first migration, and add a PostgreSQL service to Compose with a health check and named volume. Configure a connection string outside committed secrets. Seed only in development.

Acceptance: data survives restarting both the API and database. A clean database can apply migrations and load seed data. Never remove the persistent volume as an ordinary restart step.

Learning: the context tracks entity changes; `SaveChangesAsync` persists them. EF maps a C# decimal to a PostgreSQL numeric column with explicit precision.

## Checkpoint 4 — Accounts and protected maintenance

Use ASP.NET Core Identity or another deliberate, established authentication approach. For a same-origin monolith, HTTP-only session cookies can keep credentials out of browser storage; cookie-authenticated writes need an antiforgery strategy. Add administrator authorization to management endpoints and ownership checks to account/order endpoints. Do not confuse a frontend route guard with server authorization.

Acceptance: anonymous management writes return 401, regular customers return 403, authorized administrators can maintain products. A customer cannot read another customer's order. Passwords are never logged, returned or stored in plaintext. The current demo credential validation must be replaced by real server authentication, not reused as proof of identity.

## Checkpoint 5 — Persisted simulated checkout

Accept product IDs/quantities and delivery details, not browser totals or prices. Load authoritative prices and stock, calculate money on the server, validate all items, create snapshots, decrement stock and save the order in a transaction.

Repeated requests need an idempotency key with a unique database constraint and a retained result. Send the same key when retrying one submission; send a new key for a new order. For competing purchases, use an explicit concurrency strategy (for example a version token and checked update) so both requests cannot purchase the same last unit. Roll back the whole order when any line fails.

Acceptance: invalid quantities and unknown items fail; insufficient stock leaves inventory unchanged; two requests competing for the final unit produce at most one order; retrying the same key returns the same order; an authenticated user can see the persisted order after restarting the API. No payment or card details are involved.

## Checkpoint 6 — Integration and browser tests

Add API integration tests against PostgreSQL and an end-to-end browser test for search → detail → cart → checkout → persisted order. Keep frontend store tests for demo mode and API smoke tests for real mode.

Do not present frontend local orders as real persisted commerce. The application becomes a working ecommerce demo only when the backend independently enforces validation, pricing, stock, authorization and order persistence. Real payment processing and fulfillment would be a separate scope.

## Connecting the Angular frontend

`core/StoreService` is the local demo state. `products/ProductsService` already has optional HTTP read methods, but demo pages currently do not call the API. The frontend is not silently falling back from a failed backend.

1. Choose an explicit demo/API mode; keep failures visible in API mode.
2. Map API product/page responses into the frontend model. Catalog uses query parameters `q`, `category`, `sort`, `stock`, `page` in its URL; translate them into the API parameters below.
3. Replace demo catalog signals with HTTP loading, empty, failure and retry states.
4. Keep the first cart local. Submit only product IDs and quantities plus validated demo delivery information.
5. Replace local checkout/order history with HTTP requests. Display server totals and inventory errors.
6. Replace the simulated profile/credential forms with real login/session state. Add authorization-aware management UI; all permissions must also be enforced by the API.
7. Update the demo ribbon, privacy text, smoke tests and README to describe the behavior that actually exists.

See `docs/api-contracts.md` for the intended request/response shapes.
