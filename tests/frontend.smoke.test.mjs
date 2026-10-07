import test from 'node:test';
import assert from 'node:assert/strict';
const web = process.env.WEB_BASE_URL || 'http://localhost:4200';
for (const path of [
  '/',
  '/products',
  '/products/1',
  '/cart',
  '/wishlist',
  '/checkout',
  '/account',
  '/login',
  '/register',
  '/orders',
  '/orders/missing',
  '/orders/demo/confirmation',
  '/about',
  '/help',
  '/shipping',
  '/contact',
  '/privacy',
  '/terms',
  '/admin',
  '/admin/products',
  '/admin/products/new',
  '/admin/products/1',
  '/admin/orders',
  '/not-a-page',
]) {
  test(`SPA document at ${path}`, async () => {
    const response = await fetch(web + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /<app-root/);
  });
}
