import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, catchError, defaultIfEmpty, last, map, of, switchMap } from 'rxjs';

import { LoadTemplatesUseCase } from '@features/documents/application/use-cases/load-templates.use-case';
import { CreateTemplateUseCase } from '@features/documents/application/use-cases/create-template.use-case';
import { UploadTemplateFileUseCase } from '@features/documents/application/use-cases/upload-template-file.use-case';
import { IDocumentRepositoryPort, Template } from '@domain/ports/IDocumentRepositoryPort';
import { abrirEnPestana } from '@shared/utils/descarga-en-pestana.util';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { StatusChipComponent } from '@shared/ui/status-chip/status-chip.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { ConfigSeccionesComponent } from '../../components/config-secciones/config-secciones.component';

type EstadoCarga = 'cargando' | 'error' | 'listo';

/** Textos de F08 D5 a D7. */
export const TEXTOS_FORMATOS = {
  noDocx: 'El archivo debe estar en formato Word (.docx).',
  errorSubida: 'No pudimos subir el archivo. Intente de nuevo.',
  noDisponible: 'Este formato no está disponible.',
  errorDescarga: 'No pudimos descargar el formato. Intente de nuevo.',
  errorGuardar: 'No pudimos guardar el formato. Intente de nuevo.',
} as const;

/** Códigos que acepta el formulario: los de la columna `codigo` (F08 D7). */
const PATRON_CODIGO = /^[A-Z0-9_]+$/;

/** Solo `.docx`, sin importar mayúsculas (F08 D5). */
export function esNombreDocx(nombre: string): boolean {
  return nombre.trim().toLowerCase().endsWith('.docx');
}

/** Formatos de la Secretaría (F08 D1 a D8, CF1). */
@Component({
  selector: 'app-template-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusChipComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ConfigSeccionesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './template-management.page.html',
  styleUrl: './template-management.page.scss',
})
export class TemplateManagementPage implements OnInit {
  private readonly loadTemplates = inject(LoadTemplatesUseCase);
  private readonly createTemplate = inject(CreateTemplateUseCase);
  private readonly uploadTemplateFile = inject(UploadTemplateFileUseCase);
  private readonly documentRepo = inject(IDocumentRepositoryPort);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly recargar$ = new Subject<void>();

  readonly textos = TEXTOS_FORMATOS;
  readonly estado = signal<EstadoCarga>('cargando');
  readonly formatos = signal<readonly Template[]>([]);
  /** Subidas y descargas en curso y su último error, por código del formato. */
  readonly subiendo = signal<ReadonlySet<string>>(new Set());
  readonly descargando = signal<ReadonlySet<string>>(new Set());
  readonly errores = signal<ReadonlyMap<string, string>>(new Map());
  /** Aviso de éxito (`role="status"`, siempre presente). */
  readonly aviso = signal('');

  readonly formularioAbierto = signal(false);
  readonly guardando = signal(false);
  readonly errorFormulario = signal<string | null>(null);
  readonly archivoNuevo = signal<File | null>(null);
  readonly errorArchivoNuevo = signal<string | null>(null);
  readonly intentoGuardar = signal(false);

  readonly form = this.fb.nonNullable.group({
    // Los largos máximos (100 y 200, las columnas del backend) los pone `maxlength` en el campo.
    code: ['', [Validators.required, Validators.pattern(PATRON_CODIGO)]],
    name: ['', Validators.required],
  });

  readonly codigos = computed(() => new Set(this.formatos().map((f) => f.code)));

  constructor() {
    this.recargar$
      .pipe(
        switchMap(() =>
          this.loadTemplates.execute().pipe(
            map((lista) => ({ ok: true as const, lista: Array.isArray(lista) ? lista : [] })),
            catchError(() => of({ ok: false as const })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => {
        if (resultado.ok) {
          this.formatos.set(resultado.lista as Template[]);
          this.estado.set('listo');
        } else if (this.estado() !== 'listo') {
          // Con una lista en pantalla, una recarga que falla la conserva.
          this.estado.set('error');
        }
      });
  }

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide la lista; `Cargando` solo si todavía no hay una. */
  cargar(): void {
    if (this.estado() !== 'listo') this.estado.set('cargando');
    this.recargar$.next();
  }

  tieneArchivo(f: Template): boolean {
    return typeof f.filePath === 'string' && f.filePath.trim() !== '';
  }

  textoSubir(f: Template): string {
    if (this.subiendo().has(f.code)) return 'Subiendo…';
    return this.tieneArchivo(f) ? 'Cambiar archivo' : 'Subir archivo';
  }

  etiquetaSubir(f: Template): string {
    return `${this.tieneArchivo(f) ? 'Cambiar archivo de' : 'Subir archivo de'} ${f.name}`;
  }

  idError(f: Template): string {
    return `fmt-${f.code}-error`;
  }

  error(f: Template): string | null {
    return this.errores().get(f.code) ?? null;
  }

  // ── Subir o cambiar el archivo (D5) ────────────────────────────────────────

  onArchivoElegido(evento: Event, f: Template): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    // Permite volver a elegir el mismo archivo después de un error.
    input.value = '';
    if (!archivo || this.subiendo().has(f.code)) return;
    this.quitarError(f.code);
    this.aviso.set('');
    if (!esNombreDocx(archivo.name)) {
      this.ponerError(f.code, TEXTOS_FORMATOS.noDocx);
      return;
    }
    this.marcar(this.subiendo, f.code, true);
    this.subir(f.code, archivo).subscribe((ok) => {
      this.marcar(this.subiendo, f.code, false);
      if (ok) {
        // La fila cambia ya: si la recarga falla, no contradice el aviso.
        this.actualizarFila({ ...f, filePath: this.tieneArchivo(f) ? f.filePath : archivo.name });
        this.aviso.set(`Archivo de ${f.name} actualizado.`);
        this.cargar();
      } else {
        this.ponerError(f.code, TEXTOS_FORMATOS.errorSubida);
      }
    });
  }

  /** true si se subió; false si falló o terminó sin respuesta. */
  private subir(codigo: string, archivo: File): Observable<boolean> {
    return this.uploadTemplateFile.execute(codigo, archivo).pipe(
      map(() => true),
      last(undefined, false),
      defaultIfEmpty(false),
      catchError(() => of(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  /** Cambia o agrega una fila en la lista a la vista (la recarga la reemplaza después). */
  private actualizarFila(formato: Template): void {
    const lista = this.formatos();
    const existe = lista.some((f) => f.code === formato.code);
    this.formatos.set(
      existe ? lista.map((f) => (f.code === formato.code ? formato : f)) : [...lista, formato],
    );
  }

  // ── Descargar (D6) ─────────────────────────────────────────────────────────

  descargar(f: Template): void {
    if (!this.tieneArchivo(f) || this.descargando().has(f.code)) return;
    this.quitarError(f.code);
    this.marcar(this.descargando, f.code, true);
    abrirEnPestana(() => this.documentRepo.downloadTemplate(f.code))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((resultado) => {
        this.marcar(this.descargando, f.code, false);
        if (resultado === 'abierta') return;
        this.ponerError(
          f.code,
          resultado === 'no-disponible' ? TEXTOS_FORMATOS.noDisponible : TEXTOS_FORMATOS.errorDescarga,
        );
      });
  }

  // ── Nuevo formato (D7) ─────────────────────────────────────────────────────

  abrirFormulario(): void {
    this.formularioAbierto.update((abierto) => !abierto);
    if (!this.formularioAbierto()) this.vaciarFormulario();
  }

  cancelar(): void {
    this.formularioAbierto.set(false);
    this.vaciarFormulario();
  }

  /** El código se pasa a mayúsculas mientras se escribe. */
  onCodigo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const mayusculas = input.value.toUpperCase();
    if (mayusculas !== input.value) {
      // El cursor queda donde estaba.
      const inicio = input.selectionStart;
      const fin = input.selectionEnd;
      input.value = mayusculas;
      this.form.controls.code.setValue(mayusculas);
      input.setSelectionRange(inicio, fin);
    }
  }

  onArchivoNuevo(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    if (archivo && !esNombreDocx(archivo.name)) {
      this.archivoNuevo.set(null);
      this.errorArchivoNuevo.set(TEXTOS_FORMATOS.noDocx);
      (evento.target as HTMLInputElement).value = '';
      return;
    }
    this.errorArchivoNuevo.set(null);
    this.archivoNuevo.set(archivo);
  }

  errorCampo(campo: 'code' | 'name'): string | null {
    const control = this.form.controls[campo];
    if (!(control.touched || this.intentoGuardar())) return null;
    // Solo espacios cuenta como vacío.
    if (control.hasError('required') || control.value.trim() === '') {
      return campo === 'code' ? 'El código es obligatorio.' : 'El nombre es obligatorio.';
    }
    if (control.hasError('pattern')) return 'Solo mayúsculas, números y guion bajo (_).';
    return null;
  }

  guardar(): void {
    if (this.guardando()) return;
    this.intentoGuardar.set(true);
    this.errorFormulario.set(null);
    this.aviso.set('');
    const code = this.form.controls.code.value.trim();
    const name = this.form.controls.name.value.trim();
    if (this.form.invalid || !name || this.errorArchivoNuevo()) return;

    // D7: el backend cambiaría el nombre del que ya existe sin avisar.
    if (this.codigos().has(code)) {
      this.errorFormulario.set(`Ya existe un formato con el código ${code}.`);
      return;
    }

    const archivo = this.archivoNuevo();
    this.guardando.set(true);
    this.createTemplate
      .execute({ code, name })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (!archivo) {
            this.actualizarFila({ code, name });
            this.terminarGuardado(`Formato ${name} guardado.`);
            return;
          }
          this.subir(code, archivo).subscribe((ok) => {
            this.actualizarFila({ code, name, filePath: ok ? archivo.name : undefined });
            this.terminarGuardado(
              ok
                ? `Formato ${name} guardado.`
                : `Guardamos el formato ${name}, pero no pudimos subir el archivo. Súbalo desde la lista.`,
            );
          });
        },
        error: () => {
          this.guardando.set(false);
          this.errorFormulario.set(TEXTOS_FORMATOS.errorGuardar);
        },
      });
  }

  private terminarGuardado(texto: string): void {
    this.guardando.set(false);
    this.formularioAbierto.set(false);
    this.vaciarFormulario();
    this.aviso.set(texto);
    this.cargar();
  }

  private vaciarFormulario(): void {
    this.form.reset();
    this.intentoGuardar.set(false);
    this.errorFormulario.set(null);
    this.archivoNuevo.set(null);
    this.errorArchivoNuevo.set(null);
  }

  // ── Estado por fila ────────────────────────────────────────────────────────

  private marcar(estado: WritableSignal<ReadonlySet<string>>, codigo: string, activo: boolean): void {
    const siguiente = new Set(estado());
    if (activo) siguiente.add(codigo);
    else siguiente.delete(codigo);
    estado.set(siguiente);
  }

  private ponerError(codigo: string, texto: string): void {
    const siguiente = new Map(this.errores());
    siguiente.set(codigo, texto);
    this.errores.set(siguiente);
  }

  private quitarError(codigo: string): void {
    if (!this.errores().has(codigo)) return;
    const siguiente = new Map(this.errores());
    siguiente.delete(codigo);
    this.errores.set(siguiente);
  }
}
