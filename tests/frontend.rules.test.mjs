import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import ts from 'typescript';
import '@angular/compiler';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

// Execute the actual Angular store after transpiling, without a browser or DOM.
await mkdir(resolve('.local'), { recursive: true });
const output = await mkdtemp(resolve('.local/frontend-tests-'));
for (const name of ['catalog.data', 'store.service']) {
  const source = await readFile(`apps/web/src/app/core/${name}.ts`, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      experimentalDecorators: true,
    },
  });
  await writeFile(
    join(output, `${name}.mjs`),
    outputText.replace("'./catalog.data'", "'./catalog.data.mjs'"),
  );
}
const { StoreService } = await import(join(output, 'store.service.mjs'));
const authSource = await readFile('apps/web/src/app/pages/auth.page.ts', 'utf8');
const authJs = ts.transpileModule(authSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    experimentalDecorators: true,
  },
}).outputText;
await writeFile(
  join(output, 'auth.page.mjs'),
  authJs.replace("'../core/store.service'", "'./store.service.mjs'"),
);
const { AuthPage } = await import(join(output, 'auth.page.mjs'));
function authPage(path) {
  const segments = [new UrlSegment(path, {})];
  const store = new StoreService();
  const injector = createEnvironmentInjector(
    [
      { provide: StoreService, useValue: store },
      {
        provide: ActivatedRoute,
        useValue: { url: new BehaviorSubject(segments), snapshot: { url: segments } },
      },
      { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      { provide: NonNullableFormBuilder, useValue: new FormBuilder().nonNullable },
    ],
    null,
  );
  return { page: runInInjectionContext(injector, () => new AuthPage()), store, injector };
}
let saved = new Map();
beforeEach(() => {
  saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  };
});
after(async () => {
  delete globalThis.localStorage;
  await rm(output, { recursive: true, force: true });
});
const delivery = {
  name: 'Alex Example',
  email: 'alex@example.com',
  postalCode: '01001-000',
  street: '123 Example Street',
  city: 'São Paulo',
  state: 'SP',
};

test('cart rejects sold-out products and quantities exceeding stock', () => {
  const store = new StoreService();
  assert.equal(store.addToCart(8).ok, false);
  assert.equal(store.addToCart(1).ok, true);
  assert.equal(store.setQuantity(1, 13).ok, false);
  assert.equal(store.setQuantity(1, 0).ok, false);
  assert.equal(store.setQuantity(1, 1.5).ok, false);
  assert.equal(store.cartCount(), 1);
});
test('totals round monetary values and apply the shipping threshold', () => {
  const store = new StoreService();
  store.addToCart(1);
  assert.equal(store.subtotal(), 349.9);
  assert.equal(store.shipping(), 25);
  assert.equal(store.total(), 374.9);
  store.addToCart(3);
  assert.equal(store.subtotal(), 579.8);
  assert.equal(store.shipping(), 0);
  assert.equal(store.total(), 579.8);
});
test('checkout snapshots prices, decreases stock, persists the order and empties the bag', () => {
  const store = new StoreService();
  store.addToCart(1);
  store.setQuantity(1, 2);
  const result = store.placeOrder(delivery);
  assert.equal(result.ok, true);
  assert.equal(result.order.total, 699.8);
  assert.equal(result.order.items[0].price, 349.9);
  assert.equal(store.product(1).stock, 10);
  assert.equal(store.cartCount(), 0);
  assert.equal(store.placeOrder(delivery).ok, false);
  const refreshed = new StoreService();
  assert.equal(refreshed.orders().length, 1);
  assert.equal(refreshed.product(1).stock, 10);
  assert.equal(refreshed.orders()[0].id, result.order.id);
});
test('checkout rejects empty carts and invalid delivery details', () => {
  const store = new StoreService();
  assert.equal(store.placeOrder(delivery).ok, false);
  store.addToCart(1);
  assert.equal(store.placeOrder({ ...delivery, name: ' ' }).ok, false);
  assert.equal(store.orders().length, 0);
  assert.equal(store.cartCount(), 1);
});
test('product changes normalize carts while preserving historical order values', () => {
  const store = new StoreService();
  store.addToCart(1);
  const result = store.placeOrder(delivery);
  store.addToCart(1);
  store.toggleFavorite(1);
  store.deleteProduct(1);
  assert.equal(store.cartCount(), 0);
  assert.equal(store.favorites().length, 0);
  assert.equal(store.orders()[0].items[0].price, 349.9);
  assert.equal(result.ok, true);
});
test('favorites and demo profiles survive refresh without passwords', () => {
  const store = new StoreService();
  store.toggleFavorite(2);
  store.signIn({ name: 'Alex', email: 'alex@example.com' });
  const refreshed = new StoreService();
  assert.equal(refreshed.favorites()[0].id, 2);
  assert.equal(refreshed.profile().name, 'Alex');
  assert.doesNotMatch(saved.get('devstore.demo.v1'), /password/i);
  store.signOut();
  assert.equal(store.profile(), null);
});
test('malformed saved data falls back safely and rejects invalid products', () => {
  saved.set('devstore.demo.v1', '{');
  assert.equal(new StoreService().products().length, 9);
  saved.set(
    'devstore.demo.v1',
    JSON.stringify({
      products: [{ id: 1 }],
      cart: [null, { productId: 1, quantity: -5 }],
      orders: [{ id: 'broken' }],
    }),
  );
  const store = new StoreService();
  assert.equal(store.products().length, 9);
  assert.equal(store.cartCount(), 0);
  assert.equal(store.orders().length, 0);
});
test('storage failures retain a usable in-memory cart and show a warning', () => {
  globalThis.localStorage.setItem = () => {
    throw new Error('Quota exceeded');
  };
  const store = new StoreService();
  assert.equal(store.addToCart(1).ok, true);
  assert.equal(store.cartCount(), 1);
  assert.match(store.storageWarning(), /unavailable/);
});
test('demo product management validates stock and reset restores the original state', () => {
  const store = new StoreService();
  const { id, ...product } = store.product(1);
  assert.equal(store.saveProduct({ ...product, stock: -1 }).ok, false);
  assert.equal(store.saveProduct({ ...product, name: 'New essential' }).ok, true);
  assert.equal(store.products().length, 10);
  store.addToCart(1);
  store.resetDemo();
  assert.equal(store.products().length, 9);
  assert.equal(store.cartCount(), 0);
  assert.equal(store.orders().length, 0);
});

test('registration validates matching passwords and never stores the fictional password', () => {
  const { page, store, injector } = authPage('register');
  try {
    page.form.setValue({
      name: 'Alex Example',
      email: 'alex@example.com',
      password: 'fictional123',
      confirmPassword: 'different123',
    });
    assert.equal(page.form.invalid, true);
    assert.equal(page.form.hasError('passwordMismatch'), true);
    page.submit();
    assert.equal(store.profile(), null);
    page.form.controls.confirmPassword.setValue('fictional123');
    assert.equal(page.form.valid, true);
    page.submit();
    assert.equal(store.profile().name, 'Alex Example');
    assert.doesNotMatch(saved.get('devstore.demo.v1'), /fictional123|password/i);
  } finally {
    injector.destroy();
  }
});
test('login rejects invalid email and short passwords without requiring a display name', () => {
  const { page, store, injector } = authPage('login');
  try {
    page.form.setValue({ name: '', email: 'broken', password: 'short', confirmPassword: '' });
    page.submit();
    assert.equal(store.profile(), null);
    page.form.patchValue({ email: 'alex@example.com', password: 'fictional123' });
    assert.equal(page.form.valid, true);
    page.submit();
    assert.equal(store.profile().name, 'alex');
    assert.doesNotMatch(saved.get('devstore.demo.v1'), /fictional123/);
  } finally {
    injector.destroy();
  }
});
