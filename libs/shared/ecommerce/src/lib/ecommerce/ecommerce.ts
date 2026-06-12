import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-ecommerce',
  imports: [],
  templateUrl: './ecommerce.html',
  styleUrl: './ecommerce.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ecommerce {}
