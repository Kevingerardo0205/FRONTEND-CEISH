import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';
import { LoadPendingPeerAssignmentProtocolsUseCase } from '@features/evaluations/application/load-pending-peer-assignment-protocols.use-case';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { PeerRiskPendingTableComponent } from '../../components/peer-risk-pending-table/peer-risk-pending-table.component';
import { toPendingPeerProtocols } from '../../utils/pending-peer-protocol.util';

type EstadoCarga = 'cargando' | 'listo' | 'error';

/**
 * Bandeja "Estratificación de Riesgo" en su ruta propia temporal, /estratificacion-riesgo
 * (F01 T01-0, spec-ui D2). Antes vivía en la pestaña PEERS de DashboardSecretariaPage, que se
 * abría con /pendientes?tab=peers. Temporal hasta F03 (Asignación); no está en el menú.
 */
@Component({
  selector: 'app-peer-risk-pending-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PeerRiskPendingTableComponent,
  ],
  templateUrl: './peer-risk-pending.page.html',
  styleUrl: './peer-risk-pending.page.scss',
})
export class PeerRiskPendingPage implements OnInit {
  private readonly loadPendingPeerProtocols = inject(LoadPendingPeerAssignmentProtocolsUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly estado = signal<EstadoCarga>('cargando');
  readonly protocolos = signal<PendingPeerAssignmentProtocol[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  /** Carga la bandeja; también se llama al reintentar y después de asignar pares. */
  cargar(): void {
    this.estado.set('cargando');
    this.loadPendingPeerProtocols
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.protocolos.set(toPendingPeerProtocols(Array.isArray(list) ? list : []));
          this.estado.set('listo');
        },
        error: () => this.estado.set('error'),
      });
  }
}
