import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { NextMeeting } from '@domain/entities/meeting.entity';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import {
  FiltroPendientes,
  PendienteItem,
  TotalesPendientes,
} from '../domain/pendiente.model';
import { PendientesPort } from '../domain/pendientes.port';

export type EstadoBloque = 'cargando' | 'listo' | 'error';

/** Estado de un bloque de la página: cada uno carga, falla y se reintenta por su cuenta. */
export interface Bloque<T> {
  estado: EstadoBloque;
  datos: T | null;
}

export interface CabeceraPendientes {
  /** `YYYY-MM-DD`. */
  fechaReferencia: string;
  totales: TotalesPendientes;
}

const CARGANDO = { estado: 'cargando', datos: null } as const;
const ERROR = { estado: 'error', datos: null } as const;

/**
 * Fachada de Mis pendientes (spec-ui §3.1 y §5.5; plan §2.2). Se provee en la página (una
 * instancia por visita, plan §3). La reunión y los pendientes se piden por separado: un error
 * en uno no toca al otro. Un filtro nuevo cancela la petición anterior (`switchMap`).
 */
@Injectable()
export class MisPendientesFacade {
  private readonly pendientesPort = inject(PendientesPort);
  private readonly meetings = inject(IMeetingRepositoryPort);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pedirPendientes$ = new Subject<FiltroPendientes>();
  private readonly pedirReunion$ = new Subject<void>();

  readonly filtro = signal<FiltroPendientes>('todos');
  readonly pendientes = signal<Bloque<PendienteItem[]>>(CARGANDO);
  /** Totales y fecha de la última respuesta. No dependen del filtro (RF-ALR.f.3). */
  readonly cabecera = signal<CabeceraPendientes | null>(null);
  /** `datos: null` con `estado: 'listo'` = no hay reunión programada. */
  readonly reunion = signal<Bloque<NextMeeting>>(CARGANDO);

  constructor() {
    this.pedirPendientes$
      .pipe(
        switchMap((filtro) =>
          this.pendientesPort.obtener(filtro).pipe(
            map((r) => ({ bloque: { estado: 'listo' as const, datos: r.items }, cabecera: r })),
            catchError(() => of({ bloque: ERROR, cabecera: null })),
            startWith(null),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => {
        if (r === null) {
          // Cargando: los totales de la respuesta anterior se conservan.
          this.pendientes.set(CARGANDO);
          return;
        }
        this.pendientes.set(r.bloque);
        this.cabecera.set(
          r.cabecera && { fechaReferencia: r.cabecera.fechaReferencia, totales: r.cabecera.totales },
        );
        if (r.bloque.datos) avisarAccionesDesconocidas(r.bloque.datos);
      });

    this.pedirReunion$
      .pipe(
        switchMap(() => conEstado(this.meetings.next())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((b) => this.reunion.set(b));
  }

  /** Carga inicial de los dos bloques. */
  iniciar(): void {
    this.pedirReunion$.next();
    this.pedirPendientes$.next(this.filtro());
  }

  cambiarFiltro(filtro: FiltroPendientes): void {
    this.filtro.set(filtro);
    this.pedirPendientes$.next(filtro);
  }

  reintentarPendientes(): void {
    this.pedirPendientes$.next(this.filtro());
  }

  reintentarReunion(): void {
    this.pedirReunion$.next();
  }
}

function conEstado<T>(fuente: Observable<T | null>): Observable<Bloque<T>> {
  return fuente.pipe(
    map((datos) => ({ estado: 'listo' as const, datos })),
    catchError(() => of<Bloque<T>>(ERROR)),
    startWith<Bloque<T>>(CARGANDO),
  );
}

/** spec-ui §3.1.1: una acción fuera de VALIDAR, ASIGNAR y REASIGNAR se muestra sin botón y se registra. */
function avisarAccionesDesconocidas(items: PendienteItem[]): void {
  const sinAccion = items.filter((i) => i.accion === null).map((i) => i.protocolId);
  if (sinAccion.length > 0) {
    console.warn('Mis pendientes: filas con una acción desconocida (sin botón):', sinAccion);
  }
}
