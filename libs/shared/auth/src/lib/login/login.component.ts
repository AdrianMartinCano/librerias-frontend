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

  /**
   * Texto de una casilla extra que sale <b>solo al registrarse</b>. Vacío, no hay casilla.
   *
   * <h2>Por qué es genérica y no «quiero la newsletter»</h2>
   *
   * Porque un componente de login no tiene por qué saber qué es una newsletter. La web que
   * lo usa pone el texto y decide qué hace con el sí; mañana otra la usará para avisos de
   * stock y no habrá que tocar nada aquí.
   *
   * <h2>Nace desmarcada, y eso no es negociable</h2>
   *
   * Una casilla premarcada no es consentimiento: el RGPD pide que sea una acción
   * afirmativa, y «venía puesta» no lo es. Aquí no hay forma de marcarla por defecto.
   */
  readonly consentLabel = input('');

  // ── Eventos ──
  readonly loginSuccess    = output<AuthResponse>();
  readonly registerSuccess = output<AuthResponse>();

  /**
   * Avisa cuando se marca o desmarca la casilla extra.
   *
   * Va por su cuenta y no dentro de {@link registerSuccess} para no cambiar la forma de
   * una salida que ya usan otras webs. Quien la escuche se guarda el último valor y actúa
   * cuando el registro sale bien.
   */
  readonly consentChange = output<boolean>();

  /** Si la casilla extra está marcada. Siempre arranca en false. */
  readonly consent = signal(false);
  readonly loginError      = output<string>();
  readonly socialClick     = output<SocialProvider>();

  /**
   * Si la contraseña se ve en claro.
   *
   * <b>Un solo estado para los dos campos del registro, pero un ojo en cada uno.</b> Quien
   * pulsa el ojo quiere comprobar lo que ha escrito, y comprobarlo en uno y no en el otro
   * no sirve de nada — por eso el estado es compartido. Pero el dibujo va en los dos: con
   * uno solo, el campo de abajo parecía no tener la opción y nadie adivina que el de
   * arriba también lo destapa.
   *
   * Vuelve a cero al cambiar de pantalla (ver switchMode): una contraseña a la vista es
   * algo que se enseña a propósito y por un momento, no un estado que se queda puesto.
   */
  readonly verPassword = signal(false);

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

  /** Marca o desmarca la casilla extra y lo cuenta fuera. */
  onConsent(e: Event): void {
    const marcada = (e.target as HTMLInputElement).checked;
    this.consent.set(marcada);
    this.consentChange.emit(marcada);
  }

  /**
   * Si las dos contraseñas no son iguales <b>y ya se ha tocado la segunda</b>.
   *
   * Lo segundo importa: sin ello, el error sale en cuanto se escribe la primera letra de la
   * confirmación —cuando todavía es imposible que coincida— y lo que hace es regañar a
   * alguien por ir escribiendo.
   */
  passwordsNoCoinciden(): boolean {
    if (this.mode() !== 'register') {
      return false;
    }
    const segunda = this.form.get('password2');
    if (!segunda || (!segunda.touched && !segunda.dirty)) {
      return false;
    }
    return this.form.get('password')?.value !== segunda.value;
  }

  /**
   * Quita el aviso de error en cuanto se toca algo.
   *
   * Se quedaba en pantalla para siempre: alguien fallaba la contraseña, la corregía y
   * seguía leyendo «email o contraseña incorrectos» encima del botón mientras escribía lo
   * correcto. Un error que sobrevive a su causa deja de informar y solo mete miedo.
   */
  alEscribir(): void {
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.verPassword.set(false);
    // La casilla vuelve a cero al cambiar de pantalla: un sí dado y luego abandonado no
    // puede quedarse esperando por ahí a que otro registro lo aproveche.
    if (this.consent()) {
      this.consent.set(false);
      this.consentChange.emit(false);
    }
    this.buildForm();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Se comprueba aquí y no con un validador del grupo para que el mensaje salga junto al
    // campo que hay que corregir, no como un error suelto del formulario entero.
    if (this.mode() === 'register'
        && this.form.get('password')?.value !== this.form.get('password2')?.value) {
      this.form.get('password2')?.markAsTouched();
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
        name:      ['', Validators.required],
        email:     ['', [Validators.required, Validators.email]],
        password:  ['', [Validators.required, Validators.minLength(6)]],
        password2: ['', Validators.required],
      });
    }
  }
}
