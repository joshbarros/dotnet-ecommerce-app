import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    title: 'DevStore — Everyday essentials',
    loadComponent: () => import('./pages/home.page').then((m) => m.HomePage),
  },
  {
    path: 'products',
    title: 'Shop — DevStore',
    loadComponent: () => import('./products/products.page').then((m) => m.ProductsPage),
  },
  {
    path: 'products/:id',
    title: 'Product — DevStore',
    loadComponent: () => import('./pages/product-detail.page').then((m) => m.ProductDetailPage),
  },
  {
    path: 'cart',
    title: 'Your bag — DevStore',
    loadComponent: () => import('./pages/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'wishlist',
    title: 'Saved essentials — DevStore',
    loadComponent: () => import('./pages/wishlist.page').then((m) => m.WishlistPage),
  },
  {
    path: 'checkout',
    title: 'Demo checkout — DevStore',
    loadComponent: () => import('./pages/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'orders/:id/confirmation',
    title: 'Demo order confirmed — DevStore',
    loadComponent: () => import('./pages/order-detail.page').then((m) => m.OrderDetailPage),
  },
  {
    path: 'orders/:id',
    title: 'Order details — DevStore',
    loadComponent: () => import('./pages/order-detail.page').then((m) => m.OrderDetailPage),
  },
  {
    path: 'orders',
    title: 'Demo orders — DevStore',
    loadComponent: () => import('./pages/orders.page').then((m) => m.OrdersPage),
  },
  {
    path: 'login',
    title: 'Demo sign in — DevStore',
    loadComponent: () => import('./pages/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    title: 'Demo registration — DevStore',
    loadComponent: () => import('./pages/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'account',
    title: 'Your demo account — DevStore',
    loadComponent: () => import('./pages/account.page').then((m) => m.AccountPage),
  },
  {
    path: 'admin/products/new',
    title: 'New demo product — DevStore',
    loadComponent: () => import('./pages/admin-product.page').then((m) => m.AdminProductPage),
  },
  {
    path: 'admin/products/:id',
    title: 'Edit demo product — DevStore',
    loadComponent: () => import('./pages/admin-product.page').then((m) => m.AdminProductPage),
  },
  {
    path: 'admin',
    title: 'Demo management — DevStore',
    loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'admin/products',
    title: 'Demo products — DevStore',
    loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'admin/orders',
    title: 'Demo orders — DevStore',
    loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage),
  },
  ...['about', 'help', 'shipping', 'privacy', 'terms', 'contact'].map((path) => ({
    path,
    title: path.charAt(0).toUpperCase() + path.slice(1) + ' — DevStore',
    loadComponent: () => import('./pages/info.page').then((m) => m.InfoPage),
  })),
  {
    path: '**',
    title: 'Page not found — DevStore',
    loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
