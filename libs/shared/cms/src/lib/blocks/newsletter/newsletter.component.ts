import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { NewsletterFormComponent } from '@adrianmartincano/ng-newsletter';
import { NewsletterBlockData } from '@org/models';

@Component({
  selector: 'lib-cms-newsletter',
  standalone: true,
  imports: [NewsletterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './newsletter.component.css',
  template: `
    <section
      class="section cms-newsletter"
      [class]="'cms-newsletter--' + (data().background || 'surface')"
      [class.cms-newsletter--center]="(data().align ?? 'center') === 'center'"
    >
      <div class="container cms-newsletter__inner">
        <lib-newsletter-form
          [title]="data().title ?? ''"
          [description]="data().description ?? ''"
          [layout]="data().layout ?? 'inline'"
          [source]="data().source ?? ''"
        />
      </div>
    </section>
  `,
})
export class NewsletterComponent {
  readonly data = input.required<NewsletterBlockData>();
}
