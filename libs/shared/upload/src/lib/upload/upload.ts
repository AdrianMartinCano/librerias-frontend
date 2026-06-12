import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-upload',
  imports: [],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Upload {}
