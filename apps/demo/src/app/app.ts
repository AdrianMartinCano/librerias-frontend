import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent, FooterComponent, ToastContainerComponent } from '@org/ui';
import { CartService } from '@org/products';
import { NavItem, FooterSection, Language, SocialLink } from '@org/models';

@Component({
  imports: [RouterModule, NavbarComponent, FooterComponent, ToastContainerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly cart = inject(CartService);

  navItems: NavItem[] = [
    { label: 'Demo', path: '/demo' },
    {
      label: 'Componentes',
      children: [
        { label: 'Tabla',     path: '/demo' },
        { label: 'Cards',     path: '/demo' },
        { label: 'Botones',   path: '/demo' },
        { label: 'Productos', path: '/demo' },
        { label: 'Auth',      path: '/demo' },
      ],
    },
    { label: 'GitHub', path: 'https://github.com/AdrianMartinCano/librerias', external: true },
  ];

  languages: Language[] = [
    { code: 'es', label: 'Español',  flag: '🇪🇸' },
    { code: 'en', label: 'English',  flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  socialLinks: SocialLink[] = [
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'github',    url: 'https://github.com/AdrianMartinCano/librerias' },
    { platform: 'linkedin',  url: 'https://linkedin.com' },
  ];

  footerSections: FooterSection[] = [
    {
      title: 'Componentes',
      links: [
        { label: 'Tabla',     path: '/demo' },
        { label: 'Botones',   path: '/demo' },
        { label: 'Cards',     path: '/demo' },
        { label: 'Productos', path: '/demo' },
        { label: 'Auth',      path: '/demo' },
      ],
    },
    {
      title: 'Librerías',
      links: [
        { label: '@org/ui',       path: '/demo' },
        { label: '@org/forms',    path: '/demo' },
        { label: '@org/auth',     path: '/demo' },
        { label: '@org/upload',   path: '/demo' },
        { label: '@org/products', path: '/demo' },
      ],
    },
    {
      title: 'Stack',
      text: 'Angular 21 · NX 22 · CSS Variables · Mobile-first',
    },
  ];

  onLanguageChange(code: string): void {
    console.log('Idioma:', code);
  }

  onCartClick(): void {
    console.log('Carrito:', this.cart.items());
  }
}
