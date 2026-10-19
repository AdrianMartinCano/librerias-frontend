import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product, CartItem } from '@org/models';

export type { CartItem };

const STORAGE_KEY = 'lib_cart';

/**
 * Identifica una línea del carrito.
 *
 * ES PRODUCTO + OPCIONES, no solo el producto. Un libro firmado y uno sin firmar, o un
 * pulpo verde y uno morado, son dos líneas aunque sean el mismo artículo: se preparan y
 * llegan por separado. Agrupando solo por producto, pedir la segunda variante subiría la
 * cantidad de la primera — un fallo silencioso que el cliente descubre al recibir el pedido.
 *
 * Las claves se ordenan antes de serializar para que {color:"rojo",talla:"M"} y
 * {talla:"M",color:"rojo"} sean la MISMA línea. Sin eso, el orden en que se construyera el
 * objeto decidiría si se agrupan o no.
 */
export function claveDeLinea(productId: string, options?: Record<string, string>): string {
  if (!options || Object.keys(options).length === 0) {
    return productId;
  }
  const ordenadas = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join('&');
  return `${productId}|${ordenadas}`;
}

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

  /**
   * @param options lo elegido para esta línea. Sin opciones, se comporta igual que siempre:
   *        las tiendas que no las usan no notan ningún cambio.
   */
  add(product: Product, quantity = 1, options?: Record<string, string>): void {
    if (quantity <= 0) return;
    const clave = claveDeLinea(product.id, options);

    this.items.update((list) => {
      const existing = list.find((i) => claveDeLinea(i.product.id, i.options) === clave);
      if (existing) {
        return list.map((i) =>
          claveDeLinea(i.product.id, i.options) === clave
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      // `options` se omite si no hay ninguna, para que el carrito guardado quede idéntico
      // al de antes en las tiendas que no las usan.
      return [...list, options && Object.keys(options).length
        ? { product, quantity, options }
        : { product, quantity }];
    });
  }

  /**
   * @param options las de la línea que se quita. Sin ellas se quita la línea SIN opciones
   *        de ese producto, no todas: si no, borrar el libro firmado se llevaría también
   *        el sin firmar.
   */
  remove(productId: string, options?: Record<string, string>): void {
    const clave = claveDeLinea(productId, options);
    this.items.update((list) =>
      list.filter((i) => claveDeLinea(i.product.id, i.options) !== clave)
    );
  }

  updateQuantity(productId: string, quantity: number, options?: Record<string, string>): void {
    if (quantity <= 0) { this.remove(productId, options); return; }
    const clave = claveDeLinea(productId, options);
    this.items.update((list) =>
      list.map((i) =>
        claveDeLinea(i.product.id, i.options) === clave ? { ...i, quantity } : i
      )
    );
  }

  clear(): void { this.items.set([]); }

  private load(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Los carritos guardados ANTES de que existieran las opciones no traen el campo, y
      // eso está bien: `options` es opcional y `claveDeLinea` lo trata como «sin opciones».
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
