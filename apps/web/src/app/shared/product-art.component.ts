import { Component, input } from '@angular/core';
import { Product } from '../core/models';

@Component({
  selector: 'app-product-art',
  templateUrl: './product-art.component.html',
})
export class ProductArtComponent {
  readonly product = input.required<Product>();
  readonly keys = Array.from({ length: 40 });
}
