import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-ui',
  imports: [],
  templateUrl: './ui.html',
  styleUrl: './ui.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ui {}
