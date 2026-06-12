import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

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
        <li><a routerLink="/p/sobre-mi" routerLinkActive="active">Sobre Sandra</a></li>
        <li><a routerLink="/p/portfolio" routerLinkActive="active">Portfolio</a></li>
        <li><a routerLink="/admin" routerLinkActive="active" style="color:var(--color-accent,#e05e28)">Admin</a></li>
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
}
