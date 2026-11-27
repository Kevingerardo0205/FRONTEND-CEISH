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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import {
  CartaVersion,
  ConvocatoriaContexto,
  ResultadoPleno,
} from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { mensajeDeErrorResolucion } from '@infrastructure/mappers/resolucion-contexto.mapper';
import { RegistrarResultadoPlenoUseCase } from '../../../application/registrar-resultado-pleno.use-case';
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

type EstadoCarga = 'cargando' | 'listo' | 'vacio' | 'error';

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

/**
 * Etapa Resolución del espacio de trabajo (EP7). Lee el contexto del backend y muestra solo
 * lo que el backend permite: los botones dependen de `puedeRegistrarResultado` y `puedeSubirCarta`.
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
                <dt>Resultado del pleno</dt>
                <dd data-testid="resultado">{{ etiquetaResultado(c.resultado) }}</dd>
                @if (c.anexoEsperado) {
                  <dt>Anexo de la carta</dt>
                  <dd data-testid="anexo-esperado">{{ c.anexoEsperado }}</dd>
                }
              </dl>

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

              @if (esSecretaria() && c.puedeRegistrarResultado) {
                <form class="resolucion-etapa__form" [formGroup]="resultadoForm" (ngSubmit)="registrarResultado(c)">
                  <h4>{{ c.resultado ? 'Corregir resultado del pleno' : 'Registrar resultado del pleno' }}</h4>
                  <label>
                    Resultado
                    <select formControlName="resultado" data-testid="select-resultado">
                      <option value="">Seleccione un resultado</option>
                      <option value="APROBADO_DEFINITIVO">Aprobado definitivo</option>
                      <option value="APROBADO_CON_CONDICION">Aprobado con condición</option>
                      <option value="NO_APROBADO">No aprobado</option>
                    </select>
                  </label>
                  @if (resultadoSeleccionado() === 'NO_APROBADO') {
                    <label>
                      Motivo (obligatorio)
                      <textarea formControlName="motivo" rows="3" maxlength="2000"></textarea>
                    </label>
                  }
                  @if (resultadoSeleccionado() === 'APROBADO_CON_CONDICION') {
                    <label>
                      Observaciones (obligatorias)
                      <textarea formControlName="observaciones" rows="3" maxlength="2000"></textarea>
                    </label>
                  }
                  @if (c.resultado) {
                    <label>
                      Motivo de la corrección (obligatorio)
                      <textarea formControlName="motivoCorreccion" rows="3" maxlength="2000"></textarea>
                    </label>
                  }
                  <button type="submit" class="resolucion-etapa__boton" [disabled]="ocupado()">
                    {{ ocupado() ? 'Guardando…' : 'Guardar resultado' }}
                  </button>
                </form>
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
                      Convocatoria {{ a.numeroConvocatoria }} · {{ etiquetaResultado(a.resultado) }}
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
  private readonly registrarUseCase = inject(RegistrarResultadoPlenoUseCase);
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

  readonly resultadoForm = new FormGroup({
    resultado: new FormControl<ResultadoPleno | ''>('', { nonNullable: true }),
    motivo: new FormControl('', { nonNullable: true }),
    observaciones: new FormControl('', { nonNullable: true }),
    motivoCorreccion: new FormControl('', { nonNullable: true }),
  });
  readonly motivoReemplazo = new FormControl('', { nonNullable: true });
  readonly resultadoSeleccionado = signal<ResultadoPleno | ''>('');

  ngOnInit(): void {
    this.resultadoForm.controls.resultado.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.resultadoSeleccionado.set(valor));

    const parent = this.route.parent;
    (parent?.paramMap ?? this.route.paramMap)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.protocolId = params.get('id') ?? '';
        this.cargarContexto();
      });
  }

  etiquetaResultado(resultado: ResultadoPleno | null | undefined): string {
    return resultado ? ETIQUETAS_RESULTADO[resultado] : 'Sin resultado registrado';
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
  }

  registrarResultado(c: ConvocatoriaContexto): void {
    const valor = this.resultadoForm.getRawValue();
    if (!valor.resultado) {
      this.aviso.set({ tipo: 'error', texto: 'Seleccione un resultado.' });
      return;
    }
    this.ocupado.set(true);
    this.aviso.set(null);
    this.registrarUseCase
      .execute({
        convocatoriaId: c.convocatoriaId,
        convocatoriaProtocoloId: c.convocatoriaProtocoloId,
        resultado: valor.resultado,
        motivo: valor.motivo,
        observaciones: valor.observaciones,
        yaTieneResultado: c.resultado !== null,
        motivoCorreccion: valor.motivoCorreccion,
      })
      .subscribe({
        next: () => {
          this.ocupado.set(false);
          this.resultadoForm.reset();
          this.aviso.set({ tipo: 'ok', texto: 'El resultado se registró correctamente.' });
          this.cargarContexto();
        },
        error: (error: unknown) => {
          this.ocupado.set(false);
          this.aviso.set({ tipo: 'error', texto: mensajeDeErrorResolucion(error) });
        },
      });
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
        anexoEsperado: c.anexoEsperado,
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
        this.resultadoForm.reset();
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
