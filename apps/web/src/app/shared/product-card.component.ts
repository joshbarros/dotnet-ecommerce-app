import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { StoreService } from '../core/store.service';
import { ProductArtComponent } from './product-art.component';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, ProductArtComponent],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly store = inject(StoreService);
}
