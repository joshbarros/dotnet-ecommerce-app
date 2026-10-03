# Linux validation

Executed on October 3, 2026, on Ubuntu 24.04 x86_64, with Node 22.19.0, npm 10.9.3 and .NET SDK 10.0.401.

## Successful checks

```bash
source scripts/dev-env.sh
npm run build
npm run dev
API_BASE_URL=http://localhost:5207 WEB_BASE_URL=http://localhost:4200 npm run test:smoke

docker compose config --quiet
docker compose up --build --detach --wait
API_BASE_URL=http://localhost:8080 WEB_BASE_URL=http://localhost:8080 npm run test:smoke

docker compose exec -T api id
docker compose exec -T web id
docker compose restart api
API_BASE_URL=http://localhost:8080 WEB_BASE_URL=http://localhost:8080 npm run test:smoke
```

- API and Angular production builds passed through Nx.
- Six of six smoke tests passed natively and through Nginx, with no skipped tests.
- Both Docker images built and services started; web became healthy.
- API ran as UID 1654, Nginx as UID 101.
- The six tests passed again after restarting the API.
- Images were rebuilt after dependency security overrides; Docker's `npm ci` reported zero vulnerabilities.
- Final local dependency installation reported zero vulnerabilities; production-only audit also passed.
- GitHub CLI authentication was verified for `joshbarros`. No repository was created or pushed.

## Remaining limitations

The browser runtime reported no connected browsers, including after its documented recovery check. Desktop/mobile rendering, interactive retry behavior and browser refresh were not visually verified. HTTP direct navigation to `/products` was verified, which proves the document fallback but does not exercise Angular in a browser.

C# Dev Kit discovery, IntelliSense and F5 debugging need to be verified inside VS Code. A debug configuration and a breakpoint walkthrough are provided in README.

The GitHub Actions workflow has not run. No public deployment, persistence, checkout or payment processing exists.

This agent environment requires approval for local network sockets and Docker access. Those sandbox restrictions are separate from the normal development commands documented in README.
