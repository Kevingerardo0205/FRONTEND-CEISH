import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StatusChipComponent, StatusTone } from '../status-chip/status-chip.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '../states/states.component';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string;
  /** Si existe, la celda se muestra como StatusChip con este tono. */
  tone?: (row: T) => StatusTone;
}

/**
 * Tabla con encabezado gris, filas clicables y columna de estado (spec-ui F00 §5).
 * Prioridad de estados: cargando > error > vacío > datos.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  readonly columns = input.required<readonly DataTableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly caption = input<string>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyMessage = input('No hay registros para mostrar.');

  readonly rowClick = output<T>();
  readonly retry = output<void>();
}
