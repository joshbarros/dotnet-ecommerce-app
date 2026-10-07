import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
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

  submit() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { name, email } = this.form.getRawValue();
    const current = this.store.profile();
    this.store.signIn({
      name: this.register()
        ? name.trim()
        : current?.email === email.trim()
          ? current.name
          : email.trim().split('@')[0],
      email: email.trim(),
    });
    // Password fields demonstrate validation only; never persist or transmit them.
    this.form.reset();
    void this.router.navigate(['/account']);
  }
}
