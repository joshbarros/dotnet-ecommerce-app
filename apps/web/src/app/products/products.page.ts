import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product, ProductsService } from './products.service';
@Component({selector: 'app-products', imports: [CurrencyPipe], template: `
<header><a class="brand" href="/products"><span class="logo">D</span> DevStore<span class="dot">.</span></a><span class="header-note">Thoughtful gear. Everyday use.</span><span class="badge">CATALOG DEMO</span></header>
<main><section class="hero"><p class="eyebrow">THE EVERYDAY COLLECTION / 01</p><h1>Good things for<br>your <em>daily rhythm.</em></h1><p class="intro">A few carefully chosen essentials for your workspace,<br>your commute, and everything in between.</p><div class="hero-foot"><span>Built for the way you live</span><span>↓ Explore the collection</span></div></section>
<section aria-labelledby="collection"><div class="section-heading"><h2 id="collection">The essentials</h2><span>{{ products().length }} products · Prices in BRL</span></div>
@if (loading()) { <p role="status" class="state">Finding your next everyday essential…</p> }
@else if (error()) { <div role="alert" class="state"><p>We couldn't load the collection.</p><button (click)="load()">Try again</button></div> }
@else if (!products().length) { <p class="state">New essentials are on their way. Check back soon.</p> }
@else { <div class="grid">@for (product of products(); track product.id) { <article><div class="art" [class]="'art art-' + product.id"><span class="art-label">DEVSTORE / 0{{product.id}}</span><div class="object">@switch(product.id) { @case(1) { <div class="keyboard">@for (key of keys; track $index) { <i></i> }</div> } @case(2) { <div class="headphones"><i></i><b></b></div> } @default { <div class="backpack"><i></i></div> } }</div></div><div class="product-body"><p class="category">{{product.category}}</p><h3>{{product.name}}</h3><p class="description">{{product.description}}</p><div class="product-foot"><strong>{{product.price | currency:'BRL':'symbol':'1.2-2':'en-US'}}</strong><span>{{product.stock}} in stock</span></div></div></article> }</div> }
</section><aside><span class="aside-icon">✳</span><div><h3>A small collection. A considered choice.</h3><p>This is a learning project. Checkout and payments are not available.</p></div></aside></main><footer><span>© {{year}} DevStore</span><span>Made with Angular + ASP.NET Core</span><span>Less, but better.</span></footer>`})
export class ProductsPage {
  private readonly service = inject(ProductsService);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly keys = Array.from({length: 40});
  readonly year = new Date().getFullYear();
  constructor() { this.load(); }
  load() { this.loading.set(true); this.error.set(false); this.service.list().subscribe({next: products => {this.products.set(products); this.loading.set(false);}, error: () => {this.error.set(true); this.loading.set(false);}}); }
}

