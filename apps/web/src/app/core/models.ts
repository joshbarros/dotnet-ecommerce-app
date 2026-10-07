export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  kind: 'keyboard' | 'headphones' | 'backpack' | 'lamp' | 'mouse' | 'bottle';
  color: string;
  featured: boolean;
}
export interface CartLine {
  productId: number;
  quantity: number;
}
export interface CartItem {
  product: Product;
  quantity: number;
}
export interface Profile {
  name: string;
  email: string;
}
export interface DeliveryAddress {
  name: string;
  email: string;
  postalCode: string;
  street: string;
  city: string;
  state: string;
}
export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}
export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: DeliveryAddress;
  status: 'Confirmed' | 'Preparing' | 'Shipped';
}
export type StoreResult = { ok: true } | { ok: false; message: string };

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: 'featured' | 'price-low' | 'price-high' | 'name';
  inStock?: boolean;
  page?: number;
  pageSize?: number;
}
export interface ProductPage {
  items: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
