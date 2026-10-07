import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService } from '../core/store.service';
import { ProductArtComponent } from '../shared/product-art.component';
import { ProductCardComponent } from '../shared/product-card.component';

@Component({
  imports: [CurrencyPipe, RouterLink, ProductArtComponent, ProductCardComponent],
  templateUrl: './product-detail.page.html',
})
export class ProductDetailPage {
  readonly store = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly product = computed(() => this.store.product(Number(this.params().get('id'))));
  readonly related = computed(() =>
    this.store
      .products()
      .filter((p) => p.category === this.product()?.category && p.id !== this.product()?.id)
      .slice(0, 3),
  );
}
