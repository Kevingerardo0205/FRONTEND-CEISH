import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { StatusChipComponent } from '@shared/ui/status-chip/status-chip.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { fechaEcuador } from '@shared/utils/fecha-ecuador.util';
import { EstadoBloque } from '../../../application/mis-pendientes.facade';
import { destinoAccion } from '../../../domain/accion.rules';
import { FiltroPendientes, PendienteItem } from '../../../domain/pendiente.model';
import { PlazoChip, plazoChip } from '../../../domain/plazo.rules';

interface Fila {
  item: PendienteItem;
  plazo: PlazoChip;
  etapa: string;
  destino: (string | number)[] | null;
  ariaLabel: string;
}

const VACIOS: Record<FiltroPendientes, string> = {
  todos: 'No tiene pendientes. Los protocolos nuevos aparecerán aquí.',
  vencidos: 'No hay pendientes vencidos.',
  hoy: 'No hay pendientes para hoy.',
  semana: 'No hay pendientes para esta semana.',
};

/**
 * Tabla de Mis pendientes (spec-ui §3.1 zona 5, §3.1.1, §5.2, §5.3 y §5.5). El orden es el del
 * backend (RF-ALR.f.3): la UI no reordena. Sin fondo rosado en las vencidas: la urgencia la da
 * la columna Plazo (color + texto).
 */
@Component({
  selector: 'app-pendientes-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './pendientes-table.component.html',
  styleUrl: './pendientes-table.component.scss',
})
export class PendientesTableComponent {
  private readonly router = inject(Router);

  readonly estado = input.required<EstadoBloque>();
  readonly items = input<PendienteItem[] | null>(null);
  readonly filtro = input<FiltroPendientes>('todos');
  readonly reintentar = output<void>();
  readonly verTodos = output<void>();

  readonly filas = computed<Fila[]>(() =>
    (this.items() ?? []).map((item) => ({
      item,
      plazo: plazoChip(item.estadoPlazo, fechaEcuador(item.fechaPlazo)),
      etapa: item.etapa?.label ?? 'Etapa no reconocida',
      destino: destinoAccion(item.accion, item.protocolId),
      ariaLabel: item.ceishCode ? `${item.accionTexto} ${item.ceishCode}` : item.accionTexto,
    })),
  );

  readonly vacio = computed(() => VACIOS[this.filtro()]);

  abrir(destino: (string | number)[]): void {
    void this.router.navigate(destino);
  }
}
