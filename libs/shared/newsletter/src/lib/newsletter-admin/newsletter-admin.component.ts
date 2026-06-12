import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardComponent, ButtonComponent, TableComponent } from '@org/ui';
import { Column } from '@org/models';
import {
  NewsletterService,
  NewsletterSubscriberAdmin,
  NewsletterSubscriberStatus,
  NewsletterCampaign,
  NewsletterCampaignTemplate,
  NewsletterPage,
} from '../newsletter.service';

type SendStatus = 'idle' | 'loading' | 'success' | 'error';
type PreviewStatus = 'idle' | 'loading' | 'error';

const STATUS_COLORS: Record<NewsletterSubscriberStatus, string> = {
  confirmed: 'var(--color-success, #28a745)',
  pending: 'var(--color-warning, #f0ad4e)',
  unsubscribed: 'var(--color-danger, #dc3545)',
};

@Component({
  selector: 'lib-newsletter-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, ButtonComponent, TableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newsletter-admin.component.html',
  styleUrl: './newsletter-admin.component.css',
})
export class NewsletterAdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly newsletterService = inject(NewsletterService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly subscriberColumns: Column[] = [
    { key: 'email', label: 'Email' },
    { key: 'source', label: 'Origen' },
    { key: 'status', label: 'Estado', type: 'badge', badgeMap: STATUS_COLORS },
    { key: 'createdAt', label: 'Alta', type: 'date' },
    { key: 'confirmedAt', label: 'Confirmado', type: 'date' },
  ];

  readonly campaignColumns: Column[] = [
    { key: 'subject', label: 'Asunto' },
    { key: 'recipientCount', label: 'Destinatarios', type: 'number', align: 'right' },
    { key: 'sentAt', label: 'Enviada', type: 'date' },
  ];

  readonly statusFilter = signal<NewsletterSubscriberStatus | ''>('');
  readonly subscribers = signal<NewsletterPage<NewsletterSubscriberAdmin> | null>(null);
  readonly subscribersPage = signal(0);

  readonly campaigns = signal<NewsletterPage<NewsletterCampaign> | null>(null);
  readonly campaignsPage = signal(0);

  readonly confirmedCount = signal<number | null>(null);

  readonly campaignForm = this.fb.group({
    subject: ['', Validators.required],
    body: ['', Validators.required],
    templateId: [''],
  });

  readonly sendStatus = signal<SendStatus>('idle');
  readonly sendError = signal<string | null>(null);

  readonly templates = signal<NewsletterCampaignTemplate[]>([]);
  readonly previewHtml = signal<SafeHtml | null>(null);
  readonly previewStatus = signal<PreviewStatus>('idle');

  ngOnInit(): void {
    this.loadSubscribers();
    this.loadCampaigns();
    this.loadConfirmedCount();
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.newsletterService.listCampaignTemplates().subscribe((res) => {
      if (res.data) this.templates.set(res.data);
    });
  }

  loadSubscribers(): void {
    const status = this.statusFilter() || undefined;
    this.newsletterService.listSubscribers(status, this.subscribersPage()).subscribe((res) => {
      if (res.data) this.subscribers.set(res.data);
    });
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value as NewsletterSubscriberStatus | '');
    this.subscribersPage.set(0);
    this.loadSubscribers();
  }

  prevSubscribersPage(): void {
    if (this.subscribersPage() === 0) return;
    this.subscribersPage.update((p) => p - 1);
    this.loadSubscribers();
  }

  nextSubscribersPage(): void {
    if (!this.subscribers()?.hasNext) return;
    this.subscribersPage.update((p) => p + 1);
    this.loadSubscribers();
  }

  exportCsv(): void {
    const status = this.statusFilter() || undefined;
    this.newsletterService.exportSubscribersCsv(status).subscribe((csv) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter-subscribers.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  loadCampaigns(): void {
    this.newsletterService.listCampaigns(this.campaignsPage()).subscribe((res) => {
      if (res.data) this.campaigns.set(res.data);
    });
  }

  prevCampaignsPage(): void {
    if (this.campaignsPage() === 0) return;
    this.campaignsPage.update((p) => p - 1);
    this.loadCampaigns();
  }

  nextCampaignsPage(): void {
    if (!this.campaigns()?.hasNext) return;
    this.campaignsPage.update((p) => p + 1);
    this.loadCampaigns();
  }

  loadConfirmedCount(): void {
    this.newsletterService.listSubscribers('confirmed', 0).subscribe((res) => {
      if (res.data) this.confirmedCount.set(res.data.total);
    });
  }

  onPreviewCampaign(): void {
    const { subject, body, templateId } = this.campaignForm.value;
    if (!subject && !body) return;

    this.previewStatus.set('loading');
    this.newsletterService.previewCampaign(subject ?? '', body ?? '', templateId || undefined).subscribe({
      next: (res) => {
        this.previewStatus.set('idle');
        const html = res.data?.html;
        this.previewHtml.set(html ? this.sanitizer.bypassSecurityTrustHtml(this.disableLinks(html)) : null);
      },
      error: () => {
        this.previewStatus.set('error');
        this.previewHtml.set(null);
      },
    });
  }

  /** En la vista previa los enlaces no son funcionales (p.ej. "darte de baja" con un token falso): se muestran pero no son clicables. */
  private disableLinks(html: string): string {
    const style = '<style>a{pointer-events:none;cursor:default;}</style>';
    return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${style}</head>`) : style + html;
  }

  onSendCampaign(): void {
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    const recipients = this.confirmedCount() ?? 0;
    if (!confirm(`¿Enviar esta campaña a ${recipients} suscriptor(es) confirmado(s)?`)) return;

    const { subject, body, templateId } = this.campaignForm.value;
    this.sendStatus.set('loading');
    this.sendError.set(null);

    this.newsletterService.sendCampaign(subject ?? '', body ?? '', templateId || undefined).subscribe({
      next: (res) => {
        if (res.success === false) {
          this.sendStatus.set('error');
          this.sendError.set(res.message ?? null);
          return;
        }
        this.sendStatus.set('success');
        this.campaignForm.reset({ templateId: '' });
        this.previewHtml.set(null);
        this.previewStatus.set('idle');
        this.campaignsPage.set(0);
        this.loadCampaigns();
      },
      error: (err: HttpErrorResponse) => {
        this.sendStatus.set('error');
        const message = err.error?.message;
        this.sendError.set(typeof message === 'string' ? message : 'No se ha podido enviar la campaña.');
      },
    });
  }
}
