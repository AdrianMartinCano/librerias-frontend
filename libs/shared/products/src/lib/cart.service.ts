import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product, CartItem } from '@org/models';

export type { CartItem };

const STORAGE_KEY = 'lib_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = signal<CartItem[]>(this.load());

  readonly count = computed(() =>
    this.items().reduce((acc, i) => acc + i.quantity, 0)
  );

  readonly total = computed(() =>
    this.items().reduce((acc, i) => acc + i.product.price * i.quantity, 0)
  );

  constructor() {
    effect(() => this.save(this.items()));
  }

  add(product: Product, quantity = 1): void {
    this.items.update((list) => {
      const existing = list.find((i) => i.product.id === product.id);
      if (existing) {
        return list.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...list, { product, quantity }];
    });
  }

  remove(productId: string): void {
    this.items.update((list) => list.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) { this.remove(productId); return; }
    this.items.update((list) =>
      list.map((i) => i.product.id === productId ? { ...i, quantity } : i)
    );
  }

  clear(): void { this.items.set([]); }

  private load(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private save(items: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}
