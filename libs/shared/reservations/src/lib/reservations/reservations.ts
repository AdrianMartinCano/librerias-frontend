import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-reservations',
  imports: [],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservations {}
