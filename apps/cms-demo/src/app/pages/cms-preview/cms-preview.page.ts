import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CmsPreviewReceiverComponent } from '@org/cms-editor';

@Component({
  selector: 'app-cms-preview',
  standalone: true,
  imports: [CmsPreviewReceiverComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-cms-preview-receiver />`,
})
export class CmsPreviewPage {}
