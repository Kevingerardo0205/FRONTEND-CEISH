import { CommonModule } from '@angular/common';
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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import {
  CartaVersion,
  ConvocatoriaContexto,
  ResultadoPleno,
  ResumenDictamenes,
} from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { mensajeDeErrorResolucion } from '@infrastructure/mappers/resolucion-contexto.mapper';
import {
  SubirCartaFirmadaUseCase,
  validarArchivoCarta,
} from '../../../application/subir-carta-firmada.use-case';

/** Texto fijo que muestra la etapa cuando el protocolo nunca pasó por el pleno. */
export const SIN_SESION_PLENO = 'Este protocolo aún no ha pasado por una sesión del pleno.';

const ETIQUETAS_RESULTADO: Readonly<Record<ResultadoPleno, string>> = {
  APROBADO_DEFINITIVO: 'Aprobado definitivo',
  APROBADO_CON_CONDICION: 'Aprobado con condición',
  NO_APROBADO: 'No aprobado',
};

/** Textos de la etapa (decisiones del 27/11/2026, ver specs/F11-vista-por-rol/tasks.md, EP7). */
export const TEXTO_RESOLVIENDO =
  'El comité está resolviendo su protocolo. El resultado se publicará cuando la Secretaría suba la carta firmada.';
export const TEXTO_PENDIENTE =
  'El resultado del pleno aún no está disponible: hay evaluaciones pendientes de dictamen.';
export const TEXTO_LEGACY =
  'Este protocolo ya tiene una resolución emitida con el flujo anterior y no admite una carta firmada nueva.';
export const TEXTO_NO_SUBIDA = 'Por ahora no se puede subir la carta de esta convocatoria.';
export const AVISO_INMUTABLE =
  'Calculado automáticamente a partir de los dictámenes de los evaluadores. No se puede modificar.';
export const TEXTO_REUNION_FUTURA = 'La reunión de esta convocatoria aún no se ha realizado.';

type EstadoCarga = 'cargando' | 'listo' | 'vacio' | 'error';

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

/**
 * Etapa Resolución del espacio de trabajo (EP7). Lee el contexto del backend y muestra solo
 * lo que el backend permite: el botón de subir depende de `puedeSubirCarta`. El resultado del pleno
 * es de solo lectura: lo calcula el backend.
 * Trabaja con la convocatoria más reciente; las anteriores son historial de pleno (solo lectura).
 */
@Component({
  selector: 'app-resolution-stage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="resolucion-etapa" data-stage="RESOLUCION">
      <header class="resolucion-etapa__header">
        <p class="resolucion-etapa__eyebrow">Apartado del expediente</p>
        <h2>Resolución</h2>
      </header>

      @switch (estado()) {
        @case ('cargando') {
          <p role="status">Cargando información…</p>
        }
        @case ('error') {
          <p role="alert">{{ mensajeError() }}</p>
        }
        @case ('vacio') {
          <p role="status" data-testid="sin-sesion-pleno">{{ sinSesion }}</p>
        }
        @case ('listo') {
          @if (actual(); as c) {
            <article class="resolucion-etapa__convocatoria" [attr.data-convocatoria]="c.numeroConvocatoria">
              <h3>Convocatoria {{ c.numeroConvocatoria }}</h3>
              <dl class="resolucion-etapa__datos">
                <dt>Fecha de reunión</dt>
                <dd>{{ (c.fechaReunion | date: 'dd/MM/yyyy' : 'America/Guayaquil') ?? 'Sin fecha' }}</dd>
                <dt>Versión evaluada</dt>
                <dd>{{ c.versionEvaluada }}</dd>
              </dl>

              <section class="resolucion-etapa__resultado">
                <h4>Resultado del pleno</h4>
                @if (puedeVerHistorial()) {
                  <p class="resolucion-etapa__texto" data-testid="aviso-inmutable"><em>{{ avisoInmutable }}</em></p>
                }
                <p data-testid="resultado">{{ textoResultado(c) }}</p>
                @if (c.anexoEsperado) {
                  <p data-testid="anexo-esperado">Anexo de la carta: <strong>{{ c.anexoEsperado }}</strong></p>
                }
                @if (resumenVisible(c); as r) {
                  <p data-testid="resumen-dictamenes">
                    Dictámenes: {{ r.aprobado }} aprobados · {{ r.conCondicion }} con condición ·
                    {{ r.noAprobado }} no aprobados · {{ r.pendientes }} pendientes.
                  </p>
                }
                @if (reunionFutura(c)) {
                  <p class="resolucion-etapa__texto" data-testid="reunion-pendiente">{{ textoReunionFutura }}</p>
                }
              </section>

              @if (puedeVerMotivo()) {
                @if (c.resultado && c.motivo) {
                  <p class="resolucion-etapa__texto"><strong>Motivo:</strong> {{ c.motivo }}</p>
                }
                @if (c.resultado && c.observaciones) {
                  <p class="resolucion-etapa__texto"><strong>Observaciones:</strong> {{ c.observaciones }}</p>
                }
              }

              @if (c.cartaVigente; as carta) {
                <div class="resolucion-etapa__carta" data-testid="carta-vigente">
                  <p>
                    <strong>Carta vigente:</strong> versión {{ carta.numeroVersion }} · {{ carta.anexoCodigo }} ·
                    subida el {{ carta.subidoEn | date: 'dd/MM/yyyy HH:mm' : 'America/Guayaquil' }}
                  </p>
                  <button type="button" class="resolucion-etapa__boton" (click)="descargarCarta(carta.claveArchivo)">
                    Descargar carta
                  </button>
                </div>
              } @else {
                <p class="resolucion-etapa__texto">Sin carta firmada vigente.</p>
              }

              @if (esSecretaria() && c.puedeSubirCarta) {
                <form class="resolucion-etapa__form" (submit)="$event.preventDefault(); subirCarta(c)">
                  <h4>{{ c.cartaVigente ? 'Reemplazar carta firmada' : 'Subir carta firmada' }}</h4>
                  <p class="resolucion-etapa__texto">
                    Anexo a subir: <strong>{{ c.anexoEsperado }}</strong>. Solo PDF, hasta 10 MB.
                  </p>
                  <label>
                    Archivo PDF
                    <input type="file" accept="application/pdf,.pdf" (change)="seleccionarArchivo($event)" data-testid="input-archivo" />
                  </label>
                  @if (c.cartaVigente) {
                    <label>
                      Motivo del reemplazo (obligatorio)
                      <textarea [formControl]="motivoReemplazo" rows="3" maxlength="2000"></textarea>
                    </label>
                  }
                  <button type="submit" class="resolucion-etapa__boton" [disabled]="ocupado()">
                    {{ ocupado() ? 'Subiendo…' : 'Subir carta' }}
                  </button>
                </form>
              } @else if (esSecretaria() && !motivoSubidaVisible(c)) {
                <p class="resolucion-etapa__texto" data-testid="sin-subida">{{ textoNoSubida }}</p>
              }

              @if (aviso(); as a) {
                <p [attr.role]="a.tipo === 'error' ? 'alert' : 'status'" class="resolucion-etapa__aviso">{{ a.texto }}</p>
              }
            </article>

            @if (puedeVerHistorial()) {
              <section class="resolucion-etapa__historial" aria-labelledby="historial-titulo">
                <h3 id="historial-titulo">Historial de versiones</h3>
                @if (historial().length === 0) {
                  <p role="status">Sin versiones de carta registradas.</p>
                } @else {
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Versión</th>
                        <th scope="col">Anexo</th>
                        <th scope="col">Resultado</th>
                        <th scope="col">Subida</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Motivo del reemplazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (v of historial(); track v.id) {
                        <tr>
                          <td>{{ v.numeroVersion }}</td>
                          <td>{{ v.anexoCodigo }}</td>
                          <td>{{ etiquetaResultado(v.resultado) }}</td>
                          <td>{{ v.subidoEn | date: 'dd/MM/yyyy HH:mm' : 'America/Guayaquil' }}</td>
                          <td>{{ v.vigente ? 'Vigente' : 'Reemplazada' }}</td>
                          <td>{{ v.motivoReemplazo ?? '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </section>
            }

            @if (anteriores().length > 0) {
              <section class="resolucion-etapa__historial" aria-labelledby="anteriores-titulo">
                <h3 id="anteriores-titulo">Sesiones anteriores del pleno</h3>
                <ul>
                  @for (a of anteriores(); track a.convocatoriaProtocoloId) {
                    <li>
                      Convocatoria {{ a.numeroConvocatoria }}
                      @if (a.resultado) {
                        · {{ etiquetaResultado(a.resultado) }}
                      }
                    </li>
                  }
                </ul>
              </section>
            }
          }
        }
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .resolucion-etapa { padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--c-border); border-radius: var(--radius-card); background: var(--c-surface); color: var(--c-text); }
    .resolucion-etapa__header { margin-bottom: 1.5rem; }
    .resolucion-etapa__eyebrow { margin: 0 0 .25rem; color: var(--c-text-2); font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
    h2, h3, h4 { margin: 0 0 .5rem; color: var(--c-text); }
    .resolucion-etapa__datos { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; margin: 0 0 1rem; }
    .resolucion-etapa__datos dt { color: var(--c-text-2); }
    .resolucion-etapa__datos dd { margin: 0; }
    .resolucion-etapa__texto { color: var(--c-text-2); }
    .resolucion-etapa__carta { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; margin-bottom: 1rem; }
    .resolucion-etapa__resultado { margin: 0 0 1rem; padding: .75rem 1rem; border: 1px solid var(--c-border); border-radius: var(--radius-card); }
    .resolucion-etapa__resultado p { margin: 0 0 .5rem; }
    .resolucion-etapa__form { display: grid; gap: .75rem; margin: 1rem 0; padding: 1rem; border: 1px solid var(--c-border); border-radius: var(--radius-card); }
    .resolucion-etapa__form label { display: grid; gap: .25rem; }
    .resolucion-etapa__boton { justify-self: start; padding: .5rem 1rem; border: 1px solid var(--c-primary); border-radius: var(--radius-card); background: var(--c-primary); color: var(--c-surface); cursor: pointer; }
    .resolucion-etapa__boton:disabled { opacity: .6; cursor: default; }
    .resolucion-etapa__aviso { margin-top: .75rem; font-weight: 600; }
    .resolucion-etapa__historial { margin-top: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .4rem .5rem; border-bottom: 1px solid var(--c-border); text-align: left; }
  `,
})
export class ResolutionStagePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly port = inject(IResolucionContextoPort);
  private readonly activeRole = inject(ActiveRoleFacade);
  private readonly subirUseCase = inject(SubirCartaFirmadaUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly sinSesion = SIN_SESION_PLENO;
  readonly estado = signal<EstadoCarga>('cargando');
  readonly mensajeError = signal('');
  readonly convocatorias = signal<ConvocatoriaContexto[]>([]);
  readonly historial = signal<CartaVersion[]>([]);
  readonly ocupado = signal(false);
  readonly aviso = signal<Aviso | null>(null);
  private protocolId = '';
  private archivo: File | null = null;

  /** Convocatoria más reciente: la que se trabaja. */
  readonly actual = computed(() => this.convocatorias()[0] ?? null);
  /** Las demás convocatorias del protocolo, solo lectura. */
  readonly anteriores = computed(() => this.convocatorias().slice(1));

  readonly esSecretaria = computed(() => this.activeRole.activeRole() === 'SECRETARIA');
  /** RESOLUCION_HISTORIAL: SECRETARIA y PRESIDENTE. El investigador nunca ve motivo ni historial. */
  readonly puedeVerHistorial = computed(() => {
    const rol = this.activeRole.activeRole();
    return rol === 'SECRETARIA' || rol === 'PRESIDENTE';
  });
  readonly puedeVerMotivo = this.puedeVerHistorial;

  readonly motivoReemplazo = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    const parent = this.route.parent;
    (parent?.paramMap ?? this.route.paramMap)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.protocolId = params.get('id') ?? '';
        this.cargarContexto();
      });
  }

  readonly avisoInmutable = AVISO_INMUTABLE;
  readonly textoNoSubida = TEXTO_NO_SUBIDA;
  readonly textoReunionFutura = TEXTO_REUNION_FUTURA;

  etiquetaResultado(resultado: ResultadoPleno | null | undefined): string {
    return resultado ? ETIQUETAS_RESULTADO[resultado] : 'Sin resultado registrado';
  }

  /**
   * Texto del resultado según el estado y el rol. El investigador nunca ve el cálculo ni el resumen:
   * sin carta vigente ve solo que el comité está resolviendo.
   */
  textoResultado(c: ConvocatoriaContexto): string {
    if (!this.puedeVerHistorial()) {
      return c.cartaVigente && c.resultado ? `Resultado: ${ETIQUETAS_RESULTADO[c.resultado]}.` : TEXTO_RESOLVIENDO;
    }
    if (c.estadoResultado === 'RESUELTO_LEGACY') return TEXTO_LEGACY;
    if (c.estadoResultado === 'CONGELADO' && c.cartaVigente === null) {
      return c.resueltoEnConvocatoria
        ? `Resuelto en la convocatoria ${c.resueltoEnConvocatoria}.`
        : 'Resultado congelado.';
    }
    if (!c.resultado) return TEXTO_PENDIENTE;
    const etiqueta = ETIQUETAS_RESULTADO[c.resultado];
    return c.estadoResultado === 'CONGELADO'
      ? `Resultado congelado: ${etiqueta}.`
      : `Resultado calculado: ${etiqueta}.`;
  }

  /** Resumen por conteos (B8): solo con cálculo listo y para quien tiene RESOLUCION_HISTORIAL. */
  resumenVisible(c: ConvocatoriaContexto): ResumenDictamenes | null {
    return this.puedeVerHistorial() && c.estadoResultado === 'CALCULADO' ? (c.resumenDictamenes ?? null) : null;
  }

  /** La reunión aún no se ha realizado. Se compara el instante con la hora actual, válido para Ecuador. */
  reunionFutura(c: ConvocatoriaContexto): boolean {
    return c.fechaReunion !== null && Date.parse(c.fechaReunion) > Date.now();
  }

  /** Sin subida permitida, el mensaje genérico solo se muestra si el motivo no se ve ya en la etapa. */
  motivoSubidaVisible(c: ConvocatoriaContexto): boolean {
    return this.reunionFutura(c) || (c.resueltoEnConvocatoria !== null && c.cartaVigente === null);
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
  }

  subirCarta(c: ConvocatoriaContexto): void {
    if (!this.archivo) {
      this.aviso.set({ tipo: 'error', texto: 'Seleccione un archivo PDF.' });
      return;
    }
    const errorArchivo = validarArchivoCarta(this.archivo);
    if (errorArchivo) {
      this.aviso.set({ tipo: 'error', texto: errorArchivo });
      return;
    }
    if (!c.anexoEsperado) {
      this.aviso.set({ tipo: 'error', texto: 'No hay anexo esperado para esta convocatoria.' });
      return;
    }
    this.ocupado.set(true);
    this.aviso.set(null);
    this.subirUseCase
      .execute({
        convocatoriaId: c.convocatoriaId,
        convocatoriaProtocoloId: c.convocatoriaProtocoloId,
        archivo: this.archivo,
        hayCartaVigente: c.cartaVigente !== null,
        motivoReemplazo: this.motivoReemplazo.value,
      })
      .subscribe({
        next: () => {
          this.ocupado.set(false);
          this.archivo = null;
          this.motivoReemplazo.reset('');
          this.aviso.set({ tipo: 'ok', texto: 'La carta se registró correctamente.' });
          this.cargarContexto();
        },
        error: (error: unknown) => {
          this.ocupado.set(false);
          this.aviso.set({ tipo: 'error', texto: mensajeDeErrorResolucion(error) });
        },
      });
  }

  descargarCarta(claveArchivo: string): void {
    this.port.urlDescargaCarta(claveArchivo).subscribe({
      next: (url) => window.open(url, '_blank', 'noopener'),
      error: (error: unknown) => this.aviso.set({ tipo: 'error', texto: mensajeDeErrorResolucion(error) }),
    });
  }

  private cargarContexto(): void {
    if (!/^\d+$/.test(this.protocolId)) {
      this.estado.set('error');
      this.mensajeError.set('ID de protocolo inválido');
      return;
    }
    this.estado.set('cargando');
    this.port.obtenerContexto(this.protocolId).subscribe({
      next: (lista) => {
        this.convocatorias.set(lista);
        this.estado.set(lista.length === 0 ? 'vacio' : 'listo');
        this.cargarHistorial();
      },
      error: (error: unknown) => {
        this.estado.set('error');
        this.mensajeError.set(mensajeDeErrorResolucion(error));
      },
    });
  }

  private cargarHistorial(): void {
    const c = this.actual();
    if (!c || !this.puedeVerHistorial()) {
      this.historial.set([]);
      return;
    }
    this.port.listarCartas(c.convocatoriaId, c.convocatoriaProtocoloId).subscribe({
      next: (versiones) => this.historial.set(versiones),
      error: (error: unknown) => this.aviso.set({ tipo: 'error', texto: mensajeDeErrorResolucion(error) }),
    });
  }
}
