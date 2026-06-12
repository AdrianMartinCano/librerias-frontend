import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  readonly title      = input<string>('');
  readonly subtitle   = input<string>('');
  readonly image      = input<string>('');
  readonly imageAlt   = input<string>('');
  readonly badge      = input<string>('');
  readonly routerLink = input<string | null>(null);
  readonly clickable  = input(false);
  readonly flat       = input(false);
}
