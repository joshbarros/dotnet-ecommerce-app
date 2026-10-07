import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { ProductArtComponent } from '../shared/product-art.component';

@Component({
  imports: [CurrencyPipe, RouterLink, ProductArtComponent],
  templateUrl: './cart.page.html',
})
export class CartPage {
  readonly store = inject(StoreService);
}
