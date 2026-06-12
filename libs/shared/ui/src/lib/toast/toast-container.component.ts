import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService, ToastType } from '../services/toast.service';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

@Component({
  selector: 'lib-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-toasts" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="lib-toast lib-toast--{{ toast.type }}"
          role="alert"
        >
          <span class="lib-toast__icon">{{ icons[toast.type] }}</span>

          <div class="lib-toast__body">
            @if (toast.title) {
              <p class="lib-toast__title">{{ toast.title }}</p>
            }
            <p class="lib-toast__message">{{ toast.message }}</p>
            @if (toast.action) {
              <button
                type="button"
                class="lib-toast__action"
                (click)="toast.action!.fn(); toastService.dismiss(toast.id)"
              >
                {{ toast.action.label }}
              </button>
            }
          </div>

          <button
            type="button"
            class="lib-toast__close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar"
          >✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .lib-toasts {
      position: fixed;
      bottom: var(--space-6, 1.5rem);
      right: var(--space-6, 1.5rem);
      z-index: var(--z-toast, 400);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, .75rem);
      max-width: 380px;
      width: calc(100vw - var(--space-8, 2rem));
      pointer-events: none;
    }

    .lib-toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, .75rem);
      padding: var(--space-3, .75rem) var(--space-4, 1rem);
      border-radius: var(--radius-lg, .75rem);
      box-shadow: var(--shadow-xl, 0 20px 25px rgba(0,0,0,.1));
      background: var(--color-background, #fff);
      border-left: 4px solid;
      pointer-events: all;
      animation: lib-toast-in .2s ease both;
    }

    @keyframes lib-toast-in {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .lib-toast--success { border-color: var(--color-success, #28a745); }
    .lib-toast--error   { border-color: var(--color-danger,  #dc3545); }
    .lib-toast--warning { border-color: var(--color-warning, #ffc107); }
    .lib-toast--info    { border-color: var(--color-info,    #17a2b8); }

    .lib-toast__icon {
      font-size: var(--font-size-base, 1rem);
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .lib-toast--success .lib-toast__icon { color: var(--color-success, #28a745); }
    .lib-toast--error   .lib-toast__icon { color: var(--color-danger,  #dc3545); }
    .lib-toast--warning .lib-toast__icon { color: var(--color-warning, #ffc107); }
    .lib-toast--info    .lib-toast__icon { color: var(--color-info,    #17a2b8); }

    .lib-toast__body { flex: 1; min-width: 0; }

    .lib-toast__title {
      font-size: var(--font-size-sm, .875rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #1a1a1a);
      margin: 0 0 var(--space-1, .25rem);
    }

    .lib-toast__message {
      font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-secondary, #595959);
      margin: 0;
      line-height: var(--line-height-base, 1.5);
    }

    .lib-toast__action {
      background: none; border: none; padding: 0; margin-top: var(--space-2, .5rem);
      font-size: var(--font-size-xs, .75rem); font-weight: var(--font-weight-semibold, 600);
      color: var(--color-accent, #ff4d4d); cursor: pointer; font-family: inherit;
    }
    .lib-toast__action:hover { text-decoration: underline; }

    .lib-toast__close {
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted, #909090); font-size: .75rem;
      padding: var(--space-1, .25rem); flex-shrink: 0; line-height: 1;
      transition: color var(--transition-fast, 120ms ease);
    }
    .lib-toast__close:hover { color: var(--color-text, #1a1a1a); }

    @media (max-width: 479px) {
      .lib-toasts { bottom: var(--space-4, 1rem); right: var(--space-4, 1rem); left: var(--space-4, 1rem); max-width: 100%; width: auto; }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly icons = ICONS;
}
