import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'p/:slug',
    loadComponent: () => import('./pages/cms-page/cms-page.page').then(m => m.CmsPagePage),
  },
  {
    path: 'showcase',
    loadComponent: () => import('./pages/showcase/showcase.page').then(m => m.ShowcasePage),
  },
  {
    path: 'reservas-admin',
    loadComponent: () => import('./pages/reservas-admin/reservas-admin.page').then(m => m.ReservasAdminPage),
  },
  {
    path: 'reservas-multistaff',
    loadComponent: () => import('./pages/reservas-multistaff/reservas-multistaff.page').then(m => m.ReservasMultistaffPage),
  },
  {
    path: 'restauracion',
    loadComponent: () => import('./pages/restauracion/restauracion.page').then(m => m.RestauracionPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
  },
  {
    path: 'cms-preview',
    loadComponent: () => import('./pages/cms-preview/cms-preview.page').then(m => m.CmsPreviewPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage),
  },
];
