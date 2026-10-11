import { defineConfig, devices } from '@playwright/test';

const apiEnv = {
  ASPNETCORE_ENVIRONMENT: 'Development',
  ConnectionStrings__Store:
    'Host=localhost;Port=5432;Database=ecommerce;Username=devstore;Password=devstore',
};

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 90_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'dotnet run --project apps/api/Ecommerce.Api.csproj --no-launch-profile --urls http://localhost:5207',
      url: 'http://localhost:5207/api/health',
      reuseExistingServer: true,
      timeout: 120_000,
      env: apiEnv,
    },
    {
      command: 'npm run dev:web',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
