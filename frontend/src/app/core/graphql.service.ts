import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const API_URL = 'http://localhost:8000/graphql/';

interface GraphqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private http = inject(HttpClient);

  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await firstValueFrom(
      this.http.post<GraphqlResponse<T>>(API_URL, { query, variables }),
    );
    if (res.errors?.length) {
      throw new Error(res.errors[0].message);
    }
    return res.data as T;
  }
}