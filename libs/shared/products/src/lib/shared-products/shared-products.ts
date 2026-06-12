import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-shared-products',
  imports: [],
  templateUrl: './shared-products.html',
  styleUrl: './shared-products.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedProducts {}
