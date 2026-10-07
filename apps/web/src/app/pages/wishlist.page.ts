import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { ProductCardComponent } from '../shared/product-card.component';

@Component({
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './wishlist.page.html',
})
export class WishlistPage {
  readonly store = inject(StoreService);
}
