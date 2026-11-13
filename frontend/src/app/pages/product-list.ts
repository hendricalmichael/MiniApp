import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { GraphqlService } from '../core/graphql.service';
import { Category, Product } from '../core/models';

// The GraphQL query: ask for exactly the fields we need
const PRODUCTS_QUERY = `
  query Products($categorySlug: String, $search: String) {
    products(categorySlug: $categorySlug, search: $search) {
      id name slug description price stock imageUrl
      category { id name slug }
    }
    categories { id name slug }
  }
`;

@Component({
  selector: 'app-product-list',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="toolbar">
      <input placeholder="Search products..." [(ngModel)]="search" (ngModelChange)="load()" />
      <select [(ngModel)]="category" (ngModelChange)="load()">
        <option value="">All categories</option>
        @for (c of categories(); track c.id) {
          <option [value]="c.slug">{{ c.name }}</option>
        }
      </select>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="grid">
      @for (p of products(); track p.id) {
        <div class="card">
          <a [routerLink]="['/product', p.slug]">
            <img [src]="p.imageUrl" [alt]="p.name" />
            <h3>{{ p.name }}</h3>
          </a>
          <p class="muted">{{ p.category.name }}</p>
          <p class="price">\${{ p.price }}</p>
          <button [disabled]="p.stock === 0" (click)="cart.add(p)">
            {{ p.stock === 0 ? 'Out of stock' : 'Add to cart' }}
          </button>
        </div>
      } @empty {
        <p>No products found.</p>
      }
    </div>
  `,
})
export class ProductList {
  cart = inject(CartService);
  private gql = inject(GraphqlService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  error = signal('');

  search = '';
  category = '';

  constructor() {
    this.load();
  }

  async load() {
    try {
      const data = await this.gql.request<{ products: Product[]; categories: Category[] }>(
        PRODUCTS_QUERY,
        { search: this.search || null, categorySlug: this.category || null },
      );
      this.products.set(data.products);
      this.categories.set(data.categories);
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message || 'Could not load products.');
    }
  }
}