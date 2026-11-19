import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';
import { TERMS_NOT_ACCEPTED_REASON } from '@domain/entities/peer-assignment-composition';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { fechaEcuador } from '@shared/utils/fecha-ecuador.util';
import { LoadPendingPeerAssignmentProtocolsUseCase } from '../../../application/load-pending-peer-assignment-protocols.use-case';

type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Ruta de la lista; el formulario de un protocolo es `{ruta}/{protocolId}` (F03 §3). */
export const ASSIGNMENT_LIST_ROUTE = '/dashboard/evaluations/assignment';

interface Fila {
  id: number;
  codigo: string | null;
  titulo: string;
  investigador: string;
  tipoEstudio: string;
  recepcion: string;
  /** Motivo por el que «Asignar» está deshabilitado, o null. */
  motivo: string | null;
  ariaLabel: string;
}

/**
 * Lista «Asignar evaluadores» de la Presidenta (F03 D2): protocolos de
 * `GET /evaluations/protocols/pending-peer-assignment`, sin datos inventados.
 */
@Component({
  selector: 'app-peer-assignment-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './peer-assignment-list.page.html',
  styleUrl: './peer-assignment-list.page.scss',
})
export class PeerAssignmentListPage implements OnInit {
  private readonly loadPending = inject(LoadPendingPeerAssignmentProtocolsUseCase);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly estado = signal<EstadoCarga>('cargando');
  private readonly protocolos = signal<PendingPeerAssignmentProtocol[]>([]);

  readonly filas = computed<Fila[]>(() =>
    this.protocolos().map((p) => {
      const titulo = p.title ?? 'Sin título';
      return {
        id: p.id,
        codigo: p.ceishCode,
        titulo,
        investigador: p.principalInvestigator ?? 'Sin investigador principal',
        tipoEstudio: p.studyType ?? 'Sin tipo de estudio',
        recepcion: fechaEcuador(p.receptionDate) ?? 'Sin fecha',
        motivo: p.isTimelineTermsAccepted === false ? TERMS_NOT_ACCEPTED_REASON : null,
        ariaLabel: `Asignar evaluadores a ${p.ceishCode ?? titulo}`,
      };
    }),
  );

  ngOnInit(): void {
    this.cargar();
  }

  /** Carga la lista; también se llama al reintentar. */
  cargar(): void {
    this.estado.set('cargando');
    this.loadPending
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.protocolos.set(list);
          this.estado.set('listo');
        },
        error: () => this.estado.set('error'),
      });
  }

  asignar(fila: Fila): void {
    if (fila.motivo) return;
    void this.router.navigate([ASSIGNMENT_LIST_ROUTE, fila.id]);
  }
}
