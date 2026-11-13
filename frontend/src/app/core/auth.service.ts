import { Injectable, computed, inject, signal } from '@angular/core';
import { GraphqlService } from './graphql.service';
import { User } from './models';

export const TOKEN_KEY = 'minishop-token';

const USER_FIELDS = 'id email name isStaff';

const ME_QUERY = `query Me { me { ${USER_FIELDS} } }`;

const LOGIN_MUTATION = `
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user { ${USER_FIELDS} }
    }
  }
`;

interface AuthPayload {
  token: string;
  user: User;
}

/** Knows who is logged in. The token lives in localStorage so a refresh keeps you logged in. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private gql = inject(GraphqlService);

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.isStaff === true);

  /** Called once when the app starts: if a token is saved, ask the server who it belongs to. */
  async restore() {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    try {
      const data = await this.gql.request<{ me: User | null }>(ME_QUERY);
      this.user.set(data.me);
      if (!data.me) localStorage.removeItem(TOKEN_KEY); // expired or invalid token
    } catch {
      this.user.set(null);
    }
  }

  async login(identifier: string, password: string): Promise<User> {
    const data = await this.gql.request<{ login: AuthPayload }>(LOGIN_MUTATION, {
      identifier,
      password,
    });
    return this.save(data.login);
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const data = await this.gql.request<{ register: AuthPayload }>(REGISTER_MUTATION, {
      name,
      email,
      password,
    });
    return this.save(data.register);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.user.set(null);
  }

  private save(payload: AuthPayload): User {
    localStorage.setItem(TOKEN_KEY, payload.token);
    this.user.set(payload.user);
    return payload.user;
  }
}