import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, inject, computed } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TextData } from '@org/models';

@Component({
  selector: 'lib-cms-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './text.component.css',
  template: `
    <section class="section">
      <div class="container cms-text__inner" [style.text-align]="data().align || 'left'">
        <div class="cms-text__content" [innerHTML]="safeContent()"></div>
      </div>
    </section>
  `,
})
export class TextComponent {
  readonly data      = input.required<TextData>();
  private readonly s = inject(DomSanitizer);

  safeContent(): SafeHtml {
    return this.s.bypassSecurityTrustHtml(this.data().content);
  }
}

