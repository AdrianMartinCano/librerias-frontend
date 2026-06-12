import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { CmsPage } from '@org/models';
import { CmsBlockComponent } from '../cms-block/cms-block.component';

@Component({
  selector: 'lib-cms-page',
  standalone: true,
  imports: [CmsBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <main class="lib-cms-page">
      @for (block of page().blocks; track block.id ?? $index) {
        <lib-cms-block [block]="block" />
      }
    </main>
  `,
  styles: [`.lib-cms-page { width: 100%; }`],
})
export class CmsPageComponent {
  readonly page = input.required<CmsPage>();
}
