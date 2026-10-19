import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@org/models';

import { AuthService } from '../auth.service';
import { GoogleAuthService } from './google.service';
import { GoogleConfig } from './google.types';

/**
 * El botón de «continuar con Google».
 *
 * Se pinta solo **si el backend dice que hay login con Google**. Si no lo hay —o su librería
 * no carga— aquí no aparece nada y la pantalla sigue funcionando con correo y contraseña: es
 * una función añadida, no un requisito.
 *
 * Hace el viaje entero: consigue el `id_token`, lo canjea por una sesión con
 * `AuthService.loginWithGoogle()` y emite `loginSuccess` con la sesión ya abierta. Quien lo
 * usa solo tiene que decidir a dónde navegar después.
 *
 * <h2>Por qué hay dos botones superpuestos</h2>
 *
 * Google solo entrega el token a través de su propio widget, y ese widget **no se puede
 * estilar**: cuando lo dibuja dentro de un `iframe` —que es lo que hace si detecta sesión de
 * Google— el iframe es de otro origen y pinta el botón sobre fondo blanco, que en modo oscuro
 * se ve como un marco alrededor.
 *
 * Tampoco vale recortar ese marco: el widget cambia de tamaño según si hay sesión y según lo
 * largo que sea el nombre de cada cual, así que un recorte a medida de una persona le deja el
 * marco asomando a otra.
 *
 * La solución es pintar debajo un botón propio y dejar el widget de Google encima con
 * opacidad 0 para que se lleve el clic. Lo que hace esto fiable —y no un truco de los que se
 * rompen solos— es que **el ancho se lo pedimos nosotros**: se le pasa el mismo que mide el
 * botón, así que siempre lo cubre, y no se depende de ninguna clase ni estructura interna
 * suya.
 *
 * **Google renderiza de dos formas**: con sesión iniciada mete un `iframe`, y sin ella genera
 * HTML normal dentro del documento. En los dos casos el clic llega, porque la capa cubre el
 * botón entero. Si algún día se toca esto, hay que probarlo **con sesión y sin ella**: son
 * caminos distintos.
 *
 * <h2>Accesibilidad</h2>
 *
 * La capa visual va con `aria-hidden` porque no es pulsable de verdad; el elemento real es el
 * de Google, que conserva su nombre accesible y su tabulación (la opacidad 0 no saca nada del
 * árbol de accesibilidad, a diferencia de `display: none`). El foco se ve gracias a
 * `:focus-within`, que también funciona cuando el foco cae dentro de un iframe hijo.
 */
@Component({
  selector: 'lib-google-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (available()) {
      @if (showDivider()) {
        <div class="lib-google__divider"><span>{{ dividerLabel() }}</span></div>
      }

      <div class="lib-google__wrapper" #wrapper>
        <div class="lib-google__visual" aria-hidden="true">
          <svg class="lib-google__logo" viewBox="0 0 18 18" width="18" height="18" focusable="false">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
          </svg>
          <span>{{ label() }}</span>
        </div>

        <div class="lib-google__slot" #slot></div>
      </div>

      @if (errorMessage()) {
        <p class="lib-google__error" role="alert">{{ errorMessage() }}</p>
      }
    }
  `,
  styles: `
    .lib-google__divider {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      margin: var(--space-4, 1rem) 0;
      color: var(--color-text-muted, #6b7280);
      font-size: var(--font-size-sm, 0.875rem);
    }

    /* Las dos rayas a los lados del texto, sin nodos vacíos en el marcado. */
    .lib-google__divider::before,
    .lib-google__divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border, #e5e7eb);
    }

    .lib-google__wrapper {
      position: relative;
      /* Fija la altura del conjunto: el widget de Google mide 44 px con size "large", así
         que el botón visual mide lo mismo y encajan exactamente. */
      height: 44px;
      /* NO QUITAR: Google limita su widget a 400 px de ancho. Si el botón visible fuera más
         ancho, los extremos se quedarían sin nada encima que recoja el clic, y esa parte del
         botón no haría nada. */
      max-width: 400px;
      margin-inline: auto;
    }

    .lib-google__visual {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3, 0.75rem);
      height: 100%;
      border-radius: var(--radius-md, 0.5rem);
      border: 1px solid var(--color-border, #e5e7eb);
      background: var(--color-surface, #ffffff);
      color: var(--color-text, #1f2937);
      font: inherit;
      font-weight: var(--font-weight-semibold, 600);
      transition: background 0.15s ease;
    }

    /* El puntero y el foco los provoca el widget de encima, no esta capa. */
    .lib-google__wrapper:hover .lib-google__visual {
      background: var(--color-background, #f9fafb);
    }

    /* :focus-within sí atraviesa el iframe, así que quien navegue con el teclado ve dónde
       está aunque el elemento con el foco sea el de Google. */
    .lib-google__wrapper:focus-within .lib-google__visual {
      outline: 2px solid var(--color-accent, #2563eb);
      outline-offset: 2px;
    }

    .lib-google__logo {
      flex: none;
    }

    /* El widget real de Google: encima, invisible y es quien recibe el clic. */
    .lib-google__slot {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      opacity: 0;
      /* Se recorta lo que sobresalga: el iframe se pide del ancho del botón, pero Google se
         toma unos píxeles de más y sin esto ensancharía la tarjeta. */
      overflow: hidden;
      cursor: pointer;
    }

    /*
      El mismo recuadro que usa el formulario para sus errores (.lib-login__alert).
      Antes era texto rojo suelto, así que en la misma pantalla convivan dos formas de
      decir lo mismo: un aviso con caja y otro sin ella. Se repiten los valores porque
      Angular encapsula los estilos por componente y este es otro; lo que importa es que
      se vean iguales, y los dos salen de los mismos tokens del tema.
    */
    .lib-google__error {
      margin: var(--space-3, 0.75rem) 0 0;
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      border-radius: var(--radius-md, 0.5rem);
      background: color-mix(in srgb, var(--color-danger, #dc3545) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger, #dc3545) 30%, transparent);
      color: var(--color-danger, #dc3545);
      font-size: var(--font-size-sm, 0.875rem);
    }
  `,
})
export class GoogleButtonComponent {
  private readonly google = inject(GoogleAuthService);
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);

  /** Texto del botón. */
  readonly label = input('Continuar con Google');
  /** El «o» entre el formulario y el botón. Quítalo si tu pantalla ya trae uno. */
  readonly showDivider = input(true);
  readonly dividerLabel = input('o');
  /** Con qué tema pide el widget a Google. Se ve poco: va tapado. */
  readonly theme = input<'light' | 'dark'>('light');
  readonly errorLabel = input(
    'No hemos podido entrar con Google. Prueba con tu correo y contraseña.',
  );

  /**
   * Si el botón canjea el `id_token` por una sesión, o solo lo entrega.
   *
   * **Ponlo a `false` si tu aplicación no usa el `AuthService` de esta librería.** Con
   * `true` —lo normal— el token se canjea con `AuthService.loginWithGoogle()` y la sesión
   * queda guardada aquí; si tu web lleva su propio servicio de sesión, eso dejaría **dos
   * sesiones en el `localStorage`**, y tu `logout()` no borraría la de la librería: un JWT
   * válido abandonado en el navegador de quien creía haber salido.
   *
   * Con `false` el botón se limita a lo que solo él puede hacer —hablar con Google y
   * conseguir el token— y emite `credential` para que lo canjees tú.
   */
  readonly exchange = input(true);

  /** Sesión ya abierta: el token está guardado y `isLoggedIn()` es true. Navega y ya. */
  readonly loginSuccess = output<AuthResponse>();
  /** El backend rechazó el token, o Google no cargó. El mensaje ya se enseña aquí. */
  readonly loginError = output<string>();
  /** Con `exchange = false`: el `id_token` de Google, para que lo canjees con tu servicio. */
  readonly credential = output<string>();

  private readonly wrapper = viewChild<ElementRef<HTMLElement>>('wrapper');
  private readonly slot = viewChild<ElementRef<HTMLElement>>('slot');

  private readonly config = toSignal(this.google.config(), {
    initialValue: { enabled: false, clientId: '' } as GoogleConfig,
  });

  protected readonly available = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    // Dos cosas tienen que pasar antes de pintar: que el backend confirme que hay login con
    // Google, y que exista el hueco donde pintarlo. El @if las encadena, así que este effect
    // se ejecuta dos veces: la primera activa el hueco, la segunda lo pinta.
    effect(() => {
      const config = this.config();
      if (!config.enabled || !config.clientId) {
        return;
      }

      this.available.set(true);

      const container = this.slot()?.nativeElement;
      if (!container || container.childElementCount > 0) {
        return;
      }

      void this.render(container, config.clientId);
    });
  }

  private async render(container: HTMLElement, clientId: string): Promise<void> {
    try {
      // El ancho se mide sobre el botón visible, no sobre el hueco: es lo que el widget de
      // Google tiene que cubrir para que no queden zonas donde el clic no haga nada.
      const width = this.wrapper()?.nativeElement.clientWidth ?? 320;

      await this.google.renderButton(container, clientId, this.theme(), width, (credential) =>
        // Google llama a esto desde su propio código, fuera de Angular. Sin volver a entrar
        // en la zona, lo que pase después —navegar, mostrar un error— no repintaría la
        // pantalla hasta el siguiente clic.
        this.zone.run(() => this.onCredential(credential)),
      );
    } catch {
      // Ni un error rojo ni un reintento: Google es opcional. Se avisa en pequeño y el
      // formulario de siempre sigue estando.
      this.fail();
    }
  }

  /**
   * Ya hay `id_token`. O se canjea aquí, o se entrega para que lo canjee la aplicación.
   *
   * En los dos casos **quien decide si ese token vale es el backend**: lo que llega del
   * navegador no demuestra nada hasta que alguien comprueba su firma.
   */
  private onCredential(credential: string): void {
    this.errorMessage.set('');

    if (!this.exchange()) {
      this.credential.emit(credential);
      return;
    }

    this.auth.loginWithGoogle(credential).subscribe({
      next: (response) => this.loginSuccess.emit(response),
      error: (err: unknown) => this.fail(err),
    });
  }

  /**
   * Avisa de que no se ha podido entrar, diciendo <b>por qué</b> cuando se sabe.
   *
   * <h2>El motivo del backend manda</h2>
   *
   * Antes se tiraba el error y siempre se pintaba el genérico —«prueba con tu correo y
   * contraseña»—, y con una cuenta dada de baja eso <b>era mentira</b>: la contraseña
   * tampoco iba a funcionar. Se mandaba a esa persona a dar vueltas sin decirle lo único
   * que necesitaba saber.
   *
   * <h2>Por qué aquí sí se puede decir</h2>
   *
   * Contar el estado de una cuenta a cualquiera permite averiguar quién está registrado.
   * Aquí no: para llegar a este punto Google ya ha comprobado que ese correo es de quien
   * lo está usando. No se le cuenta nada de nadie — se le cuenta lo suyo.
   *
   * Si no hay motivo del backend (Google no cargó, se cayó la red, un 500), queda el
   * genérico, que ahí sí es verdad: con el formulario de siempre puede entrar.
   */
  private fail(err?: unknown): void {
    const delBackend = (err as { error?: { message?: string } })?.error?.message;
    const mensaje = delBackend?.trim() ? delBackend.trim() : this.errorLabel();
    this.errorMessage.set(mensaje);
    this.loginError.emit(mensaje);
  }
}
