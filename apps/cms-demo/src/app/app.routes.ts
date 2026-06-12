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
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
  },
  {
    path: 'cms-preview',
    loadComponent: () => import('@org/cms-editor').then(m => m.CmsPreviewReceiverComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage),
  },
];
