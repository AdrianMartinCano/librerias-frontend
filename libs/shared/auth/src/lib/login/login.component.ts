import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SocialProvider, AuthResponse } from '@org/models';
import { AuthService } from '../auth.service';

type AuthMode = 'login' | 'register';

interface SafeProvider extends SocialProvider {
  safeIcon?: SafeHtml;
}

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  // Elimina el atributo nativo `title` del host para evitar el tooltip del navegador
  host: { '[attr.title]': 'null' },
})
export class LoginComponent implements OnInit {
  // ── Apariencia ──
  readonly title               = input('Bienvenido');
  readonly subtitle            = input('');
  readonly logo                = input('');
  readonly logoText            = input('');
  readonly submitLabel         = input('Iniciar sesión');
  readonly registerTitle       = input('Crear cuenta');
  readonly registerSubmitLabel = input('Registrarse');

  // ── Comportamiento ──
  readonly initialMode       = input<AuthMode>('login');
  readonly showRegister      = input(true);
  readonly forgotPasswordUrl = input('');

  // ── Proveedores sociales ──
  readonly socialProviders = input<SocialProvider[]>([]);
  /** true → texto + layout vertical · false → solo icono circular + layout horizontal */
  readonly showSocialText  = input(true);

  // ── Eventos ──
  readonly loginSuccess    = output<AuthResponse>();
  readonly registerSuccess = output<AuthResponse>();
  readonly loginError      = output<string>();
  readonly socialClick     = output<SocialProvider>();

  readonly mode         = signal<AuthMode>('login');
  readonly loading      = signal(false);
  readonly errorMessage = signal('');

  // Proveedores con iconos sanitizados (computed se recalcula si cambia socialProviders)
  readonly safeProviders = computed<SafeProvider[]>(() =>
    this.socialProviders().map((p) => ({
      ...p,
      safeIcon: p.icon ? this.sanitizer.bypassSecurityTrustHtml(p.icon) : undefined,
    }))
  );

  form!: FormGroup;

  private readonly fb        = inject(FormBuilder);
  private readonly auth      = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.mode.set(this.initialMode());
    this.buildForm();
  }

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.buildForm();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { name, email, password } = this.form.value as {
      name: string;
      email: string;
      password: string;
    };

    const call$ =
      this.mode() === 'login'
        ? this.auth.login({ email, password })
        : this.auth.register({ name, email, password });

    call$.subscribe({
      next: (res) => {
        this.loading.set(false);
        if (this.mode() === 'login') this.loginSuccess.emit(res);
        else this.registerSuccess.emit(res);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Ha ocurrido un error. Inténtalo de nuevo.';
        this.errorMessage.set(msg);
        this.loginError.emit(msg);
      },
    });
  }

  onSocialClick(provider: SocialProvider): void {
    this.socialClick.emit(provider);
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  private buildForm(): void {
    if (this.mode() === 'login') {
      this.form = this.fb.group({
        email:    ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    } else {
      this.form = this.fb.group({
        name:     ['', Validators.required],
        email:    ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    }
  }
}
