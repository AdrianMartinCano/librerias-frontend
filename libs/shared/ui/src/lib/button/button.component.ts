import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonVariant, ButtonSize } from '@org/models';

@Component({
  selector: 'lib-button',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size    = input<ButtonSize>('md');
  readonly loading  = input(false);
  readonly disabled = input(false);
  readonly full     = input(false);
  readonly type     = input<'button' | 'submit' | 'reset'>('button');
  readonly routerLink = input<string | null>(null);
  readonly href       = input<string | null>(null);

  readonly clicked = output<MouseEvent>();

  classes(): string {
    return [
      `lib-btn--${this.variant()}`,
      `lib-btn--${this.size()}`,
      this.full()    ? 'lib-btn--full'    : '',
      this.loading() ? 'lib-btn--loading' : '',
    ].filter(Boolean).join(' ');
  }
}
