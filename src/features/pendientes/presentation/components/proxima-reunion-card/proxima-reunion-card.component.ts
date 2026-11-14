import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NextMeeting } from '@domain/entities/meeting.entity';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { fechaHoraEcuador } from '@shared/utils/fecha-ecuador.util';
import { EstadoBloque } from '../../../application/mis-pendientes.facade';

const TIPO_SESION: Record<NextMeeting['tipoSesion'], string> = {
  ORDINARIA: 'Ordinaria',
  EXTRAORDINARIA: 'Extraordinaria',
};

/**
 * Tarjeta "Próxima reunión" (spec-ui §3.1 zona 3, C1; §5.5). Sin línea de informes:
 * `informesATratar` es siempre null (RF-ALR.f.7). El enlace de la reunión ya viene validado
 * (`safeHttpUrl` en el mapper, solo http/https) y se abre en otra pestaña con `noopener`.
 */
@Component({
  selector: 'app-proxima-reunion-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './proxima-reunion-card.component.html',
  styleUrl: './proxima-reunion-card.component.scss',
})
export class ProximaReunionCardComponent {
  readonly estado = input.required<EstadoBloque>();
  readonly reunion = input<NextMeeting | null>(null);
  readonly reintentar = output<void>();

  readonly tipo = computed(() => {
    const r = this.reunion();
    return r ? TIPO_SESION[r.tipoSesion] : '';
  });
  readonly fecha = computed(
    () => fechaHoraEcuador(this.reunion()?.fechaReunion) ?? 'Fecha no disponible',
  );
  readonly protocolos = computed(() => {
    const n = this.reunion()?.protocolosATratar ?? 0;
    return n === 1 ? '1 protocolo a tratar' : `${n} protocolos a tratar`;
  });
}
