import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DeliveryAddress, Order, Product, ProductQuery } from './models';

export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface OrderItemDto {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryDto {
  name: string;
  email: string;
  postalCode: string;
  street: string;
  city: string;
  state: string;
}

export interface OrderDto {
  id: number;
  createdAt: string;
  status: string;
  items: OrderItemDto[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: DeliveryDto;
}

export interface OrderSummaryDto {
  id: number;
  createdAt: string;
  status: string;
  total: number;
  itemCount: number;
}

export interface ProductPageDto {
  items: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly csrfToken = signal<string>('');

  constructor(private readonly http: HttpClient) {}

  products(query: ProductQuery = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined) params = params.set(key, String(value));
    return this.http.get<ProductPageDto>('/api/products', { params });
  }
  product(id: number) {
    return this.http.get<Product>(`/api/products/${id}`);
  }
  register(input: RegisterInput) {
    return this.http
      .post<CustomerDto>('/api/auth/register', input, { observe: 'response' })
      .pipe(tap((r) => this.captureCsrf(r)));
  }
  login(input: { email: string; password: string }) {
    return this.http
      .post<CustomerDto>('/api/auth/login', input, { observe: 'response' })
      .pipe(tap((r) => this.captureCsrf(r)));
  }
  logout() {
    return this.http.post('/api/auth/logout', {}).pipe(tap(() => this.csrfToken.set('')));
  }
  account() {
    return this.http.get<CustomerDto>('/api/account');
  }
  updateAccount(name: string) {
    return this.http.put<CustomerDto>('/api/account', { name });
  }
  createOrder(
    items: { productId: number; quantity: number }[],
    delivery: DeliveryAddress,
    idempotencyKey: string,
  ) {
    return this.http.post<OrderDto>(
      '/api/orders',
      { items, delivery },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }
  listOrders() {
    return this.http.get<OrderSummaryDto[]>('/api/orders');
  }
  order(id: number) {
    return this.http.get<OrderDto>(`/api/orders/${id}`);
  }

  createProduct(input: Omit<Product, 'id'>) {
    return this.http.post<Product>('/api/admin/products', input);
  }
  updateProduct(id: number, input: Omit<Product, 'id'>) {
    return this.http.put<Product>(`/api/admin/products/${id}`, input);
  }
  deleteProduct(id: number) {
    return this.http.delete(`/api/admin/products/${id}`);
  }

  private captureCsrf(r: HttpResponse<CustomerDto>): void {
    const token = r.headers.get('X-CSRF-TOKEN');
    if (token) this.csrfToken.set(token);
  }
}

export function toOrder(dto: OrderDto): Order {
  return {
    id: String(dto.id),
    createdAt: dto.createdAt,
    status: dto.status as Order['status'],
    items: dto.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: dto.subtotal,
    shipping: dto.shipping,
    total: dto.total,
    delivery: { ...dto.delivery },
  };
}
