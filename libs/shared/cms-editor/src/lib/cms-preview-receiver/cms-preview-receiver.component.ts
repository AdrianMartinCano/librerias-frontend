import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, signal } from '@angular/core';
import { CmsPageComponent } from '@adrianmartincano/ng-cms';
import { CmsPage } from '@org/models';

@Component({
  selector: 'lib-cms-preview-receiver',
  standalone: true,
  imports: [CmsPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (page()) {
      <lib-cms-page [page]="page()!" />
    } @else {
      <div class="cpr__waiting">
        <span>Cargando preview...</span>
      </div>
    }
  `,
  styles: [`
    .cpr__waiting {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: var(--font-family, sans-serif);
      color: var(--color-text-muted, #999);
      font-size: 0.875rem;
    }
  `],
})
export class CmsPreviewReceiverComponent implements OnInit, OnDestroy {
  readonly page = signal<CmsPage | null>(null);

  private readonly handler = (event: MessageEvent) => {
    if (event.data?.type === 'CMS_PREVIEW_UPDATE') {
      this.page.set(event.data.page as CmsPage);
    }
  };

  ngOnInit(): void {
    window.addEventListener('message', this.handler);
    window.parent?.postMessage({ type: 'CMS_PREVIEW_READY' }, '*');
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handler);
  }
}
