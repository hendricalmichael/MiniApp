import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { GraphqlService } from '../core/graphql.service';
import { Product } from '../core/models';

const LATEST_QUERY = `
  query Latest {
    products {
      id name slug description price stock imageUrl
      category { id name slug }
    }
  }
`;

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>Welcome to MiniShop</h1>
      @if (auth.user(); as user) {
        <p>Good to see you, {{ user.name }}. Take a look at what is new.</p>
      } @else {
        <p>Browse our latest products, or create an account to get started.</p>
      }
      <div class="hero-actions">
        <a routerLink="/shop"><button>Shop now</button></a>
        @if (!auth.user()) {
          <a routerLink="/register"><button class="secondary">Create account</button></a>
        }
      </div>
    </section>

    <h2>Latest products</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="grid">
      @for (p of latest(); track p.id) {
        <div class="card">
          <a [routerLink]="['/product', p.slug]">
            <img [src]="p.imageUrl || 'https://placehold.co/400x300?text=No+image'" [alt]="p.name" />
            <h3>{{ p.name }}</h3>
          </a>
          <p class="price">\${{ p.price }}</p>
          <button [disabled]="p.stock === 0" (click)="cart.add(p)">
            {{ p.stock === 0 ? 'Out of stock' : 'Add to cart' }}
          </button>
        </div>
      } @empty {
        <p>No products yet.</p>
      }
    </div>
  `,
})
export class Home {
  auth = inject(AuthService);
  cart = inject(CartService);
  private gql = inject(GraphqlService);

  latest = signal<Product[]>([]);
  error = signal('');

  constructor() {
    this.load();
  }

  async load() {
    try {
      const data = await this.gql.request<{ products: Product[] }>(LATEST_QUERY);
      this.latest.set(data.products.slice(0, 4)); // newest four (the API sorts newest first)
    } catch (e) {
      this.error.set((e as Error).message || 'Could not load products.');
    }
  }
}