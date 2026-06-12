import {
  Component, ChangeDetectionStrategy, input, output, inject, effect, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'lib-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="lib-modal-backdrop"
        (click)="onBackdropClick()"
        [attr.aria-hidden]="true"
      ></div>
      <div
        class="lib-modal lib-modal--{{ size() }}"
        role="dialog"
        [attr.aria-modal]="true"
        [attr.aria-label]="title() || 'Diálogo'"
      >
        <!-- Header -->
        <div class="lib-modal__header">
          <ng-content select="[slot=header]" />
          @if (title()) {
            <h2 class="lib-modal__title">{{ title() }}</h2>
          }
          @if (closable()) {
            <button type="button" class="lib-modal__close" (click)="closed.emit()" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>

        <!-- Body -->
        <div class="lib-modal__body">
          <ng-content />
        </div>

        <!-- Footer -->
        <ng-content select="[slot=footer]" />
      </div>
    }
  `,
  styles: [`
    .lib-modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      z-index: var(--z-modal, 300);
      animation: lib-fade-in .15s ease both;
    }

    .lib-modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: calc(var(--z-modal, 300) + 1);
      background: var(--color-background, #fff);
      border-radius: var(--radius-xl, 1rem);
      box-shadow: var(--shadow-xl, 0 20px 25px rgba(0,0,0,.15));
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - var(--space-8, 2rem));
      overflow: hidden;
      animation: lib-scale-in .2s ease both;
      width: calc(100% - var(--space-8, 2rem));
    }

    .lib-modal--sm  { max-width: 400px; }
    .lib-modal--md  { max-width: 560px; }
    .lib-modal--lg  { max-width: 720px; }
    .lib-modal--xl  { max-width: 960px; }
    .lib-modal--full { max-width: calc(100% - var(--space-8, 2rem)); max-height: calc(100vh - var(--space-8, 2rem)); }

    /* Header */
    .lib-modal__header {
      display: flex;
      align-items: center;
      gap: var(--space-3, .75rem);
      padding: var(--space-5, 1.25rem) var(--space-6, 1.5rem) var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      flex-shrink: 0;
    }

    .lib-modal__title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #1a1a1a);
      margin: 0;
      flex: 1;
    }

    .lib-modal__close {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      border: none; border-radius: var(--radius-md, .5rem);
      background: none; cursor: pointer; flex-shrink: 0;
      color: var(--color-text-muted, #909090);
      transition: background var(--transition-fast, 120ms ease), color var(--transition-fast, 120ms ease);
    }
    .lib-modal__close:hover { background: var(--color-surface, #f8f9fa); color: var(--color-text, #1a1a1a); }

    /* Body */
    .lib-modal__body {
      padding: var(--space-6, 1.5rem);
      overflow-y: auto;
      flex: 1;
    }

    /* Footer — slot, el consumidor lo pone */
    ::ng-deep [slot=footer] {
      display: flex;
      gap: var(--space-3, .75rem);
      justify-content: flex-end;
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      border-top: 1px solid var(--color-border, #e0e0e0);
      flex-shrink: 0;
    }

    @media (max-width: 479px) {
      .lib-modal {
        position: fixed;
        top: auto; left: 0; right: 0; bottom: 0;
        transform: none;
        border-radius: var(--radius-xl, 1rem) var(--radius-xl, 1rem) 0 0;
        max-height: 90vh;
        width: 100%;
        animation: lib-slide-up .25s ease both;
      }
    }
  `],
})
export class ModalComponent {
  readonly open     = input(false);
  readonly title    = input('');
  readonly size     = input<ModalSize>('md');
  readonly closable = input(true);

  readonly closed = output<void>();

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      document.body.style.overflow = this.open() ? 'hidden' : '';
    });
  }

  onBackdropClick(): void {
    if (this.closable()) this.closed.emit();
  }
}
