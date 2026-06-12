import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-cms',
  imports: [],
  templateUrl: './cms.html',
  styleUrl: './cms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cms {}
