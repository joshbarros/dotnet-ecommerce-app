import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { ProductCardComponent } from '../shared/product-card.component';
import { ProductArtComponent } from '../shared/product-art.component';

@Component({
  imports: [RouterLink, ProductCardComponent, ProductArtComponent],
  templateUrl: './home.page.html',
})
export class HomePage {
  readonly store = inject(StoreService);
  readonly ready = computed(() => !this.store.usingApi || this.store.catalogState() === 'ready');
  readonly loadError = computed(() => this.store.usingApi && this.store.catalogState() === 'error');
  readonly loading = computed(() => this.store.usingApi && this.store.catalogState() === 'loading');
  readonly featured = computed(() =>
    this.store
      .products()
      .filter((p) => p.featured)
      .slice(0, 4),
  );
  readonly heroProduct = computed(() => this.store.products().find((p) => p.kind === 'headphones'));
}
