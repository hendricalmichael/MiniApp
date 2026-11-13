import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h1>Login</h1>

      <form (ngSubmit)="submit()" #f="ngForm">
        <label>
          Email or username
          <input name="identifier" [(ngModel)]="identifier" required autocomplete="username" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            [(ngModel)]="password"
            required
            autocomplete="current-password"
          />
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="f.invalid || busy()">
          {{ busy() ? 'Signing in...' : 'Login' }}
        </button>
      </form>

      <p class="muted">No account yet? <a routerLink="/register">Register</a></p>
    </div>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  identifier = '';
  password = '';
  busy = signal(false);
  error = signal('');

  async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.identifier, this.password);
      this.router.navigate(['/']); // later: admins will be sent to the admin dashboard
    } catch (e) {
      this.error.set((e as Error).message || 'Could not log in.');
    } finally {
      this.busy.set(false);
    }
  }
}