import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.page.html',
})
export class OrdersPage {
  readonly store = inject(StoreService);
}
