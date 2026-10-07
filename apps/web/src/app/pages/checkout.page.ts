import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';

@Component({
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.page.html',
})
export class CheckoutPage {
  readonly store = inject(StoreService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly form = this.fb.group({
    name: [
      this.store.profile()?.name ?? '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
    ],
    email: [this.store.profile()?.email ?? '', [Validators.required, Validators.email]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    street: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    accept: [false, Validators.requiredTrue],
  });
  invalid(field: string) {
    const control = this.form.get(field);
    return !!control?.invalid && (control.touched || this.submitted());
  }
  submit() {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid) return;
    this.submitting.set(true);
    const { accept, ...delivery } = this.form.getRawValue();
    const result = this.store.placeOrder({
      ...delivery,
      name: delivery.name.trim(),
      email: delivery.email.trim(),
      street: delivery.street.trim(),
      city: delivery.city.trim(),
      state: delivery.state.toUpperCase(),
    });
    if (result.ok) {
      void this.router.navigate(['/orders', result.order.id, 'confirmation']);
    } else {
      this.error.set(result.message);
      this.submitting.set(false);
    }
  }
}
