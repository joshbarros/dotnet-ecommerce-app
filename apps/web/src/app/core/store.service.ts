import { computed, Injectable, signal } from '@angular/core';
import { INITIAL_PRODUCTS } from './catalog.data';
import { CartLine, DeliveryAddress, Order, Product, Profile, StoreResult } from './models';

const STORAGE_KEY = 'devstore.demo.v1';
interface SavedState {
  products: Product[];
  cart: CartLine[];
  wishlist: number[];
  orders: Order[];
  profile: Profile | null;
}
const kinds = ['keyboard', 'headphones', 'backpack', 'lamp', 'mouse', 'bottle'];
function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const p = value as Product;
  return (
    Number.isSafeInteger(p.id) &&
    p.id > 0 &&
    typeof p.name === 'string' &&
    typeof p.description === 'string' &&
    typeof p.category === 'string' &&
    kinds.includes(p.kind) &&
    typeof p.color === 'string' &&
    /^#[0-9a-f]{6}$/i.test(p.color) &&
    typeof p.featured === 'boolean' &&
    Number.isFinite(p.price) &&
    p.price > 0 &&
    Number.isSafeInteger(p.stock) &&
    p.stock >= 0
  );
}
function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== 'object') return false;
  const o = value as Order;
  return (
    typeof o.id === 'string' &&
    typeof o.createdAt === 'string' &&
    Number.isFinite(Date.parse(o.createdAt)) &&
    ['Confirmed', 'Preparing', 'Shipped'].includes(o.status) &&
    [o.subtotal, o.shipping, o.total].every((n) => Number.isFinite(n) && n >= 0) &&
    !!o.delivery &&
    ['name', 'email', 'postalCode', 'street', 'city', 'state'].every(
      (k) => typeof (o.delivery as unknown as Record<string, unknown>)[k] === 'string',
    ) &&
    Array.isArray(o.items) &&
    o.items.length > 0 &&
    o.items.every(
      (i) =>
        Number.isSafeInteger(i.productId) &&
        typeof i.name === 'string' &&
        Number.isFinite(i.price) &&
        i.price > 0 &&
        Number.isSafeInteger(i.quantity) &&
        i.quantity > 0,
    )
  );
}
function loadState(): Partial<SavedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object') return {};
    return {
      products:
        Array.isArray(state.products) &&
        state.products.every(isProduct) &&
        new Set(state.products.map((p: Product) => p.id)).size === state.products.length
          ? state.products
          : undefined,
      cart: Array.isArray(state.cart)
        ? state.cart.filter(
            (i: CartLine) =>
              i &&
              Number.isSafeInteger(i.productId) &&
              Number.isSafeInteger(i.quantity) &&
              i.quantity > 0,
          )
        : [],
      wishlist: Array.isArray(state.wishlist)
        ? ([
            ...new Set(state.wishlist.filter((id: number) => Number.isSafeInteger(id))),
          ] as number[])
        : [],
      orders: Array.isArray(state.orders) ? state.orders.filter(isOrder) : [],
      profile:
        state.profile &&
        typeof state.profile.name === 'string' &&
        typeof state.profile.email === 'string'
          ? state.profile
          : null,
    };
  } catch {
    return {};
  }
}
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly saved = loadState();
  readonly products = signal<Product[]>(this.saved.products ?? structuredClone(INITIAL_PRODUCTS));
  readonly cart = signal<CartLine[]>(this.normalizeCart(this.saved.cart ?? []));
  readonly wishlist = signal<number[]>(this.saved.wishlist ?? []);
  readonly orders = signal<Order[]>(this.saved.orders ?? []);
  readonly profile = signal<Profile | null>(this.saved.profile ?? null);
  readonly notice = signal('');
  readonly storageWarning = signal('');
  readonly cartItems = computed(() =>
    this.cart().flatMap((line) => {
      const product = this.products().find((p) => p.id === line.productId);
      return product ? [{ product, quantity: line.quantity }] : [];
    }),
  );
  readonly cartCount = computed(() => this.cart().reduce((sum, line) => sum + line.quantity, 0));
  readonly subtotal = computed(() =>
    money(this.cartItems().reduce((sum, line) => sum + line.product.price * line.quantity, 0)),
  );
  readonly shipping = computed(() => (this.subtotal() === 0 || this.subtotal() >= 500 ? 0 : 25));
  readonly total = computed(() => money(this.subtotal() + this.shipping()));
  readonly favorites = computed(() =>
    this.products().filter((p) => this.wishlist().includes(p.id)),
  );

  private normalizeCart(lines: CartLine[]): CartLine[] {
    const merged = new Map<number, number>();
    for (const line of lines)
      merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
    return [...merged].flatMap(([productId, quantity]) => {
      const product = this.products().find((p) => p.id === productId);
      return product && product.stock > 0
        ? [{ productId, quantity: Math.min(quantity, product.stock) }]
        : [];
    });
  }
  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          products: this.products(),
          cart: this.cart(),
          wishlist: this.wishlist(),
          orders: this.orders(),
          profile: this.profile(),
        }),
      );
      this.storageWarning.set('');
    } catch {
      this.storageWarning.set(
        'Browser storage is unavailable. Your demo changes may be lost when you close this page.',
      );
    }
  }
  product(id: number): Product | undefined {
    return this.products().find((p) => p.id === id);
  }
  addToCart(id: number): StoreResult {
    const product = this.product(id);
    const current = this.cart().find((i) => i.productId === id)?.quantity ?? 0;
    if (!product || current >= product.stock)
      return this.failure('No more stock is available for this item.');
    this.cart.update((lines) =>
      current
        ? lines.map((i) => (i.productId === id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...lines, { productId: id, quantity: 1 }],
    );
    this.notice.set(`${product.name} added to your cart.`);
    this.persist();
    return { ok: true };
  }
  setQuantity(id: number, quantity: number): StoreResult {
    const product = this.product(id);
    if (!product || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.stock)
      return this.failure('Choose a quantity within the available stock.');
    this.cart.update((lines) => lines.map((i) => (i.productId === id ? { ...i, quantity } : i)));
    this.persist();
    return { ok: true };
  }
  removeFromCart(id: number): void {
    this.cart.update((lines) => lines.filter((i) => i.productId !== id));
    this.persist();
  }
  toggleFavorite(id: number): void {
    if (!this.product(id)) return;
    this.wishlist.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
    this.persist();
  }
  signIn(profile: Profile): void {
    this.profile.set(profile);
    this.persist();
  }
  signOut(): void {
    this.profile.set(null);
    this.persist();
    this.notice.set('You left the demo account.');
  }
  updateProfile(profile: Profile): void {
    this.profile.set(profile);
    this.persist();
    this.notice.set('Demo profile updated.');
  }
  placeOrder(
    delivery: DeliveryAddress,
  ): { ok: true; order: Order } | { ok: false; message: string } {
    if (!this.cart().length) return this.failure('Your cart is empty.');
    if (Object.values(delivery).some((v) => typeof v !== 'string' || !v.trim()))
      return this.failure('Complete every delivery field.');
    for (const line of this.cart()) {
      const product = this.product(line.productId);
      if (
        !product ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > product.stock
      )
        return this.failure('An item is unavailable. Review your cart.');
    }
    const order: Order = {
      id: 'DS-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      items: this.cartItems().map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      })),
      subtotal: this.subtotal(),
      shipping: this.shipping(),
      total: this.total(),
      delivery: { ...delivery },
      status: 'Confirmed',
    };
    this.products.update((products) =>
      products.map((p) => ({
        ...p,
        stock: p.stock - (this.cart().find((i) => i.productId === p.id)?.quantity ?? 0),
      })),
    );
    this.orders.update((orders) => [order, ...orders]);
    this.cart.set([]);
    this.persist();
    return { ok: true, order };
  }
  saveProduct(input: Omit<Product, 'id'>, id?: number): StoreResult {
    const product = { ...input, id: id ?? Math.max(0, ...this.products().map((p) => p.id)) + 1 };
    if (
      !isProduct(product) ||
      !product.name.trim() ||
      !product.description.trim() ||
      !product.category.trim()
    )
      return this.failure('Enter valid product details.');
    if (id !== undefined && !this.product(id)) return this.failure('Product not found.');
    this.products.update((products) =>
      id ? products.map((p) => (p.id === id ? product : p)) : [...products, product],
    );
    this.cart.set(this.normalizeCart(this.cart()));
    this.persist();
    this.notice.set('Demo product saved.');
    return { ok: true };
  }
  deleteProduct(id: number): void {
    this.products.update((products) => products.filter((p) => p.id !== id));
    this.cart.update((lines) => lines.filter((i) => i.productId !== id));
    this.wishlist.update((ids) => ids.filter((i) => i !== id));
    this.persist();
    this.notice.set('Demo product removed.');
  }
  updateOrder(id: string, status: Order['status']): void {
    this.orders.update((orders) => orders.map((o) => (o.id === id ? { ...o, status } : o)));
    this.persist();
  }
  resetDemo(): void {
    this.products.set(structuredClone(INITIAL_PRODUCTS));
    this.cart.set([]);
    this.wishlist.set([]);
    this.orders.set([]);
    this.profile.set(null);
    this.persist();
    this.notice.set('Demo data reset.');
  }
  private failure(message: string): { ok: false; message: string } {
    this.notice.set(message);
    return { ok: false, message };
  }
}
