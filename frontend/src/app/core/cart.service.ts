import { Injectable, computed, effect, signal } from '@angular/core';
import { CartLine, Product } from './models';

const STORAGE_KEY = 'minishop-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.load());

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));
  readonly total = computed(() =>
    this.lines().reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0),
  );

  constructor() {
    // Runs whenever `lines` changes: keep localStorage in sync
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines())));
  }

  add(product: Product, quantity = 1) {
    this.lines.update((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      if (existing) {
        return lines.map((l) =>
          l === existing
            ? { ...l, quantity: Math.min(l.quantity + quantity, product.stock) }
            : l,
        );
      }
      return [...lines, { product, quantity: Math.min(quantity, product.stock) }];
    });
  }

  setQuantity(productId: string, quantity: number) {
    if (quantity < 1) return this.remove(productId);
    this.lines.update((lines) =>
      lines.map((l) =>
        l.product.id === productId
          ? { ...l, quantity: Math.min(quantity, l.product.stock) }
          : l,
      ),
    );
  }

  remove(productId: string) {
    this.lines.update((lines) => lines.filter((l) => l.product.id !== productId));
  }

  clear() {
    this.lines.set([]);
  }

  private load(): CartLine[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}