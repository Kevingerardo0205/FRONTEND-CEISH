import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { ProtocolListQuery, ProtocolListResult } from '../domain/protocol-list-item.model';
import { ProtocolosListPort } from '../domain/protocolos-list.port';

export type EstadoProtocolos =
  | { estado: 'cargando'; datos: null }
  | { estado: 'listo'; datos: ProtocolListResult }
  | { estado: 'error'; datos: null };

/**
 * Fachada de Protocolos (spec-ui §3.2 y §5.5; plan §2.3). Se provee en la página (plan §3).
 * Recibe la consulta ya validada (`queryDesdeUrl`); una consulta nueva cancela la anterior
 * (`switchMap`). El error se muestra como error, nunca como lista vacía.
 */
@Injectable()
export class ProtocolosFacade {
  private readonly port = inject(ProtocolosListPort);
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas$ = new Subject<ProtocolListQuery>();
  private ultima: ProtocolListQuery | null = null;

  readonly estado = signal<EstadoProtocolos>({ estado: 'cargando', datos: null });

  constructor() {
    this.consultas$
      .pipe(
        switchMap((q) =>
          this.port.listar(q).pipe(
            map((datos): EstadoProtocolos => ({ estado: 'listo', datos })),
            catchError(() => of<EstadoProtocolos>({ estado: 'error', datos: null })),
            startWith<EstadoProtocolos>({ estado: 'cargando', datos: null }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.estado.set(e));
  }

  cargar(q: ProtocolListQuery): void {
    this.ultima = q;
    this.consultas$.next(q);
  }

  reintentar(): void {
    if (this.ultima) this.consultas$.next(this.ultima);
  }
}
