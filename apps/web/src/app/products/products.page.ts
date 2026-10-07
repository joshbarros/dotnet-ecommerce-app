import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService } from '../core/store.service';
import { ProductCardComponent } from '../shared/product-card.component';

@Component({
  imports: [FormsModule, RouterLink, ProductCardComponent],
  templateUrl: './products.page.html',
})
export class ProductsPage {
  readonly store = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly search = computed(() => this.params().get('q') ?? '');
  readonly category = computed(() => this.params().get('category') ?? 'All');
  readonly sort = computed(() => this.params().get('sort') ?? 'featured');
  readonly inStock = computed(() => this.params().get('stock') === 'true');
  readonly page = computed(() => {
    const page = Number(this.params().get('page'));
    return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  });
  readonly categories = computed(() => [
    'All',
    ...new Set(this.store.products().map((p) => p.category)),
  ]);
  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const list = this.store
      .products()
      .filter(
        (p) =>
          (this.category() === 'All' || p.category === this.category()) &&
          (!this.inStock() || p.stock > 0) &&
          `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query),
      );
    return list.sort((a, b) =>
      this.sort() === 'price-low'
        ? a.price - b.price
        : this.sort() === 'price-high'
          ? b.price - a.price
          : this.sort() === 'name'
            ? a.name.localeCompare(b.name)
            : Number(b.featured) - Number(a.featured),
    );
  });
  readonly pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / 6)));
  readonly currentPage = computed(() => Math.min(this.page(), this.pages()));
  readonly visible = computed(() =>
    this.filtered().slice((this.currentPage() - 1) * 6, this.currentPage() * 6),
  );
  change(key: string, value: string | boolean | number) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value || null, ...(key !== 'page' ? { page: null } : {}) },
      queryParamsHandling: 'merge',
    });
  }
  clear() {
    void this.router.navigate(['/products']);
  }
}
