import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:        string;
  type:      ToastType;
  message:   string;
  title?:    string;
  duration?: number;           // ms — 0 = persistente
  action?:   { label: string; fn: () => void };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly toasts = signal<Toast[]>([]);

  success(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>): void {
    this.add({ ...options, type: 'success', message });
  }

  error(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>): void {
    this.add({ ...options, type: 'error', message, duration: options?.duration ?? 6000 });
  }

  warning(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>): void {
    this.add({ ...options, type: 'warning', message });
  }

  info(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>): void {
    this.add({ ...options, type: 'info', message });
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  clear(): void { this.toasts.set([]); }

  private add(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(list => [...list, { ...toast, id }]);

    const duration = toast.duration ?? 3500;
    if (duration > 0 && isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
