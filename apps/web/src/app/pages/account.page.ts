import { Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { StoreService } from '../core/store.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account.page.html',
})
export class AccountPage {
  readonly store = inject(StoreService);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    email: [{ value: '', disabled: this.store.usingApi }, [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => {
      const profile = this.store.profile();
      if (profile && !this.form.dirty) this.form.patchValue(profile);
    });
  }

  async save() {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return;
    if (this.store.usingApi) {
      const result = await lastValueFrom(
        this.store.updateProfileApi(this.form.get('name')!.value.trim()),
      );
      if (!result.ok) this.error.set(result.message);
    } else {
      this.store.updateProfile(this.form.getRawValue());
    }
  }
}
