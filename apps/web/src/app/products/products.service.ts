import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
export interface Product { id: number; name: string; description: string; price: number; stock: number; category: string; }
@Injectable({providedIn: 'root'})
export class ProductsService {
  private readonly http = inject(HttpClient);
  list() { return this.http.get<Product[]>('/api/products'); }
}

