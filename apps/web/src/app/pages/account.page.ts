import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account.page.html',
})
export class AccountPage {
  readonly store = inject(StoreService);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly submitted = signal(false);
  readonly form = this.fb.group({
    name: [
      this.store.profile()?.name ?? '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
    ],
    email: [this.store.profile()?.email ?? '', [Validators.required, Validators.email]],
  });
  save() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.store.updateProfile(this.form.getRawValue());
  }
}
