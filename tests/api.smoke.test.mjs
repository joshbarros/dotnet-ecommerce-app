// Future API contract checks; run after implementing the empty backend.
import test from 'node:test';
import assert from 'node:assert/strict';
const api = process.env.API_BASE_URL || 'http://localhost:5207';
const web = process.env.WEB_BASE_URL;
test('health', async () => {
  const r = await fetch(`${api}/api/health`);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'Healthy');
});
test('product contract', async () => {
  const r = await fetch(`${api}/api/products`);
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.ok(Array.isArray(p.items));
  assert.ok(p.items.length > 0);
  assert.equal(p.page, 1);
  assert.ok(p.totalItems >= p.items.length);
  for (const item of p.items) {
    assert.equal(typeof item.id, 'number');
    assert.equal(typeof item.name, 'string');
    assert.equal(typeof item.description, 'string');
    assert.equal(typeof item.category, 'string');
    assert.ok(item.price > 0);
    assert.ok(Number.isInteger(item.stock) && item.stock >= 0);
  }
});
test('product lookup', async () => {
  const r = await fetch(`${api}/api/products/1`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).id, 1);
});
test('missing product problem details', async () => {
  const r = await fetch(`${api}/api/products/99999`);
  assert.equal(r.status, 404);
  assert.match(r.headers.get('content-type'), /application\/problem\+json/);
  assert.equal((await r.json()).status, 404);
});
test('unknown API route', async () => {
  const r = await fetch(`${api}/api/unknown`);
  assert.equal(r.status, 404);
  assert.doesNotMatch(await r.text(), /<app-root/);
});
test('direct SPA navigation', { skip: !web }, async () => {
  const r = await fetch(`${web}/products`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<app-root/);
});
