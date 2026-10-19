import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  ElementRef,
  NgZone,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem, Language, FormatService } from '@org/models';
import { ThemeService } from '../services/theme.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'lib-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  readonly items           = input<NavItem[]>([]);
  readonly logo            = input<string>('');
  readonly logoText        = input<string>('');
  readonly logoPath        = input<string>('/');
  readonly languages       = input<Language[]>([]);
  readonly showThemeToggle = input<boolean>(true);
  readonly showCart        = input<boolean>(false);
  readonly cartCount       = input<number>(0);
  /** Muestra el selector de moneda si hay más de una configurada (provideLibFormat). */
  readonly showCurrencySwitch = input<boolean>(true);

  readonly languageChange = output<string>();
  readonly currencyChange = output<string>();
  readonly cartClick      = output<void>();

  readonly theme = inject(ThemeService);
  readonly i18n  = inject(I18nService);
  readonly fmt   = inject(FormatService);

  readonly menuOpen       = signal(false);
  readonly scrolled       = signal(false);
  readonly activeDropdown = signal<string | null>(null);
  readonly langOpen       = signal(false);
  readonly currencyOpen   = signal(false);

  readonly currentLang = this.i18n.currentLang;
  // Monedas disponibles y activa (del FormatService de @org/models)
  readonly currencies     = this.fmt.currencies;
  readonly activeCurrency = this.fmt.currency;

  private readonly el = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Listeners globales registrados FUERA de la zona de Angular: el scroll y los
    // clics de toda la página no deben disparar change-detection. Solo entramos en
    // la zona (this.zone.run) cuando un estado observable cambia de verdad.
    // afterNextRender garantiza que esto solo corre en navegador (SSR-safe).
    afterNextRender(() => {
      const onScroll = (): void => {
        const next = window.scrollY > 10;
        if (next !== this.scrolled()) {
          this.zone.run(() => this.scrolled.set(next));
        }
      };

      const onDocClick = (event: MouseEvent): void => {
        if (this.activeDropdown() === null && !this.langOpen() && !this.currencyOpen()) return;
        if (!this.el.nativeElement.contains(event.target)) {
          this.zone.run(() => {
            this.activeDropdown.set(null);
            this.langOpen.set(false);
            this.currencyOpen.set(false);
          });
        }
      };

      const onKeydown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') return;
        if (this.menuOpen() || this.activeDropdown() !== null || this.langOpen() || this.currencyOpen()) {
          this.zone.run(() => {
            this.menuOpen.set(false);
            this.activeDropdown.set(null);
            this.langOpen.set(false);
            this.currencyOpen.set(false);
          });
        }
      };

      this.zone.runOutsideAngular(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKeydown);
      });

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKeydown);
      });
    });
  }

  toggleMenu(): void    { this.menuOpen.update((v) => !v); this.activeDropdown.set(null); }
  closeMenu(): void     { this.menuOpen.set(false); this.activeDropdown.set(null); }
  toggleDropdown(label: string): void { this.activeDropdown.update((v) => v === label ? null : label); }
  toggleLang(): void    { this.langOpen.update((v) => !v); this.currencyOpen.set(false); }
  toggleCurrency(): void { this.currencyOpen.update((v) => !v); this.langOpen.set(false); }

  selectLang(code: string): void {
    this.i18n.set(code);
    this.langOpen.set(false);
    this.languageChange.emit(code);
  }

  selectCurrency(code: string): void {
    this.fmt.setCurrency(code);
    this.currencyOpen.set(false);
    this.currencyChange.emit(code);
  }
}
