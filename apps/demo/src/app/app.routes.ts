import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'demo',
    pathMatch: 'full',
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./demo/demo.component').then((m) => m.DemoComponent),
  },
  {
    path: 'demo/productos/:id',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'demo',
  },
];
