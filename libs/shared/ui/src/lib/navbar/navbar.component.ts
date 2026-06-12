import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  HostListener,
  ElementRef,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem, Language } from '@org/models';
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

  readonly languageChange = output<string>();
  readonly cartClick      = output<void>();

  readonly theme = inject(ThemeService);
  readonly i18n  = inject(I18nService);

  readonly menuOpen       = signal(false);
  readonly scrolled       = signal(false);
  readonly activeDropdown = signal<string | null>(null);
  readonly langOpen       = signal(false);

  readonly currentLang = this.i18n.currentLang;

  private readonly el = inject(ElementRef);

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 10); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.activeDropdown.set(null);
      this.langOpen.set(false);
    }
  }

  toggleMenu(): void    { this.menuOpen.update((v) => !v); this.activeDropdown.set(null); }
  closeMenu(): void     { this.menuOpen.set(false); this.activeDropdown.set(null); }
  toggleDropdown(label: string): void { this.activeDropdown.update((v) => v === label ? null : label); }
  toggleLang(): void    { this.langOpen.update((v) => !v); }

  selectLang(code: string): void {
    this.i18n.set(code);
    this.langOpen.set(false);
    this.languageChange.emit(code);
  }
}
