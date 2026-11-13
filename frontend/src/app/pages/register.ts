import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h1>Create account</h1>

      <form (ngSubmit)="submit()" #f="ngForm">
        <label>
          Name
          <input name="name" [(ngModel)]="name" required autocomplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" [(ngModel)]="email" required autocomplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            [(ngModel)]="password"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            [(ngModel)]="confirm"
            required
            autocomplete="new-password"
          />
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="f.invalid || busy()">
          {{ busy() ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="muted">Already registered? <a routerLink="/login">Login</a></p>
    </div>
  `,
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirm = '';
  busy = signal(false);
  error = signal('');

  async submit() {
    if (this.password !== this.confirm) {
      this.error.set('The two passwords do not match.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.register(this.name, this.email, this.password);
      this.router.navigate(['/']); // registering also logs you in
    } catch (e) {
      this.error.set((e as Error).message || 'Could not create the account.');
    } finally {
      this.busy.set(false);
    }
  }
}