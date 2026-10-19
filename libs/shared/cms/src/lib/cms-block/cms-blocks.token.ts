import { InjectionToken, Provider, Type } from '@angular/core';

/**
 * Registro opcional de bloques CMS personalizados (tipo → componente). Permite que `lib-cms-block`
 * renderice tipos de bloque que NO vienen de serie, sin que `ng-cms` dependa de esas librerías.
 * El componente registrado debe exponer un input `data`.
 */
export const CMS_CUSTOM_BLOCKS = new InjectionToken<Record<string, Type<unknown>>>('CMS_CUSTOM_BLOCKS');

/**
 * Registra bloques CMS personalizados en el bootstrap de la app:
 *
 *   import { provideCmsBlocks } from '@adrianmartincano/ng-cms';
 *   import { CalendarBlockComponent } from '@adrianmartincano/ng-reservations';
 *
 *   providers: [ provideCmsBlocks({ calendar: CalendarBlockComponent }) ]
 */
export function provideCmsBlocks(blocks: Record<string, Type<unknown>>): Provider {
  return { provide: CMS_CUSTOM_BLOCKS, useValue: blocks };
}
