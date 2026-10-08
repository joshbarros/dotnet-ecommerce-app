import { Component, computed, effect, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService } from '../core/store.service';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-detail.page.html',
})
export class OrderDetailPage {
  readonly store = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly url = toSignal(this.route.url, { initialValue: this.route.snapshot.url });
  readonly order = computed(() =>
    this.store.orders().find((o) => o.id === this.params().get('id')),
  );
  readonly confirmation = computed(() =>
    this.url().some((segment) => segment.path === 'confirmation'),
  );
  constructor() {
    effect(() => this.store.ensureOrder(this.params().get('id') ?? ''));
  }
}
