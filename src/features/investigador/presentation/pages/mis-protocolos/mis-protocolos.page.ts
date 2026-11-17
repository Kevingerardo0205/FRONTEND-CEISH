import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { ProtocoloResumen } from '../../../domain/dtos/crear-protocolo.dto';
import {
  ACEPTAR_TIEMPOS_ERROR,
  agruparMisProtocolos,
  esInvestigadorPrincipal,
  etiquetaRecepcion,
  etiquetaExistente,
  fechaAceptacion,
  filaComite,
  textoAceptacion,
  textoDocumentosBorrador,
  textoObservados,
  textoPlazoCorreccion,
} from '../../../domain/mis-protocolos.rules';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { resolveEstado } from '@shared/utils/estado.resolver';
import { extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import { StatusChipComponent } from '@shared/ui/status-chip/status-chip.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';

type EstadoCarga = 'cargando' | 'error' | 'listo';

/** Mis protocolos del investigador (F09 D20 a D26, MP1). */
@Component({
  selector: 'app-mis-protocolos',
  standalone: true,
  imports: [
    RouterLink,
    StatusChipComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-protocolos.page.html',
  styleUrl: './mis-protocolos.page.scss',
})
export class MisProtocolosPage implements OnInit {
  private readonly protocoloService = inject(ProtocoloService);
  private readonly protocolRepo = inject(IProtocolRepositoryPort);
  private readonly notificationBroker = inject(NotificationBrokerService);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly recargar$ = new Subject<void>();

  readonly estado = signal<EstadoCarga>('cargando');
  readonly protocolos = signal<readonly ProtocoloResumen[]>([]);
  /** Aceptados en esta visita: id → fecha en hora de Ecuador (D23). Se pierde al recargar. */
  readonly aceptados = signal<ReadonlyMap<number, string>>(new Map());
  /** Casillas de la aceptación marcadas, por id. */
  readonly casillas = signal<ReadonlySet<number>>(new Set());
  readonly aceptando = signal<number | null>(null);
  readonly erroresAceptacion = signal<ReadonlyMap<number, string>>(new Map());

  readonly grupos = computed(() =>
    agruparMisProtocolos(this.protocolos(), new Set(this.aceptados().keys())),
  );

  private readonly usuarioId = computed(() => {
    const id = Number(this.authFacade.currentUser()?.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  });

  // Reglas puras para la plantilla.
  readonly textoDocumentosBorrador = textoDocumentosBorrador;
  readonly textoObservados = textoObservados;
  readonly textoPlazoCorreccion = textoPlazoCorreccion;
  readonly textoAceptacion = textoAceptacion;
  readonly filaComite = filaComite;
  readonly etiquetaExistente = etiquetaExistente;
  readonly etiquetaRecepcion = etiquetaRecepcion;

  constructor() {
    this.recargar$
      .pipe(
        switchMap(() =>
          this.protocoloService.obtenerMisProtocolos().pipe(
            map((lista) => ({ ok: true as const, lista })),
            catchError(() => of({ ok: false as const })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => {
        if (resultado.ok) {
          this.protocolos.set(resultado.lista);
          this.estado.set('listo');
        } else if (this.estado() !== 'listo') {
          // Con una lista en pantalla, una recarga en segundo plano que falla la conserva (D25).
          this.estado.set('error');
        }
      });
  }

  ngOnInit(): void {
    this.cargar();
    this.notificationBroker
      .on('PROTOCOL_STATUS_UPDATED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());
  }

  /** Pide la lista; `Cargando` solo si todavía no hay una (D25). */
  cargar(): void {
    if (this.estado() !== 'listo') this.estado.set('cargando');
    this.recargar$.next();
  }

  esPrincipal(p: ProtocoloResumen): boolean {
    return esInvestigadorPrincipal(p, this.usuarioId());
  }

  cambiarCasilla(id: number, evento: Event): void {
    const marcada = (evento.target as HTMLInputElement).checked;
    const casillas = new Set(this.casillas());
    if (marcada) casillas.add(id);
    else casillas.delete(id);
    this.casillas.set(casillas);
  }

  aceptarTiempos(p: ProtocoloResumen): void {
    if (!this.casillas().has(p.id) || this.aceptando() !== null || !this.esPrincipal(p)) return;
    this.aceptando.set(p.id);
    this.quitarError(p.id);
    this.protocolRepo
      .acceptTimeline(String(p.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          const aceptados = new Map(this.aceptados());
          aceptados.set(p.id, fechaAceptacion(respuesta, new Date()));
          this.aceptados.set(aceptados);
          this.aceptando.set(null);
          // El botón desaparece: el foco pasa al mensaje para no perderse (D23).
          afterNextRender(
            () => this.host.nativeElement.querySelector<HTMLElement>(`#mp-aceptado-${p.id}`)?.focus(),
            { injector: this.injector },
          );
        },
        error: (err: unknown) => {
          const errores = new Map(this.erroresAceptacion());
          errores.set(p.id, extractApiErrorMessage(err, ACEPTAR_TIEMPOS_ERROR));
          this.erroresAceptacion.set(errores);
          this.aceptando.set(null);
        },
      });
  }

  /** `Ver y corregir` y `Subir correcciones` (D22, D26): mismo destino que el menú anterior. */
  onSubirCorrecciones(p: ProtocoloResumen): void {
    const isVersion1 = (p.versionNumber || 1) === 1;
    const code = resolveEstado(p.estado)?.code ?? p.estado;
    if (isVersion1 && (code === 'REQUIERE_SUBSANACION_DOC' || code === 'INCOMPLETO')) {
      this.router.navigate(['/dashboard/protocols/workspace', p.id, 'validation']);
    } else {
      this.router.navigate(['/dashboard/evaluacion-etica/subsanaciones'], {
        queryParams: { protocolId: p.id },
      });
    }
  }

  private quitarError(id: number): void {
    if (!this.erroresAceptacion().has(id)) return;
    const errores = new Map(this.erroresAceptacion());
    errores.delete(id);
    this.erroresAceptacion.set(errores);
  }
}
