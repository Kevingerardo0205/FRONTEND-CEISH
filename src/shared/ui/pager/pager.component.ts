import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Paginador (F01 T01-7, spec-ui §3.2 punto 6). `Mostrando a–b de N` en una región
 * `aria-live="polite"`; Anterior y Siguiente de 44 px, deshabilitados en los extremos.
 * Con total 0 no se muestra.
 */
@Component({
  selector: 'app-pager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pager.component.html',
  styleUrl: './pager.component.scss',
})
export class PagerComponent {
  readonly page = input.required<number>();
  readonly limit = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  readonly desde = computed(() => Math.min((this.page() - 1) * this.limit() + 1, this.total()));
  readonly hasta = computed(() => Math.min(this.page() * this.limit(), this.total()));
  readonly esPrimera = computed(() => this.page() <= 1);
  readonly esUltima = computed(() => this.page() >= this.totalPages());

  ir(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) this.pageChange.emit(page);
  }
}
