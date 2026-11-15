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
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProtocoloService } from '../../../application/services/protocolo.service';
import {
  CrearProtocoloDto,
  RequirementStatus,
  ChecklistRequirement,
} from '../../../domain/dtos/crear-protocolo.dto';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

/** Largo del título (RF-02.2 del backend), contado sobre el texto recortado. */
const TITULO_MIN = 20;
const TITULO_MAX = 200;

interface StudyType {
  id: number;
  code?: string;
  name?: string;
  nombre?: string;
  description?: string;
}

interface RequiredDocument {
  id?: number;
  code: string;
  nombre: string;
  isRequired: boolean;
  status: RequirementStatus;
  observations: string;
  icon: string;
  alert: string | null;
  color: string;
  _resolvedCode?: string;
  _resolvedName?: string;
  _resolvedId?: number;
}

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
    MatCardModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderComponent,
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
    this.destroyRef.onDestroy(() => this.trabajos.unsubscribe());
  }

  isLoading = false;
  isRequirementsLoading = false;
  isDraftContinuation = false;
  protocolId: number | null = null;

  tiposEstudio: StudyType[] = [];
  /** Paso abierto del stepper: el subtítulo de la página cambia con él (F09 D13). */
  pasoActual = 0;
  readonly subtituloDatos =
    'Primero los datos básicos. Se guarda como borrador; nadie del comité lo ve hasta que lo envíe.';
  readonly subtituloDocumentos =
    'Complete la información básica y cargue la documentación requerida por el CEISH.';
  documentosRequeridos: RequiredDocument[] = [];
  documentUploadStatus: { [key: string]: string } = {};
  archivosCargados: { [key: string]: string } = {};

  generalForm = this.fb.group({
    titulo: ['', trimmedLengthValidator(TITULO_MIN, TITULO_MAX)],
    tipoEstudio: ['', Validators.required],
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
    this.isRequirementsLoading = false;
    this.isDraftContinuation = false;
    this.protocolId = null;
    this.pasoActual = 0;
    this.documentosRequeridos = [];
    this.documentUploadStatus = {};
    this.archivosCargados = {};

    if (this.stepper) {
      this.stepper.reset();
      // reset() deja en false el "completado" que fija abrirPasoRequisitos; null devuelve el paso 1
      // al cálculo normal de CdkStep (formulario válido y paso visitado).
      (this.stepper.steps.first as unknown as { completed: boolean | null }).completed = null;
    }
    this.generalForm.reset({
      titulo: '',
      tipoEstudio: '',
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
          this.isRequirementsLoading = true;
          trabajo.add(
            this.protocoloService.getChecklist(id).subscribe({
              next: (res) => {
                this.processRequirements(this.extractList(res));
                this.isRequirementsLoading = false;
                this.isLoading = false;
                this.abrirPasoRequisitos();
              },
              error: () => {
                this.processRequirements([]);
                this.isRequirementsLoading = false;
                this.isLoading = false;
                this.abrirPasoRequisitos();
              },
            }),
          );
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
   * Motivo visible del botón "Guardar borrador y continuar" deshabilitado (F00 §5: la acción se
   * deshabilita mostrando el motivo). Sin motivo mientras se guarda o con el formulario válido.
   */
  get motivoPasoDatos(): string | null {
    if (this.isLoading || this.generalForm.valid) return null;
    const { titulo, tipoEstudio, isAffidavitAccepted } = this.generalForm.controls;
    const faltan: string[] = [];
    if (titulo.invalid) faltan.push('el título');
    if (tipoEstudio.invalid) faltan.push('el tipo de estudio');
    if (isAffidavitAccepted.invalid) faltan.push('la declaración');
    if (faltan.length === 0) return null;
    const lista =
      faltan.length === 1
        ? faltan[0]
        : `${faltan.slice(0, -1).join(', ')} y ${faltan[faltan.length - 1]}`;
    return `Falta: ${lista}.`;
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

            trabajo.add(
              this.protocoloService.getChecklist(id).subscribe({
                next: (checklistRes) => {
                  this.isLoading = false;
                  const list = this.extractList(checklistRes);
                  this.processRequirements(list);
                  this.stepper.next(); // Avanza al Paso 2 (Documentos)
                },
                error: () => {
                  this.isLoading = false;
                  this.snackBar.open(
                    '⚠️ Protocolo creado, pero hubo un problema al generar la lista oficial.',
                    'Cerrar',
                  );
                  this.processRequirements([]);
                  this.stepper.next();
                },
              }),
            );
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

  public loadRequirements(protocolId?: number) {
    const idToUse = protocolId || this.protocolId;

    if (idToUse) {
      this.isRequirementsLoading = true;
      this.trabajos.add(
        this.protocoloService
          .getChecklist(Number(idToUse))
          .pipe(finalize(() => (this.isRequirementsLoading = false)))
          .subscribe({
            next: (res) => {
              const list = this.extractList(res);
              this.processRequirements(list);
            },
            error: (err) => {
              console.warn('[DEBUG] Error en checklist oficial...', err);
              this.processRequirements([]);
            },
          }),
      );
    }
  }

  private extractList(data: unknown): unknown[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;

    const obj = data as Record<string, unknown>;
    const possibleKeys = [
      'data',
      'results',
      'checklist',
      'requirements',
      'protocolo_requisitos',
      'items',
      'list',
    ];
    for (const key of possibleKeys) {
      if (obj[key] && Array.isArray(obj[key])) {
        return obj[key] as unknown[];
      }
    }

    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }

    return [];
  }

  private processRequirements(list: unknown[]) {
    let isEmergencyMode = false;
    if (list.length === 0) {
      isEmergencyMode = true;
      list = [
        {
          id: 9001,
          code: 'PROTOCOLO_FINAL',
          name: 'Protocolo de Investigación (Requerido)',
          isRequired: true,
        },
        {
          id: 9002,
          code: 'CONSENTIMIENTO',
          name: 'Formulario de Consentimiento Informado',
          isRequired: true,
        },
        { id: 9003, code: 'CV_INVESTIGADORES', name: 'Hojas de Vida del Equipo', isRequired: true },
        { id: 9004, code: 'COMPROMISO_ETICO', name: 'Carta de Compromiso Ético', isRequired: true },
      ];
    }

    const uniqueMap = new Map<string, Record<string, unknown>>();
    list.forEach((rawItem, index) => {
      const item = (typeof rawItem === 'object' && rawItem !== null ? rawItem : {}) as Record<
        string,
        unknown
      >;
      const requirementObj = (item['requirement'] || item['requisito']) as
        Record<string, unknown> | undefined;
      const code = (item['code'] ||
        item['requirementCode'] ||
        item['codigo_requisito'] ||
        requirementObj?.['code'] ||
        requirementObj?.['codigo'] ||
        `GENERIC_${index}`) as string;
      const name = (item['name'] ||
        item['requirementName'] ||
        item['nombre_requisito'] ||
        requirementObj?.['name'] ||
        requirementObj?.['description'] ||
        requirementObj?.['nombre'] ||
        'Documento') as string;
      const id = (item['id'] ||
        item['requirementId'] ||
        requirementObj?.['id'] ||
        requirementObj?.['id']) as number | undefined;

      item['_resolvedCode'] = code;
      item['_resolvedName'] = name;
      item['_resolvedId'] = id;

      if (!uniqueMap.has(code) || item['status'] === RequirementStatus.PRESENTADO) {
        uniqueMap.set(code, item);
      }
    });

    const dedupedList = Array.from(uniqueMap.values());

    this.documentosRequeridos = dedupedList.map((r) => ({
      id: r['_resolvedId'] as number | undefined,
      code: r['_resolvedCode'] as string,
      nombre: isEmergencyMode ? `⚠️ ${r['_resolvedName']}` : (r['_resolvedName'] as string),
      isRequired: r['isRequired'] !== undefined ? (r['isRequired'] as boolean) : true,
      status: (r['status'] || r['estado'] || RequirementStatus.NO_PRESENTADO) as RequirementStatus,
      observations: (r['observations'] || r['observaciones'] || '') as string,
      icon: this.getTechnicalIcon(r['_resolvedCode'] as string),
      alert: isEmergencyMode
        ? 'Modo de emergencia: El servidor no envió requisitos oficiales.'
        : this.getTechnicalAlert(r['_resolvedCode'] as string),
      color: this.getStatusColor((r['status'] || r['estado']) as RequirementStatus),
    }));

    this.documentosRequeridos.forEach((doc) => {
      this.documentUploadStatus[doc.code] =
        doc.status === RequirementStatus.PRESENTADO
          ? 'exito'
          : doc.status === RequirementStatus.OBSERVADO
            ? 'error'
            : 'pendiente';
    });
  }

  private getStatusColor(status: RequirementStatus): string {
    switch (status) {
      case RequirementStatus.PRESENTADO:
        return 'success';
      case RequirementStatus.OBSERVADO:
        return 'warn';
      default:
        return 'primary';
    }
  }

  private getTechnicalIcon(code: string): string {
    if (!code) return 'description';
    const map: Record<string, string> = {
      TRADUCCION_ANCESTRAL: 'translate',
      POLIZA_SEGURO: 'security',
      CONTRATO_PROMOTOR: 'gavel',
      CONSENTIMIENTO: 'verified',
      CV_INVESTIGADORES: 'account_circle',
      CV_IP: 'account_circle',
      PROTOCOLO_FINAL: 'history_edu',
      PROTOCOLO_COMPLETO: 'history_edu',
      GENERIC: 'description',
    };
    return map[code] || 'description';
  }

  private getTechnicalAlert(code: string): string | null {
    if (!code) return null;
    const map: Record<string, string> = {
      TRADUCCION_ANCESTRAL: 'Requisito mandatorio por población indígena.',
      POLIZA_SEGURO: 'Obligatorio para Ensayos Clínicos (AM 0005-2022).',
      CONTRATO_PROMOTOR: 'Acuerdo legal de patrocinio requerido.',
      CONSENTIMIENTO: 'Documento crítico de cumplimiento ético.',
    };
    return map[code] || null;
  }

  onDocumentSelected(event: Event, requirementCode: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.protocolId) return;

    const requirement = this.documentosRequeridos.find((d) => d.code === requirementCode);

    const vigente = this.mismaGeneracion();

    if (!requirement || !requirement.id) {
      this.documentUploadStatus[requirementCode] = 'subiendo';
      this.protocoloService.subirDocumentosBulk(this.protocolId, [file]).subscribe({
        next: () => {
          if (!vigente()) return;
          this.documentUploadStatus[requirementCode] = 'exito';
          this.archivosCargados[requirementCode] = file.name;
        },
        error: () => {
          if (!vigente()) return;
          this.documentUploadStatus[requirementCode] = 'error';
          this.snackBar.open('Error al subir documento.', 'Cerrar');
        },
      });
      return;
    }

    this.documentUploadStatus[requirementCode] = 'subiendo';

    this.protocoloService
      .subirDocumento(file, this.protocolId, requirement.id, requirementCode)
      .subscribe({
        next: () => {
          if (!vigente()) return;
          this.documentUploadStatus[requirementCode] = 'exito';
          this.archivosCargados[requirementCode] = file.name;
          this.loadRequirements();
        },
        error: (err) => {
          if (!vigente()) return;
          console.error('[NuevoProtocoloPage] Error en subirDocumento:', err);
          this.documentUploadStatus[requirementCode] = 'error';
          this.snackBar.open('Error al subir documento técnico.', 'Cerrar');
        },
      });
  }

  /** true mientras la página siga en el mismo protocolo que cuando se llamó. */
  private mismaGeneracion(): () => boolean {
    const generacion = this.generacion;
    return () => generacion === this.generacion;
  }

  onBulkUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: File[] = Array.from(input.files || []);
    if (!files.length || !this.protocolId) return;

    this.isLoading = true;
    const vigente = this.mismaGeneracion();
    this.protocoloService.subirDocumentosBulk(this.protocolId, files).subscribe({
      next: () => {
        if (!vigente()) return;
        this.isLoading = false;
        this.snackBar.open('✅ Archivos cargados exitosamente.', 'Cerrar', { duration: 3000 });

        files.forEach((f) => {
          this.archivosCargados[f.name] = f.name;
        });

        this.loadRequirements(this.protocolId!);
      },
      error: () => {
        if (!vigente()) return;
        this.isLoading = false;
        this.snackBar.open('❌ Error en la carga masiva.', 'Cerrar');
      },
    });
  }

  onEnviarFinal(): void {
    if (!this.protocolId) return;

    const hasFormalRequirements = this.documentosRequeridos.some((d) => !!d.id);

    if (hasFormalRequirements) {
      const pendingMandatory = this.documentosRequeridos.some(
        (d) => d.isRequired && d.status !== RequirementStatus.PRESENTADO,
      );

      if (pendingMandatory) {
        this.snackBar.open('Debe subir todos los documentos marcados como obligatorios.', 'Cerrar');
        return;
      }
    } else {
      if (Object.keys(this.archivosCargados).length === 0) {
        this.snackBar.open('⚠️ Debe subir al menos un documento antes de enviar.', 'Cerrar', {
          duration: 5000,
        });
        return;
      }
    }

    this.isLoading = true;
    const vigente = this.mismaGeneracion();
    this.protocoloService.finalizarProtocolo(this.protocolId).subscribe({
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
