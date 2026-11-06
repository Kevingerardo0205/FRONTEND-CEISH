import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';
import { ButtonGroupComponent, ButtonGroupOption } from '@shared/ui/button-group/button-group.component';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { fechaCalendario } from '@shared/utils/fecha-ecuador.util';
import { MisPendientesFacade } from '../application/mis-pendientes.facade';
import { FILTROS_PENDIENTES, FiltroPendientes } from '../domain/pendiente.model';
import { PendientesTableComponent } from './components/pendientes-table/pendientes-table.component';
import { ProximaReunionCardComponent } from './components/proxima-reunion-card/proxima-reunion-card.component';

const ETIQUETAS: Record<FiltroPendientes, string> = {
  todos: 'Todos',
  vencidos: 'Vencidos',
  hoy: 'Hoy',
  semana: 'Esta semana',
};

/**
 * Mis pendientes, inicio de la Secretaría en /pendientes (F01 T01-5, spec-ui §3.1).
 * Encabezado, tarjeta "Próxima reunión" arriba (C1), filtros y tabla. Cada bloque carga, falla y
 * se reintenta por su cuenta (§5.5). El filtro no va en la URL (D7).
 */
@Component({
  selector: 'app-mis-pendientes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ProximaReunionCardComponent,
    ButtonGroupComponent,
    PendientesTableComponent,
  ],
  providers: [MisPendientesFacade],
  templateUrl: './mis-pendientes.page.html',
  styleUrl: './mis-pendientes.page.scss',
})
export class MisPendientesPage implements OnInit {
  readonly facade = inject(MisPendientesFacade);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** C7: sin "Buenos días". Mientras cargan los totales, "Mis pendientes". */
  readonly titulo = computed(() => {
    const n = this.facade.cabecera()?.totales.todos;
    if (n === undefined) return 'Mis pendientes';
    if (n === 0) return 'No tiene pendientes';
    return n === 1 ? 'Tiene 1 pendiente' : `Tiene ${n} pendientes`;
  });

  /** La fecha se arma partiendo `YYYY-MM-DD`, sin `new Date()` (§5.4). */
  readonly subtitulo = computed(() => {
    const cabecera = this.facade.cabecera();
    if (!cabecera) return undefined;
    const fecha = fechaCalendario(cabecera.fechaReferencia) ?? 'Fecha no disponible';
    return `Al ${fecha} · Empiece por los vencidos.`;
  });

  /** Conteos de `totales` (no dependen del filtro); sin conteo mientras cargan o si fallan. */
  readonly opciones = computed<ButtonGroupOption[]>(() => {
    const totales = this.facade.cabecera()?.totales;
    return FILTROS_PENDIENTES.map((id) => ({
      id,
      label: totales ? `${ETIQUETAS[id]} · ${totales[id]}` : ETIQUETAS[id],
    }));
  });

  constructor() {
    // §5.6.3: al entrar, el foco va al h1.
    afterNextRender(() => {
      const h1 = this.host.nativeElement.querySelector<HTMLElement>('h1');
      if (!h1) return;
      h1.setAttribute('tabindex', '-1');
      h1.focus();
    });
  }

  ngOnInit(): void {
    this.facade.iniciar();
  }

  cambiarFiltro(id: string): void {
    const filtro = FILTROS_PENDIENTES.find((f) => f === id);
    if (filtro && filtro !== this.facade.filtro()) this.facade.cambiarFiltro(filtro);
  }
}
