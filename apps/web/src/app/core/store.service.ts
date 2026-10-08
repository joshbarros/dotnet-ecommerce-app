import { HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, Optional, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { ApiService, CustomerDto, toOrder } from './api.service';
import { useApi } from './api-config';
import { INITIAL_PRODUCTS } from './catalog.data';
import { CartLine, DeliveryAddress, Order, Product, Profile, StoreResult } from './models';

export type OrderResult = { ok: true; order: Order } | { ok: false; message: string };

export type AuthResult = { ok: true } | { ok: false; message: string };

const STORAGE_KEY = 'devstore.demo.v1';
interface SavedState {
  products: Product[];
  cart: CartLine[];
  wishlist: number[];
  orders: Order[];
  profile: Profile | null;
  roles: string[];
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
      roles: Array.isArray(state.roles)
        ? (state.roles.filter((r: string) => typeof r === 'string') as string[])
        : [],
    };
  } catch {
    return {};
  }
}
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly authState = signal<'idle' | 'loading' | 'ready'>('idle');
  readonly isAdmin = computed(() => this.roles().includes('Admin'));

  constructor(@Optional() private readonly api?: ApiService) {
    if (this.usingApi && this.api) {
      this.reloadCatalog();
      this.reloadOrders();
      this.refreshSession();
    }
  }

  readonly usingApi = useApi;
  readonly catalogState = signal<'loading' | 'ready' | 'error'>(useApi ? 'loading' : 'ready');
  private readonly saved = loadState();
  readonly products = signal<Product[]>(
    this.saved.products ?? (useApi ? [] : structuredClone(INITIAL_PRODUCTS)),
  );
  readonly cart = signal<CartLine[]>(this.normalizeCart(this.saved.cart ?? []));
  readonly wishlist = signal<number[]>(this.saved.wishlist ?? []);
  readonly orders = signal<Order[]>(this.saved.orders ?? []);
  readonly profile = signal<Profile | null>(this.saved.profile ?? null);
  readonly roles = signal<string[]>(this.saved.roles ?? []);
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

  reloadCatalog(): void {
    this.catalogState.set('loading');
    this.api!.products({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.products.set(page.items);
        this.cart.set(this.normalizeCart(this.cart()));
        this.catalogState.set('ready');
      },
      error: () => {
        this.catalogState.set('error');
        this.notice.set('The shop could not reach the API.');
      },
    });
  }

  ensureProduct(id: number): void {
    if (!this.usingApi || this.product(id)) return;
    this.catalogState.set('loading');
    this.api!.product(id).subscribe({
      next: (product) => {
        this.products.update((list) =>
          list.some((p) => p.id === product.id) ? list : [...list, product],
        );
        this.catalogState.set('ready');
      },
      error: () => this.catalogState.set('error'),
    });
  }

  readonly orderState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private orderKey: string | null = null;

  reloadOrders(): void {
    if (!this.usingApi || !this.api) return;
    this.orderState.set('loading');
    this.api.listOrders().subscribe({
      next: (summaries) =>
        forkJoin(
          summaries.map((summary) => this.api!.order(summary.id).pipe(map(toOrder))),
        ).subscribe({
          next: (orders) => {
            this.orders.set(orders);
            this.orderState.set('ready');
          },
          error: () => {
            this.orderState.set('error');
            this.notice.set('Could not load your orders.');
          },
        }),
      error: () => {
        this.orderState.set('error');
        this.notice.set('Could not load your orders.');
      },
    });
  }

  ensureOrder(id: string): void {
    if (!this.usingApi || this.orders().some((o) => o.id === id)) return;
    this.api!.order(Number(id)).subscribe({
      next: (dto) => {
        const order = toOrder(dto);
        this.orders.update((list) =>
          list.some((o) => o.id === order.id) ? list : [...list, order],
        );
        this.orderState.set('ready');
      },
      error: () => this.orderState.set('error'),
    });
  }

  placeOrderApi(delivery: DeliveryAddress): Observable<OrderResult> {
    const lines = this.cart().map(({ productId, quantity }) => ({ productId, quantity }));
    if (!lines.length) {
      this.notice.set('Your cart is empty.');
      return of({ ok: false, message: 'Your cart is empty.' } as const);
    }
    this.orderKey ??= 'idem-' + crypto.randomUUID();
    return this.api!.createOrder(lines, delivery, this.orderKey).pipe(
      map((dto) => {
        const order = toOrder(dto);
        this.orders.update((list) => [order, ...list.filter((o) => o.id !== order.id)]);
        this.products.update((list) =>
          list.map((p) => {
            const line = lines.find((l) => l.productId === p.id);
            return line ? { ...p, stock: Math.max(0, p.stock - line.quantity) } : p;
          }),
        );
        this.cart.set([]);
        this.orderKey = null;
        this.orderState.set('ready');
        this.persist();
        this.notice.set('Order confirmed.');
        return { ok: true, order: order } as const;
      }),
      catchError((error: HttpErrorResponse) => {
        const message =
          error.status === 409
            ? 'An item ran out of stock. Review your cart and try again.'
            : (error.error?.detail ?? 'The shop could not place your order.');
        this.notice.set(message);
        return of({ ok: false, message } as const);
      }),
    );
  }

  refreshSession(): void {
    if (!this.usingApi || !this.api) return;
    this.authState.set('loading');
    this.api.account().subscribe({
      next: (dto) => this.applyCustomer(dto),
      error: () => {
        this.profile.set(null);
        this.roles.set([]);
        this.authState.set('idle');
      },
    });
  }

  signInApi(email: string, password: string): Observable<AuthResult> {
    return this.api!.login({ email, password }).pipe(
      map((dto) => {
        this.applyCustomer(dto.body!);
        this.notice.set(`Signed in as ${dto.body!.name}.`);
        return { ok: true } as const;
      }),
      catchError(() => of<AuthResult>({ ok: false, message: 'Invalid email or password.' })),
    );
  }

  registerApi(name: string, email: string, password: string): Observable<AuthResult> {
    return this.api!.register({ name, email, password }).pipe(
      map((dto) => {
        this.applyCustomer(dto.body!);
        this.notice.set(`Welcome, ${dto.body!.name}.`);
        return { ok: true } as const;
      }),
      catchError((error: HttpErrorResponse) =>
        of<AuthResult>({ ok: false, message: error.error?.detail ?? 'Registration failed.' }),
      ),
    );
  }

  signOutApi(): Observable<void> {
    return this.api!.logout().pipe(
      map(() => {
        this.profile.set(null);
        this.roles.set([]);
        this.authState.set('idle');
        this.orderState.set('idle');
        this.orders.set([]);
        this.persist();
        this.notice.set('You left your account.');
      }),
    );
  }

  updateProfileApi(name: string): Observable<AuthResult> {
    return this.api!.updateAccount(name).pipe(
      map((dto) => {
        this.applyCustomer(dto);
        this.notice.set('Profile updated.');
        return { ok: true } as const;
      }),
      catchError((error: HttpErrorResponse) =>
        of<AuthResult>({
          ok: false,
          message: error.error?.detail ?? 'Could not update your profile.',
        }),
      ),
    );
  }

  private applyCustomer(dto: CustomerDto): void {
    this.profile.set({ name: dto.name, email: dto.email });
    this.roles.set(dto.roles);
    this.authState.set('ready');
    this.persist();
  }

  saveProductApi(input: Omit<Product, 'id'>, id?: number): Observable<AuthResult> {
    const request = { ...input, price: Number(input.price), stock: Number(input.stock) };
    const call =
      id === undefined ? this.api!.createProduct(request) : this.api!.updateProduct(id, request);
    return call.pipe(
      map(() => {
        this.reloadCatalog();
        this.notice.set(id === undefined ? 'Product created.' : 'Product updated.');
        return { ok: true } as const;
      }),
      catchError((error: HttpErrorResponse) =>
        of<AuthResult>({
          ok: false,
          message: error.error?.detail ?? 'The API rejected the product.',
        }),
      ),
    );
  }

  deleteProductApi(id: number): Observable<AuthResult> {
    return this.api!.deleteProduct(id).pipe(
      map(() => {
        this.products.update((list) => list.filter((p) => p.id !== id));
        this.cart.set(this.normalizeCart(this.cart()));
        this.wishlist.update((ids) => ids.filter((i) => i !== id));
        this.persist();
        this.notice.set('Product removed.');
        return { ok: true } as const;
      }),
      catchError((error: HttpErrorResponse) =>
        of<AuthResult>({
          ok: false,
          message: error.error?.detail ?? 'Could not remove the product.',
        }),
      ),
    );
  }

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
          roles: this.roles(),
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
