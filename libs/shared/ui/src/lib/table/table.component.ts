import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { Column } from '@org/models';

@Component({
  selector: 'lib-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent {
  readonly data         = input.required<Record<string, unknown>[]>();
  readonly columns      = input<Column[]>([]);
  readonly striped      = input(false);
  readonly sortable     = input(true);
  readonly emptyMessage = input('No hay datos disponibles');

  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');

  computedColumns = computed<Column[]>(() => {
    const cols = this.columns();
    if (cols.length > 0) return cols;
    const first = this.data()[0];
    if (!first) return [];
    return Object.keys(first).map((key) => ({ key, label: this.toLabel(key) }));
  });

  sortedData = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const data = [...this.data()];
    if (!key) return data;
    return data.sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  onSortClick(col: Column): void {
    if (col.sortable === false || !this.sortable()) return;
    if (this.sortKey() === col.key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  getCellValue(row: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce((obj, k) => (obj as Record<string, unknown>)?.[k], row as unknown);
  }

  getCellStr(row: Record<string, unknown>, key: string): string {
    return String(this.getCellValue(row, key) ?? '');
  }

  formatValue(value: unknown, col: Column, row: Record<string, unknown>): string {
    if (col.format) return col.format(value, row);
    if (value == null || value === '') return '—';
    switch (col.type) {
      case 'currency': return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value));
      case 'date':     return new Date(value as string).toLocaleDateString('es-ES');
      case 'boolean':  return value ? 'Sí' : 'No';
      default:         return String(value);
    }
  }

  private toLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()).trim();
  }
}
