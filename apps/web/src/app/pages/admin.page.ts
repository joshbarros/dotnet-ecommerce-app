import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StoreService } from '../core/store.service';
import { Order } from '../core/models';

@Component({
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './admin.page.html',
})
export class AdminPage {
  readonly store = inject(StoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly url = toSignal(this.route.url, { initialValue: this.route.snapshot.url });
  readonly tab = computed(() => this.url().at(-1)?.path ?? 'admin');
  readonly pendingDelete = signal<number | null>(null);
  readonly revenue = computed(() => this.store.orders().reduce((sum, o) => sum + o.total, 0));
  readonly lowStock = computed(() => this.store.products().filter((p) => p.stock < 5));
  remove() {
    const id = this.pendingDelete();
    if (id === null) return;
    if (this.store.usingApi) this.store.deleteProductApi(id).subscribe();
    else this.store.deleteProduct(id);
    this.pendingDelete.set(null);
  }
  status(id: string, value: string) {
    if (this.store.usingApi) return;
    if (['Confirmed', 'Preparing', 'Shipped'].includes(value))
      this.store.updateOrder(id, value as Order['status']);
  }
}
