import { test, expect } from '@playwright/test';

test('search → detail → cart → checkout → persisted order (API mode)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('devstore.api', 'true'));

  await page.goto('/products');
  const keyboard = page.getByRole('heading', { name: /Mechanical Keyboard/ });
  try {
    await keyboard.waitFor({ timeout: 15_000 });
  } catch {
    await page.getByRole('button', { name: /Try again/ }).click();
    await keyboard.waitFor({ timeout: 15_000 });
  }

  await page.getByPlaceholder(/Try keyboard/).fill('backpack');
  await expect(page.locator('app-product-card')).toHaveCount(2);

  await page.getByRole('link', { name: 'View Everyday Backpack' }).click();
  await expect(page).toHaveURL(/\/products\/3/);
  await page.getByRole('button', { name: /Add to bag/ }).click();
  await expect(page.locator('.count')).toHaveText('1');

  const email = `e2e-${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByPlaceholder('Alex Example').fill('E2E Tester');
  await page.getByPlaceholder('alex@example.com').fill(email);
  await page.getByPlaceholder('At least 8 characters').fill('E2ePass!123');
  await page.getByPlaceholder('Repeat your fictional password').fill('E2ePass!123');
  await page.getByRole('button', { name: /Create demo profile/i }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.goto('/cart');
  await expect(page.locator('.count')).toHaveText('1');

  await page.goto('/checkout');
  await page.getByPlaceholder('Alex Example').fill('E2E Tester');
  await page.getByPlaceholder('alex@example.com').fill(email);
  await page.getByPlaceholder('01001-000').fill('01001-000');
  await page.getByPlaceholder('123 Example Street').fill('123 Main Street');
  await page.getByPlaceholder('São Paulo').fill('Sao Paulo');
  await page.getByPlaceholder('SP').fill('SP');
  await page.locator('input[formcontrolname="accept"]').check();
  await page.getByRole('button', { name: /Place.*order/ }).click();

  await expect(page).toHaveURL(/\/orders\/\d+\/confirmation/);
  await expect(page.getByRole('heading', { name: /confirmed/i })).toBeVisible();

  await page.goto('/orders');
  await expect(page.locator('.order-card')).toHaveCount(1);

  await page.reload();
  await expect(page.locator('.order-card')).toHaveCount(1);
});
