import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, ProductPage, ProductQuery } from '../core/models';

export type { Product } from '../core/models';

// These HTTP reads are reserved for your future API; demo pages use StoreService.
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  listFromApi(query: ProductQuery = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params = params.set(key, String(value));
    }
    return this.http.get<ProductPage>('/api/products', { params });
  }

  detailFromApi(id: number) {
    return this.http.get<Product>(`/api/products/${id}`);
  }
}
