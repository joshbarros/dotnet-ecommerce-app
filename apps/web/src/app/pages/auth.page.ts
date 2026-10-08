import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { lastValueFrom } from 'rxjs';
import { StoreService } from '../core/store.service';

@Component({ imports: [ReactiveFormsModule, RouterLink], templateUrl: './auth.page.html' })
export class AuthPage {
  readonly store = inject(StoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly url = toSignal(this.route.url, { initialValue: this.route.snapshot.url });
  readonly register = computed(() => this.url().some((segment) => segment.path === 'register'));
  readonly submitted = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group(
    {
      name: [
        '',
        this.register()
          ? [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]
          : [],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', this.register() ? [Validators.required] : []],
    },
    {
      validators: (form) =>
        this.register() && form.get('password')?.value !== form.get('confirmPassword')?.value
          ? { passwordMismatch: true }
          : null,
    },
  );

  async submit() {
    if (this.busy()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid) return;
    const { name, email, password } = this.form.getRawValue();
    if (this.store.usingApi) {
      this.busy.set(true);
      const result = this.register()
        ? await lastValueFrom(this.store.registerApi(name.trim(), email.trim(), password))
        : await lastValueFrom(this.store.signInApi(email.trim(), password));
      this.busy.set(false);
      if (!result.ok) {
        this.error.set(result.message);
        return;
      }
    } else {
      const current = this.store.profile();
      this.store.signIn({
        name: this.register()
          ? name.trim()
          : current?.email === email.trim()
            ? current.name
            : email.trim().split('@')[0],
        email: email.trim(),
      });
    }
    this.form.reset();
    void this.router.navigate(['/account']);
  }
}
