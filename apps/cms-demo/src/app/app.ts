import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '@org/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="site-nav">
      <a class="site-nav__brand" routerLink="/">📄 CMS Demo</a>
      <ul class="site-nav__links">
        <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a></li>
        <li><a routerLink="/showcase" routerLinkActive="active">Showcase</a></li>
        <li><a routerLink="/reservas-admin" routerLinkActive="active">Reservas (admin)</a></li>
        <li><a routerLink="/p/sobre-mi" routerLinkActive="active">Sobre Sandra</a></li>
        <li><a routerLink="/p/portfolio" routerLinkActive="active">Portfolio</a></li>
        <li><a routerLink="/admin" routerLinkActive="active" style="color:var(--color-accent,#e05e28)">Admin</a></li>
        <li>
          <button
            type="button"
            class="site-nav__theme"
            (click)="theme.toggle()"
            [attr.aria-pressed]="theme.isDark()"
            [attr.aria-label]="theme.isDark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            title="Cambiar tema"
          >
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>
        </li>
      </ul>
    </nav>

    <router-outlet />

    <footer class="site-footer">
      CMS Demo · Angular {{ version }} · Datos desde <code>libui-cms</code> con H2
    </footer>
  `,
})
export class App {
  readonly version = '21';
  readonly theme = inject(ThemeService);
}
