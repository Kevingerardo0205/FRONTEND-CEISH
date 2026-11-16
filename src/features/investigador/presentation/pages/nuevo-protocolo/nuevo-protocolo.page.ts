import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  Injector,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';

// Angular Material
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProtocoloService } from '../../../application/services/protocolo.service';
import { CrearProtocoloDto, ChecklistRequirement } from '../../../domain/dtos/crear-protocolo.dto';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { Subscription } from 'rxjs';

/** Largo del título (RF-02.2 del backend), contado sobre el texto recortado. */
const TITULO_MIN = 20;
const TITULO_MAX = 200;

type CampoCaracteristica =
  | 'isIndigenousPopulation'
  | 'usesBiologicalSamples'
  | 'isVulnerablePopulation'
  | 'isMulticentric'
  | 'isExternal';

interface Caracteristica {
  campo: CampoCaracteristica;
  nombre: string;
  /** Sin texto no se muestran ni la explicación ni el ícono (D15). */
  descripcion?: string;
}

/**
 * Explicación de cada característica (F09 D15, C2d). Resumida del PET del CEISH-ESPOCH (secciones
 * 4.1.2 y 4.2.1.2 y glosario); la Secretaría debe validar estos textos.
 */
const DESCRIPCION_CARACTERISTICA: Partial<Record<CampoCaracteristica, string>> = {
  isIndigenousPopulation:
    'Pide el consentimiento informado en castellano y traducido a los idiomas ancestrales, y el consentimiento colectivo o comunitario firmado por el líder elegido por la asamblea comunitaria.',
  usesBiologicalSamples:
    'Material de origen humano como tejidos, fluidos, células, ADN, ARN o proteínas. Pide la declaratoria de confidencialidad y la declaración de conflicto de interés de todos los investigadores.',
  isVulnerablePopulation:
    'Por ejemplo: niños, niñas, adolescentes, embarazadas, adultos mayores, personas con discapacidad o trastornos mentales, grupos étnicos minoritarios o víctimas de conflicto armado. Pide la declaratoria de confidencialidad y la declaración de conflicto de interés.',
  isMulticentric:
    'Se realiza en más de un centro de investigación. La declaración de responsabilidad (Anexo 4) debe cubrir al investigador de cada centro.',
  isExternal:
    'Pide la carta de interés institucional (Anexo 5) firmada por la máxima autoridad de cada establecimiento, distrito o coordinación zonal.',
};

const NOMBRE_CARACTERISTICA: [CampoCaracteristica, string][] = [
  ['isIndigenousPopulation', 'Involucra pueblos o nacionalidades indígenas'],
  ['usesBiologicalSamples', 'Utiliza muestras biológicas humanas'],
  ['isVulnerablePopulation', 'Involucra población vulnerable'],
  ['isMulticentric', 'Es un estudio multicéntrico'],
  ['isExternal', 'Participan instituciones externas'],
];

interface StudyType {
  id: number;
  code?: string;
  name?: string;
  nombre?: string;
  description?: string;
}

/** Fila del paso 2 (D16): un requisito del checklist del backend, sin código interno a la vista. */
interface DocumentoRequerido {
  id: number;
  nombre: string;
  /** `status` del backend (requirement-status.enum.ts), tal como llega. */
  status: string;
  /** Texto de la Secretaría; vacío si no hay. */
  observaciones: string;
  /**
   * Plantilla del requisito para "Descargar formato". Hoy el backend no relaciona el requisito con
   * su plantilla (TSK-001.18): no llega y no se muestra el enlace.
   */
  plantillaUrl?: string;
}

/** Estado de la lista del paso 2; null mientras no hay protocolo. */
type EstadoChecklist = 'cargando' | 'error' | 'listo' | null;

/** Estados que ya no faltan (D16). Con APROBADO no se puede cambiar el archivo. */
const ESTADOS_PRESENTADO = ['PRESENTADO', 'APROBADO'];
const ESTADO_APROBADO = 'APROBADO';
/** No falta, no bloquea el envío ni cuenta en el total (D16). */
const ESTADO_NO_APLICA = 'NO_APLICA';

// --- Validadores Técnicos ---

export function ecuadorianPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const valid = /^(09\d{8}|0[2-7]\d{7})$/.test(control.value);
  return valid ? null : { invalidPhone: true };
}

/**
 * Largo de min a max contado sobre el texto recortado. Devuelve las mismas claves que Validators
 * (required, minlength, maxlength) para reutilizar los mensajes del template.
 */
export function trimmedLengthValidator(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = String(control.value ?? '').trim().length;
    if (length === 0) return { required: true };
    if (length < min) return { minlength: { requiredLength: min, actualLength: length } };
    if (length > max) return { maxlength: { requiredLength: max, actualLength: length } };
    return null;
  };
}

export function ecuadorianIdValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (!val) return null;
  if (!/^\d{10}$|^\d{13}$/.test(val)) return { invalidIdLength: true };
  return null;
}

@Component({
  selector: 'app-nuevo-protocolo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatStepperModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './nuevo-protocolo.page.html',
  styleUrls: ['./nuevo-protocolo.page.scss'],
})
export class NuevoProtocoloPage implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly fb = inject(FormBuilder);
  private readonly protocoloService = inject(ProtocoloService);
  private readonly authFacade = inject(AuthFacade);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Peticiones del protocolo en pantalla (comprobación del borrador, creación, checklist,
   * subidas y envío): se cancelan al volver a un protocolo nuevo y al destruir la página.
   */
  private trabajos = new Subscription();
  /**
   * Cambia al volver a un protocolo nuevo. Las subidas y el envío no se cancelan (la petición ya
   * salió y cortarla podría dejar un archivo sin registrar): su respuesta se ignora si cambió.
   */
  private generacion = 0;
  private queryParamsVistos = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.trabajos.unsubscribe();
      // Las subidas en curso no se cancelan; su respuesta se ignora (mismaGeneracion).
      this.generacion++;
    });
  }

  isLoading = false;
  isDraftContinuation = false;
  protocolId: number | null = null;

  tiposEstudio: StudyType[] = [];
  /** Paso abierto del stepper (stepper.selectedIndex): marca la barra de pasos y el subtítulo. */
  pasoActual = 0;
  readonly subtituloDatos = 'Paso 1 de 3: Información básica';
  readonly subtituloDocumentos = 'Paso 2 de 3: Documentos';
  /** Barra de pasos propia (D15); el paso 3 queda pendiente hasta C4. */
  readonly pasos = ['1 · Datos', '2 · Documentos', '3 · Enviar a la Secretaría'];
  caracteristicas: Caracteristica[] = NOMBRE_CARACTERISTICA.map(([campo, nombre]) => ({
    campo,
    nombre,
    descripcion: DESCRIPCION_CARACTERISTICA[campo],
  }));
  documentosRequeridos: DocumentoRequerido[] = [];
  estadoChecklist: EstadoChecklist = null;
  /** Después de una subida se vuelve a pedir el checklist sin quitar la lista de la vista. */
  recargandoChecklist = false;
  /** Subidas en curso y último error de subida, por id del requisito. */
  subiendo: Record<number, boolean> = {};
  errorSubida: Record<number, string> = {};
  /** Última petición del checklist: una nueva cancela la anterior (sin respuestas fuera de orden). */
  private cargaChecklist?: Subscription;

  generalForm = this.fb.group({
    titulo: ['', trimmedLengthValidator(TITULO_MIN, TITULO_MAX)],
    tipoEstudio: ['', Validators.required],
    // Tesis (D14): sin respuesta inicial; responder Sí o No es obligatorio.
    esTesis: [null as boolean | null, Validators.required],
    isAffidavitAccepted: [false, Validators.requiredTrue],

    // Characteristics flags
    usesBiologicalSamples: [false, Validators.required],
    isVulnerablePopulation: [false, Validators.required],
    isIndigenousPopulation: [false, Validators.required],
    isMulticentric: [false, Validators.required],
    isExternal: [false, Validators.required],
  });

  ngOnInit(): void {
    // El componente se reutiliza cuando solo cambian los query params (por ejemplo, "Nuevo
    // protocolo" del menú con ?borrador abierto): se escucha queryParamMap, no route.snapshot.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.onQueryParams(params));

    this.loadStudyTypes();
  }

  private onQueryParams(params: ParamMap): void {
    const borradorId = this.parseBorrador(params.get('borrador'));

    // La URL que fija guardarInicial (?borrador={id} del protocolo recién creado) no reinicia nada.
    if (borradorId !== null && borradorId === this.protocolId) return;

    if (this.queryParamsVistos) this.reiniciarProtocoloNuevo();
    this.queryParamsVistos = true;

    if (borradorId !== null) this.continuarBorrador(borradorId);
  }

  private parseBorrador(valor: string | null): number | null {
    const id = Number(valor);
    return valor !== null && Number.isInteger(id) && id > 0 ? id : null;
  }

  /** Vuelve a un protocolo nuevo: vacío, en el paso 1 y sin nada del borrador anterior. */
  private reiniciarProtocoloNuevo(): void {
    this.trabajos.unsubscribe();
    this.trabajos = new Subscription();
    this.generacion++;

    this.isLoading = false;
    this.isDraftContinuation = false;
    this.protocolId = null;
    this.pasoActual = 0;
    this.documentosRequeridos = [];
    this.estadoChecklist = null;
    this.recargandoChecklist = false;
    this.subiendo = {};
    this.errorSubida = {};

    if (this.stepper) {
      this.stepper.reset();
      // reset() deja en false el "completado" que fija abrirPasoRequisitos; null devuelve el paso 1
      // al cálculo normal de CdkStep (formulario válido y paso visitado).
      (this.stepper.steps.first as unknown as { completed: boolean | null }).completed = null;
    }
    this.generalForm.reset({
      titulo: '',
      tipoEstudio: '',
      esTesis: null,
      isAffidavitAccepted: false,
      usesBiologicalSamples: false,
      isVulnerablePopulation: false,
      isIndigenousPopulation: false,
      isMulticentric: false,
      isExternal: false,
    });
  }

  private continuarBorrador(id: number): void {
    // Bloquea "Guardar" del paso 1 mientras se comprueba el borrador: evita crear otro protocolo.
    this.isLoading = true;
    const trabajo = this.trabajos;
    trabajo.add(
      this.protocoloService.misProtocolos().subscribe({
        next: (protocolos) => {
          const borrador = protocolos.find((protocolo) => protocolo.id === id);
          if (!borrador || borrador.estado !== 'BORRADOR') {
            this.rechazarContinuacionBorrador();
            return;
          }

          this.protocolId = id;
          this.isDraftContinuation = true;
          this.isLoading = false;
          // El paso 2 se abre ya: sus estados de carga, error y vacío los muestra la lista (D16).
          this.cargarChecklist(id);
          this.abrirPasoRequisitos();
        },
        error: () => this.rechazarContinuacionBorrador(),
      }),
    );
  }

  private rechazarContinuacionBorrador(): void {
    this.isLoading = false;
    this.snackBar.open(
      'No se puede continuar: este protocolo ya no es un borrador o no está disponible.',
      'Cerrar',
      { duration: 5000 },
    );
    this.router.navigate(['/dashboard/investigador/mis-protocolos']);
  }

  private abrirPasoRequisitos(): void {
    // Solo en el borrador: el paso 1 se marca completado (sus datos ya están en el backend) y el
    // stepper lineal deja pasar al paso 2 sin el formulario. El flujo normal sigue con generalForm.
    const id = this.protocolId;
    afterNextRender(
      () => {
        // Si antes del render se volvió a un protocolo nuevo, ya no se abre el paso 2.
        if (!this.isDraftContinuation || this.protocolId !== id) return;
        this.stepper.steps.first.completed = true;
        this.stepper.next();
      },
      { injector: this.injector },
    );
  }

  private loadStudyTypes() {
    this.protocoloService.getStudyTypes().subscribe({
      next: (types) => {
        const raw = types as unknown;
        const list = Array.isArray(raw)
          ? raw
          : ((raw as Record<string, unknown>)?.['data'] as unknown[]);
        this.tiposEstudio = (list || []) as StudyType[];
      },
      error: () =>
        this.snackBar.open('No se pudieron cargar los tipos de estudio.', 'Cerrar'),
    });
  }

  /** Valor del radio del tipo de estudio: el id del catálogo (se envía como studyTypeId). */
  valorTipo(tipo: StudyType): string {
    return String(tipo.id);
  }

  tipoSeleccionado(tipo: StudyType): boolean {
    return String(this.generalForm.controls.tipoEstudio.value ?? '') === this.valorTipo(tipo);
  }

  /**
   * Clic en el ⓘ de una característica (D15). Con el mouse y con el teclado, Material ya abre el
   * tooltip al pasar o al enfocar: el clic (o Enter/Espacio) solo lo muestra, porque alternarlo lo
   * cerraría. Con un toque lo alterna: en pantallas táctiles Material solo lo abre con una
   * pulsación larga.
   */
  clicInfo(tooltip: MatTooltip, evento: MouseEvent): void {
    if ((evento as PointerEvent).pointerType === 'touch') {
      tooltip.toggle();
    } else {
      tooltip.show();
    }
  }

  /** Opción de la tesis elegida (Sí = true, No = false); null sin respuesta (D14). */
  tesisElegida(valor: boolean): boolean {
    return this.generalForm.controls.esTesis.value === valor;
  }

  /** Con "Sí" en la tesis se muestra el aviso de los 2 documentos más (D14). */
  get esTesisSi(): boolean {
    return this.tesisElegida(true);
  }

  /** Largo del título recortado, como lo cuenta trimmedLengthValidator. */
  get largoTitulo(): number {
    return String(this.generalForm.controls.titulo.value ?? '').trim().length;
  }

  /** Caracteres que faltan para el mínimo de 20; 0 con el campo vacío o con 20 o más. */
  get faltanTitulo(): number {
    const largo = this.largoTitulo;
    return largo > 0 && largo < TITULO_MIN ? TITULO_MIN - largo : 0;
  }

  get contadorTitulo(): string {
    const contador = `${this.largoTitulo}/${TITULO_MAX}`;
    return this.faltanTitulo > 0 ? `${contador} · faltan ${this.faltanTitulo}` : contador;
  }

  /** Sin texto de error debajo (D13): el estado inválido se anuncia con aria-invalid al tocarlo. */
  get tituloConError(): boolean {
    const control = this.generalForm.controls.titulo;
    return control.touched && control.invalid;
  }

  /** El error de la declaración se muestra después de tocar la casilla sin marcarla. */
  get declaracionConError(): boolean {
    const control = this.generalForm.controls.isAffidavitAccepted;
    return control.touched && control.hasError('required');
  }

  /**
   * Motivo visible del botón "Guardar y continuar" deshabilitado (F00 §5: la acción se
   * deshabilita mostrando el motivo; texto de D15). Sin motivo mientras se guarda o con el
   * formulario válido.
   */
  get motivoPasoDatos(): string | null {
    if (this.isLoading || this.generalForm.valid) return null;
    const { titulo, tipoEstudio, esTesis, isAffidavitAccepted } = this.generalForm.controls;
    const faltan: string[] = [];
    if (titulo.invalid) faltan.push('el título');
    if (tipoEstudio.invalid) faltan.push('el tipo de estudio');
    if (esTesis.invalid) faltan.push('si es tesis');
    if (isAffidavitAccepted.invalid) faltan.push('la declaración');
    if (faltan.length === 0) return null;
    const lista =
      faltan.length === 1
        ? faltan[0]
        : `${faltan.slice(0, -1).join(', ')} y ${faltan[faltan.length - 1]}`;
    const cantidad =
      faltan.length === 1
        ? '1 campo obligatorio pendiente'
        : `${faltan.length} campos obligatorios pendientes`;
    return `${cantidad}: ${lista}.`;
  }

  guardarInicial(): void {
    // Con el protocolo ya creado el paso 1 queda bloqueado ([editable] en la plantilla): editar
    // los datos registrados es T09-7, bloqueada por el backend. No se registra un segundo protocolo.
    if (this.protocolId !== null) return;
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      this.snackBar.open('Complete todos los campos obligatorios antes de continuar.', 'Cerrar');
      return;
    }

    this.isLoading = true;
    const user = this.authFacade.currentUser();
    const formVal = this.generalForm.getRawValue();

    const payload: CrearProtocoloDto = {
      title: (formVal.titulo ?? '').trim(),
      principalInvestigatorId: Number(user?.id),
      studyTypeId: Number(formVal.tipoEstudio),
      geographicCoverage: null as unknown as string,
      studyDurationMonths: null as unknown as number,

      usesBiologicalSamples: !!formVal.usesBiologicalSamples,
      isVulnerablePopulation: !!formVal.isVulnerablePopulation,
      isIndigenousPopulation: !!formVal.isIndigenousPopulation,
      isMulticentric: !!formVal.isMulticentric,
      hasExternalInstitutions: !!formVal.isExternal,
      isThesis: formVal.esTesis === true,

      sponsorRuc: null as unknown as string,
      sponsorPhone: null as unknown as string,
      sponsorAddress: null as unknown as string,
      sponsorWeb: '',
      sponsorExecutingAgency: null as unknown as string,
      financingAmount: 0,
      isAffidavitAccepted: !!formVal.isAffidavitAccepted,

      investigators: [],
      institutions: [],
    };

    const trabajo = this.trabajos;
    trabajo.add(
      this.protocoloService.guardarProtocoloInicial(payload).subscribe({
        next: (res) => {
          // Número, para compararlo con el ?borrador={id} que emite la URL (onQueryParams).
          const id = Number(res.id || (res as unknown as { data?: { id?: number } })?.data?.id);
          if (Number.isInteger(id) && id > 0) {
            this.protocolId = id;
            // La URL pasa a ?borrador={id} sin recargar: recargar continúa el borrador y "Nuevo
            // protocolo" del menú cambia los query params y vuelve a un protocolo nuevo.
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { borrador: id },
              replaceUrl: true,
            });
            this.snackBar.open('Protocolo registrado. Cargando los requisitos…', 'Cerrar', {
              duration: 3000,
            });

            this.isLoading = false;
            // Si el checklist falla, el paso 2 muestra su ErrorState con Reintentar (D11, D16).
            this.cargarChecklist(id);
            this.stepper.next(); // Avanza al Paso 2 (Documentos)
          } else {
            this.isLoading = false;
            this.snackBar.open(
              'No se pudo registrar el protocolo: el servidor no devolvió su identificador.',
              'Cerrar',
            );
          }
        },
        error: (err: unknown) => {
          this.isLoading = false;
          this.snackBar.open(
            extractApiErrorMessage(err, 'No se pudo registrar el protocolo.'),
            'Cerrar',
            { duration: 10000 },
          );
        },
      }),
    );
  }

  /**
   * Pide el checklist real del protocolo (D11, D16) sin respaldo: si falla, ErrorState. Con
   * `silencioso` (después de una subida) la lista sigue a la vista mientras llega la nueva.
   */
  cargarChecklist(id: number, silencioso = false): void {
    if (silencioso) {
      this.recargandoChecklist = true;
    } else {
      this.estadoChecklist = 'cargando';
    }
    this.cargaChecklist?.unsubscribe();
    this.cargaChecklist = this.protocoloService.obtenerChecklist(id).subscribe({
      next: (lista) => {
        this.recargandoChecklist = false;
        this.documentosRequeridos = (Array.isArray(lista) ? lista : []).map((r) =>
          this.aDocumento(r),
        );
        this.estadoChecklist = 'listo';
      },
      error: () => {
        this.recargandoChecklist = false;
        this.documentosRequeridos = [];
        this.estadoChecklist = 'error';
      },
    });
    this.trabajos.add(this.cargaChecklist);
  }

  /** Reintentar del ErrorState del paso 2. */
  reintentarChecklist(): void {
    if (this.protocolId !== null) this.cargarChecklist(this.protocolId);
  }

  /** El backend envía la entidad sin mapear (requirementName); GET /protocols/:id usa name. */
  private aDocumento(requisito: ChecklistRequirement): DocumentoRequerido {
    const r = requisito as ChecklistRequirement & { name?: string };
    return {
      id: Number(r.id),
      nombre: r.requirementName ?? r.name ?? '',
      status: String(r.status ?? ''),
      observaciones: typeof r.observations === 'string' ? r.observations.trim() : '',
    };
  }

  estaPresentado(doc: DocumentoRequerido): boolean {
    return ESTADOS_PRESENTADO.includes(doc.status);
  }

  noAplica(doc: DocumentoRequerido): boolean {
    return doc.status === ESTADO_NO_APLICA;
  }

  /** Sin botón con APROBADO (el backend no deja reemplazarlo) ni con NO_APLICA (D16). */
  admiteSubida(doc: DocumentoRequerido): boolean {
    return doc.status !== ESTADO_APROBADO && !this.noAplica(doc);
  }

  textoBoton(doc: DocumentoRequerido): string {
    if (this.subiendo[doc.id]) return 'Subiendo…';
    return this.estaPresentado(doc) ? 'Cambiar' : 'Subir';
  }

  /** Nombre accesible del botón: incluye el nombre del documento (F09-11). */
  etiquetaBoton(doc: DocumentoRequerido): string {
    return `${this.textoBoton(doc)} ${doc.nombre}`;
  }

  /** Total M de "N de M": todos menos NO_APLICA (D16). */
  get totalDocumentos(): number {
    return this.documentosRequeridos.filter((d) => !this.noAplica(d)).length;
  }

  get documentosPresentados(): number {
    return this.documentosRequeridos.filter((d) => this.estaPresentado(d)).length;
  }

  get faltanDocumentos(): number {
    return this.totalDocumentos - this.documentosPresentados;
  }

  /** Lista cargada y con al menos un requisito: se muestran el progreso y el motivo del envío. */
  get listaConDocumentos(): boolean {
    return this.estadoChecklist === 'listo' && this.documentosRequeridos.length > 0;
  }

  get motivoEnvio(): string {
    const faltan = this.faltanDocumentos;
    if (faltan === 0) return 'Todos los documentos están presentados.';
    return faltan === 1 ? 'Falta 1 documento.' : `Faltan ${faltan} documentos.`;
  }

  get haySubidaEnCurso(): boolean {
    return Object.values(this.subiendo).some(Boolean);
  }

  /**
   * El envío queda deshabilitado mientras la lista carga, falla o llega vacía, falta algún
   * documento o hay una subida en curso (D11, D16). onEnviarFinal repite la misma condición.
   */
  get envioDeshabilitado(): boolean {
    return (
      this.isLoading ||
      this.protocolId === null ||
      !this.listaConDocumentos ||
      this.recargandoChecklist ||
      this.faltanDocumentos > 0 ||
      this.haySubidaEnCurso
    );
  }

  onDocumentSelected(event: Event, doc: DocumentoRequerido): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Permite volver a elegir el mismo archivo después de un error.
    input.value = '';
    const protocolId = this.protocolId;
    if (!file || protocolId === null || this.subiendo[doc.id] || !this.admiteSubida(doc)) return;

    const vigente = this.mismaGeneracion();
    this.subiendo = { ...this.subiendo, [doc.id]: true };
    const sinError = { ...this.errorSubida };
    delete sinError[doc.id];
    this.errorSubida = sinError;

    this.protocoloService.subirDocumento(file, protocolId, doc.id).subscribe({
      next: () => {
        if (!vigente()) return;
        this.subiendo = { ...this.subiendo, [doc.id]: false };
        this.cargarChecklist(protocolId, true);
      },
      error: (err: unknown) => {
        if (!vigente()) return;
        this.subiendo = { ...this.subiendo, [doc.id]: false };
        // Mensaje del backend (por ejemplo "El archivo debe tener formato PDF"), como texto.
        this.errorSubida = {
          ...this.errorSubida,
          [doc.id]: extractApiErrorMessage(err, 'No se pudo subir el documento.'),
        };
      },
    });
  }

  /** true mientras la página siga en el mismo protocolo que cuando se llamó. */
  private mismaGeneracion(): () => boolean {
    const generacion = this.generacion;
    return () => generacion === this.generacion;
  }

  onEnviarFinal(): void {
    const protocolId = this.protocolId;
    if (this.envioDeshabilitado || protocolId === null) return;

    this.isLoading = true;
    const vigente = this.mismaGeneracion();
    this.protocoloService.finalizarProtocolo(protocolId).subscribe({
      next: () => {
        if (!vigente()) return;
        this.isLoading = false;
        this.snackBar.open('Protocolo enviado a la Secretaría.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/dashboard/investigador/mis-protocolos']);
      },
      error: (err: unknown) => {
        if (!vigente()) return;
        this.isLoading = false;
        this.snackBar.open(
          extractApiErrorMessage(err, 'No se pudo enviar el protocolo a la Secretaría.'),
          'Cerrar',
        );
      },
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) event.preventDefault();
  }
}
