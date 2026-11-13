import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { ProductList } from './pages/product-list';
import { Register } from './pages/register';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'shop', component: ProductList },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '**', redirectTo: '' },
];