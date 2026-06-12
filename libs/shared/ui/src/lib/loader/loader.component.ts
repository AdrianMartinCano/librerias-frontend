import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'lib-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-loader-wrapper">
      <ng-content />
      @if (loading()) {
        <div class="lib-loader-overlay" [class.lib-loader-overlay--opaque]="opaque()">
          <div class="lib-loader-spinner">
            <span class="lib-spinner lib-spinner--lg" [style.color]="'var(--color-accent)'"></span>
            @if (message()) {
              <p class="lib-loader-message">{{ message() }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* lib-spinner viene del theme */
    .lib-loader-wrapper { position: relative; }

    .lib-loader-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,.6);
      backdrop-filter: blur(2px);
      border-radius: inherit;
      z-index: var(--z-overlay, 250);
      animation: lib-fade-in .15s ease both;
    }

    .lib-loader-overlay--opaque { background: var(--color-background, #fff); backdrop-filter: none; }

    .lib-loader-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3, .75rem);
    }

    .lib-loader-message {
      font-size: var(--font-size-sm, .875rem);
      color: var(--color-text-secondary, #595959);
      margin: 0;
    }
  `],
})
export class LoaderComponent {
  readonly loading = input(false);
  readonly message = input('');
  readonly opaque  = input(false);
}
