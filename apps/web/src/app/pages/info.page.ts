import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ imports: [ReactiveFormsModule, RouterLink], templateUrl: './info.page.html' })
export class InfoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly url = toSignal(this.route.url, { initialValue: this.route.snapshot.url });
  readonly page = computed(() => this.url().at(-1)?.path ?? 'about');
  readonly submitted = signal(false);
  readonly sent = signal(false);
  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });
  send() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.sent.set(true);
    this.form.reset();
  }
}
