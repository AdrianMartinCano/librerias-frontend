import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-state">
      <span style="font-size: 3rem">404</span>
      <span>Página no encontrada</span>
      <a routerLink="/" style="color: var(--color-accent); text-decoration: none; font-weight: 600;">
        ← Volver al inicio
      </a>
    </div>
  `,
})
export class NotFoundPage {}
