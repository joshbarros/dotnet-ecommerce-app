# Linux validation

## Current frontend and empty-backend checkpoint

Executed on October 3, 2026, on Ubuntu 24.04 x86_64, Node 22.19.0, npm 10.9.3 and .NET SDK 10.0.401.

Successful commands:

```bash
source scripts/dev-env.sh
npm run format:check
npm run test:frontend
dotnet build Ecommerce.sln
npm run build
npm run dev
WEB_BASE_URL=http://localhost:4200 npm run test:smoke

docker compose up --build --detach --wait
WEB_BASE_URL=http://localhost:8080 npm run test:smoke
docker compose exec -T web id
npm audit --omit=dev
```

Results:

- Eleven frontend rule/form tests passed. They cover stock/quantity limits, rounded totals/shipping, order snapshots and stock decrement, repeat submission with an empty bag, local persistence, favorites/profiles, invalid stored data, storage failure, product maintenance/reset and actual Angular login/registration validators, including password matching and non-persistence.
- 24 HTTP route checks passed against Angular development and the Docker frontend, including direct catalog/detail, cart, checkout, confirmation, account, management and information navigation.
- Nx production builds passed. The solution build compiled both the empty API library and the empty future test library with zero warnings/errors.
- All 44 hand-written C# files were checked: zero contain implementation code. A buildable library scaffold does not implement API endpoints.
- The web Docker image built and Nginx became healthy. The frontend runs as UID 101; only loopback port 8080 is published. The old catalog API container/process was stopped; the current default Compose stack starts only web.
- The production dependency audit found zero vulnerabilities.
- Formatting checks passed for frontend and C# sources.

The frontend deliberately uses local demo state. Local orders are not API/database orders, and demo account/profile screens do not authenticate users. The API profile was not started because the C# entry point is intentionally empty.

## Remaining verification

The browser runtime reported no connected browser, including after its documented recovery check. Desktop/mobile appearance, clicks, live announcements and the full interactive purchase flow were not verified in a browser. The HTTP route suite checks document delivery only; the frontend rule suite executes the store, not the rendered components. See `docs/frontend-checklist.md` for the manual review.

C# Dev Kit discovery/F5 cannot validate an empty executable entry point; those checks belong to the first implementation checkpoint. The updated GitHub Actions workflow has not run remotely. Nothing was pushed or publicly deployed.

## Earlier catalog checkpoint

Before the user's request to leave the backend empty, the original three-product API and Angular catalog built natively and in Docker. Six API/SPA HTTP smoke tests passed in both modes, including after an API restart; both services ran without root. Those results describe the old implementation, not the current empty backend.

The earlier API source is backed up locally in `.local/backend-before-learning`, ignored by Git. The original baseline also remains in Git history. The API smoke suite now describes the intended paged catalog contract and should be run after those endpoints are implemented.
