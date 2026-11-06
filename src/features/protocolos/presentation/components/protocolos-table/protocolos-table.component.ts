import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusChipComponent } from '@shared/ui/status-chip/status-chip.component';
import { ProtocolListItem } from '../../../domain/protocol-list-item.model';

/**
 * Tabla de Protocolos (spec-ui §3.2 punto 5): Protocolo, Investigador principal y Etapa.
 * Sin columna Estado (D4), sin "›" y sin la nota "Clic en una fila…" (C5): las filas no navegan.
 */
@Component({
  selector: 'app-protocolos-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent],
  template: `
    <div class="protocolos">
      <div class="protocolos__scroll">
        <table class="protocolos__tabla">
          <caption class="visually-hidden">Protocolos</caption>
          <thead>
            <tr>
              <th scope="col">Protocolo</th>
              <th scope="col">Investigador principal</th>
              <th scope="col">Etapa</th>
            </tr>
          </thead>
          <tbody>
            @for (p of items(); track p.id) {
              <tr>
                <td>
                  <div class="protocolos__protocolo">
                    <span class="protocolos__codigo">{{ p.ceishCode ?? 'Sin código' }}</span>
                    <span class="protocolos__titulo">{{ p.title }}</span>
                  </div>
                </td>
                <td class="protocolos__investigador">
                  {{ p.principalInvestigator?.fullName ?? 'Sin investigador principal' }}
                </td>
                <td>
                  <app-status-chip tone="gris" [label]="p.etapa?.label ?? 'Etapa no reconocida'" />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrl: './protocolos-table.component.scss',
})
export class ProtocolosTableComponent {
  readonly items = input.required<ProtocolListItem[]>();
}
