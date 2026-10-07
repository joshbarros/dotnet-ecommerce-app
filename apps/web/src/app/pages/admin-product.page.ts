import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { Product } from '../core/models';

@Component({ imports: [ReactiveFormsModule, RouterLink], templateUrl: './admin-product.page.html' })
export class AdminProductPage {
  readonly store = inject(StoreService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.has('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : undefined;
  readonly product = this.id === undefined ? undefined : this.store.product(this.id);
  readonly missing = this.id !== undefined && !this.product;
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    name: [
      this.product?.name ?? '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
    ],
    description: [
      this.product?.description ?? '',
      [Validators.required, Validators.maxLength(1000)],
    ],
    price: [this.product?.price ?? 0, [Validators.required, Validators.min(0.01)]],
    stock: [
      this.product?.stock ?? 0,
      [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)],
    ],
    category: [this.product?.category ?? 'Workspace', Validators.required],
    kind: [this.product?.kind ?? 'keyboard', Validators.required],
    color: [
      this.product?.color ?? '#e8eddf',
      [Validators.required, Validators.pattern(/^#[0-9a-f]{6}$/i)],
    ],
    featured: [this.product?.featured ?? false],
  });
  save() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const result = this.store.saveProduct(
      {
        ...raw,
        name: raw.name.trim(),
        description: raw.description.trim(),
        kind: raw.kind as Product['kind'],
      },
      this.id,
    );
    if (result.ok) void this.router.navigate(['/admin/products']);
    else this.error.set(result.message);
  }
}
