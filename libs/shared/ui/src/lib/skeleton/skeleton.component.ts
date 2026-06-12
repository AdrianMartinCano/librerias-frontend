import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type SkeletonType = 'text' | 'title' | 'avatar' | 'image' | 'card' | 'button' | 'custom';

@Component({
  selector: 'lib-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (type() === 'card') {
      <div class="lib-sk-card">
        <div class="lib-sk lib-sk--image"></div>
        <div class="lib-sk-card__body">
          <div class="lib-sk lib-sk--title" style="width:60%"></div>
          <div class="lib-sk lib-sk--text"></div>
          <div class="lib-sk lib-sk--text" style="width:80%"></div>
          <div class="lib-sk lib-sk--button" style="width:40%;margin-top:8px"></div>
        </div>
      </div>
    } @else if (type() === 'text') {
      <div class="lib-sk-lines">
        @for (l of textLines(); track $index) {
          <div class="lib-sk lib-sk--text" [style.width]="l"></div>
        }
      </div>
    } @else if (type() === 'title') {
      <div class="lib-sk lib-sk--title" [style.width]="width() || '40%'"></div>
    } @else if (type() === 'avatar') {
      <div class="lib-sk lib-sk--avatar" [style.width]="width() || '40px'" [style.height]="height() || '40px'"></div>
    } @else if (type() === 'image') {
      <div class="lib-sk lib-sk--image" [style.width]="width() || '100%'" [style.height]="height() || '200px'" [style.border-radius]="radius()"></div>
    } @else if (type() === 'button') {
      <div class="lib-sk lib-sk--button" [style.width]="width() || '120px'"></div>
    } @else {
      <div class="lib-sk" [style.width]="width() || '100%'" [style.height]="height() || '16px'" [style.border-radius]="radius()"></div>
    }
  `,
  styles: [`
    /* La animación usa @keyframes lib-skeleton del theme */
    .lib-sk {
      background: linear-gradient(90deg,
        var(--color-surface, #f8f9fa) 25%,
        var(--color-surface-alt, #f1f3f5) 50%,
        var(--color-surface, #f8f9fa) 75%
      );
      background-size: 200% 100%;
      animation: lib-skeleton 1.4s ease infinite;
      border-radius: var(--radius-sm, .25rem);
    }

    @keyframes lib-skeleton {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Variantes */
    .lib-sk--text   { height: 14px; width: 100%; margin-bottom: 8px; }
    .lib-sk--title  { height: 22px; width: 40%; margin-bottom: 12px; }
    .lib-sk--avatar { border-radius: 50%; width: 40px; height: 40px; flex-shrink: 0; }
    .lib-sk--image  { width: 100%; aspect-ratio: 16/9; height: auto; border-radius: var(--radius-lg, .75rem); }
    .lib-sk--button { height: 38px; border-radius: var(--radius-md, .5rem); }

    /* Wrapper para texto multilínea */
    .lib-sk-lines { display: flex; flex-direction: column; gap: 0; }

    /* Wrapper para tarjeta */
    .lib-sk-card { overflow: hidden; border-radius: var(--radius-lg, .75rem); border: 1px solid var(--color-border, #e0e0e0); }
    .lib-sk-card .lib-sk--image { aspect-ratio: 4/3; height: auto; border-radius: 0; margin: 0; }
    .lib-sk-card__body { padding: var(--space-4, 1rem); display: flex; flex-direction: column; gap: var(--space-2, .5rem); }
  `],
})
export class SkeletonComponent {
  readonly type   = input<SkeletonType>('custom');
  readonly lines  = input(3);
  readonly width  = input<string>('');
  readonly height = input<string>('');
  readonly radius = input<string>('');

  readonly textLines = computed(() => {
    const widths = ['100%', '90%', '75%', '85%', '60%'];
    return Array.from({ length: this.lines() }, (_, i) =>
      i === this.lines() - 1 ? '60%' : widths[i % widths.length]
    );
  });
}
