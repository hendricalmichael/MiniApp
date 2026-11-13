import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header>
      <a routerLink="/" class="brand">MiniShop</a>
      <nav class="nav">
        <a routerLink="/">Home</a>
        <a routerLink="/shop">Shop</a>
        <a routerLink="/cart">Cart ({{ cart.count() }})</a>
        @if (auth.user(); as user) {
          <span class="hello">Hi, {{ user.name }}</span>
          <button class="small" (click)="logout()">Logout</button>
        } @else {
          <a routerLink="/login">Login</a>
          <a routerLink="/register">Register</a>
        }
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class App {
  cart = inject(CartService);
  auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.auth.restore(); // if a token is saved, find out who is logged in
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}