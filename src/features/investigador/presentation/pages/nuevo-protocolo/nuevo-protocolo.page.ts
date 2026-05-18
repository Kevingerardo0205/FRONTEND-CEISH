import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProtocoloService } from '../../../application/services/protocolo.service';
import { CrearProtocoloDto, InvestigadorEquipo, InstitucionParticipante, EstadoProtocolo, ChecklistRequirement, RequirementStatus } from '../../../domain/dtos/crear-protocolo.dto';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// --- Validadores Técnicos ---

export function ecuadorianPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const valid = /^(09\d{8}|0[2-7]\d{7})$/.test(control.value);
  return valid ? null : { invalidPhone: true };
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
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatStepperModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, 
    MatCardModule, MatCheckboxModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule,
    MatToolbarModule, MatTooltipModule, MatProgressBarModule
  ],
  templateUrl: './nuevo-protocolo.page.html',
  styleUrls: ['./nuevo-protocolo.page.scss']
})
export class NuevoProtocoloPage implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly fb = inject(FormBuilder);
  private readonly protocoloService = inject(ProtocoloService);
  private readonly authFacade = inject(AuthFacade);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  isLoading = false;
  isRequirementsLoading = false;
  protocolId: number | null = null;
  
  readonly coberturas = ['Local (Cantonal)', 'Provincial (Chimborazo)', 'Zonal / Regional', 'Nacional'];
  readonly funcionesEquipo = ['Investigador Principal', 'Coinvestigador', 'Tutor / Director', 'Asistente de Investigación', 'Estudiante'];
  
  tiposEstudio: any[] = [];
  nivelesRiesgo: any[] = [];
  documentosRequeridos: any[] = [];
  documentUploadStatus: { [key: string]: string } = {};
  archivosCargados: { [key: string]: string } = {};

  generalForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200)]],
    tipoEstudio: ['', Validators.required],
    riskLevelId: ['', Validators.required],
    coberturaGeografica: ['', Validators.required],
    duracionMeses: [1, [Validators.required, Validators.min(1), Validators.max(120)]],
    
    // Interruptores Legales (Mandatorios para Sprint 3)
    usesBiologicalSamples: [false, Validators.required],
    isVulnerablePopulation: [false, Validators.required],
    isIndigenousPopulation: [false, Validators.required],
    isMulticentric: [false, Validators.required],
    isExternal: [false, Validators.required],
    
    sponsorRuc: ['', [Validators.required, ecuadorianIdValidator]],
    sponsorPhone: ['', [Validators.required, ecuadorianPhoneValidator]],
    sponsorAddress: ['', [Validators.required, Validators.minLength(5)]],
    sponsorWeb: [''],
    executingOrgan: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]]
  });

  teamForm = this.fb.group({
    equipoInvestigador: this.fb.array([])
  });

  institutionsForm = this.fb.group({
    instituciones: this.fb.array([])
  });

  documentsForm = this.fb.group({});

  finishForm = this.fb.group({
    isAffidavitAccepted: [false, Validators.requiredTrue]
  });

  get equipoInvestigador() { return this.teamForm.get('equipoInvestigador') as FormArray; }
  get instituciones() { return this.institutionsForm.get('instituciones') as FormArray; }

  ngOnInit(): void {
    console.log('[DEBUG] NuevoProtocoloPage inicializado');
    this.addInvestigadorPrincipal();
    this.addInstitucion();
    this.loadStudyTypes();
    this.loadRiskLevels();

    // Reaccionamos a cambios para actualizar requisitos dinámicamente (Paso 1: Antes de guardar)
    const fieldsToWatch = [
      'tipoEstudio', 'riskLevelId', 'usesBiologicalSamples', 
      'isVulnerablePopulation', 'isIndigenousPopulation', 
      'isMulticentric', 'isExternal'
    ];

    fieldsToWatch.forEach(field => {
      this.generalForm.get(field)?.valueChanges.subscribe(() => {
        if (!this.protocolId) {
          console.log(`[DEBUG] Campo ${field} cambió, recargando requisitos dinámicos...`);
          this.loadRequirements();
        }
      });
    });
  }

  private loadStudyTypes() {
    this.protocoloService.getStudyTypes().subscribe({
      next: (types: any) => {
        this.tiposEstudio = Array.isArray(types) ? types : (types?.data || []);
      },
      error: () => this.snackBar.open('Error al cargar tipos de estudio.', 'Cerrar')
    });
  }

  private loadRiskLevels() {
    this.protocoloService.getRiskLevels().subscribe({
      next: (levels: any) => {
        this.nivelesRiesgo = Array.isArray(levels) ? levels : (levels?.data || []);
      },
      error: () => this.snackBar.open('Error al cargar niveles de riesgo.', 'Cerrar')
    });
  }

  private addInvestigadorPrincipal() {
    const user = this.authFacade.currentUser();
    this.equipoInvestigador.push(this.fb.group({
      funcion: [{value: 'Investigador Principal', disabled: true}, Validators.required],
      nombreCompleto: [user?.nombre || '', [Validators.required, Validators.minLength(5)]],
      cedula: ['', [Validators.required, ecuadorianIdValidator]],
      formacion: ['', [Validators.required, Validators.minLength(3)]],
      entidad: [{value: 'ESPOCH', disabled: false}, Validators.required],
      correo: [user?.email || '', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, ecuadorianPhoneValidator]],
      cvFile: [null, Validators.required]
    }));
  }

  addMiembro() {
    this.equipoInvestigador.push(this.fb.group({
      funcion: ['', Validators.required],
      nombreCompleto: ['', [Validators.required, Validators.minLength(5)]],
      cedula: ['', [Validators.required, ecuadorianIdValidator]],
      formacion: ['', [Validators.required, Validators.minLength(3)]],
      entidad: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, ecuadorianPhoneValidator]],
      cvFile: [null, Validators.required]
    }));
  }

  removeMiembro(index: number) { if (index > 0) this.equipoInvestigador.removeAt(index); }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) this.equipoInvestigador.at(index).get('cvFile')?.setValue(file);
  }

  addInstitucion() {
    this.instituciones.push(this.fb.group({
      nombre: ['', Validators.required],
      tipo: ['PUBLICA', Validators.required],
      direccion: ['', Validators.required],
      contacto: ['', [Validators.required, Validators.minLength(5)]]
    }));
  }

  removeInstitucion(index: number) { if (this.instituciones.length > 1) this.instituciones.removeAt(index); }

  guardarInicial(): void {
    if (this.generalForm.invalid || this.teamForm.invalid || this.institutionsForm.invalid) {
      this.generalForm.markAllAsTouched();
      this.teamForm.markAllAsTouched();
      this.institutionsForm.markAllAsTouched();
      this.snackBar.open('Complete todos los campos obligatorios.', 'Cerrar');
      return;
    }

    this.isLoading = true;

    const user = this.authFacade.currentUser();

    const coverageMap: { [key: string]: string } = {
      'Local (Cantonal)': 'LOCAL',
      'Provincial (Chimborazo)': 'PROVINCIAL',
      'Zonal / Regional': 'ZONAL',
      'Nacional': 'NACIONAL'
    };

    const formVal = this.generalForm.getRawValue();

    const payload: CrearProtocoloDto = {
      title: formVal.titulo!,
      principalInvestigatorId: Number(user?.id),
      studyTypeId: Number(formVal.tipoEstudio),
      riskLevelId: Number(formVal.riskLevelId),
      geographicCoverage: coverageMap[formVal.coberturaGeografica!] || 'LOCAL',
      studyDurationMonths: Number(formVal.duracionMeses),
      
      // Flags Mandatorios S3
      usesBiologicalSamples: !!formVal.usesBiologicalSamples,
      isVulnerablePopulation: !!formVal.isVulnerablePopulation,
      isIndigenousPopulation: !!formVal.isIndigenousPopulation,
      isMulticentric: !!formVal.isMulticentric,
      
      hasExternalInstitutions: !!formVal.isExternal,
      sponsorRuc: formVal.sponsorRuc!,
      sponsorPhone: formVal.sponsorPhone!,
      sponsorAddress: formVal.sponsorAddress!,
      sponsorWeb: formVal.sponsorWeb || '',
      sponsorExecutingAgency: formVal.executingOrgan!,
      financingAmount: Number(formVal.amount),
      isAffidavitAccepted: true,
      
      investigators: this.equipoInvestigador.getRawValue()
        .filter((_, index) => index > 0) 
        .map(inv => ({
          fullName: inv.nombreCompleto,
          identification: inv.cedula,
          position: inv.funcion,
          institution: inv.entidad,
          email: inv.correo,
          phone: inv.celular,
          education: inv.formacion,
          role: 'CO_INVESTIGADOR'
        })),
      
      institutions: this.instituciones.getRawValue().map(inst => ({
        name: inst.nombre,
        type: inst.tipo === 'PUBLICA' ? 'PUBLIC' : 'PRIVATE',
        address: inst.direccion,
        contactPerson: inst.contacto
      }))
    };

    this.protocoloService.guardarProtocoloInicial(payload).subscribe({
      next: (res: any) => {
        const id = res?.id || res?.data?.id;
        console.log('[DEBUG] Protocolo creado exitosamente. ID:', id);
        if (id) {
          this.protocolId = id;
          this.snackBar.open('Generando requisitos... por favor espere.', 'Info', { duration: 3000 });
          setTimeout(() => {
            this.protocoloService.getChecklist(id).subscribe({
              next: (checklistRes) => {
                const list = this.extractList(checklistRes);
                this.processRequirements(list);
                this.uploadAllCVs(id);
              },
              error: () => {
                this.isLoading = false;
                this.snackBar.open('⚠️ Protocolo creado, pero hubo un problema al cargar requisitos oficiales.', 'Cerrar');
                // IMPORTANTE: Incluso si falla, intentar procesar una lista de emergencia
                this.processRequirements([]);
                this.uploadAllCVs(id);
              }
            });
          }, 3000);
        } else {
          this.isLoading = false;
          this.snackBar.open('❌ Error: El servidor no devolvió un ID válido.', 'Cerrar');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('❌ Error: ' + (err.message || 'Error de validación'), 'Cerrar', { duration: 10000 });
      }
    });
  }

  private uploadAllCVs(protocolId: number) {
    if (!protocolId) {
      this.isLoading = false;
      return;
    }

    const CV_REQUIREMENT_CODE = 'CV_INVESTIGADORES';
    const requirement = this.documentosRequeridos.find(d => d.code === CV_REQUIREMENT_CODE);

    const cvFiles = this.equipoInvestigador.controls
      .map(control => control.get('cvFile')?.value)
      .filter(file => !!file) as File[];

    if (!requirement || !requirement.id) {
      console.warn(`[DEBUG] No se encontró el ID para el requisito ${CV_REQUIREMENT_CODE}. Usando carga masiva de contingencia.`);
      
      if (cvFiles.length > 0) {
        this.protocoloService.subirDocumentosBulk(protocolId, cvFiles).subscribe({
          next: () => {
            this.isLoading = false;
            this.snackBar.open('Hojas de vida cargadas (Modo Resiliente).', 'OK');
            this.stepper.next();
          },
          error: () => {
            this.isLoading = false;
            this.snackBar.open('Error al subir CVs, verifique manualmente.', 'Aviso');
            this.stepper.next();
          }
        });
      } else {
        this.isLoading = false;
        this.stepper.next();
      }
      return;
    }

    const uploads = cvFiles.map((file, index) => {
      return this.protocoloService.subirDocumento(file, protocolId, requirement.id!).pipe(
        catchError(err => {
          console.error(`[DEBUG] Error subiendo CV #${index}:`, err);
          return of(null);
        })
      );
    });

    forkJoin(uploads).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Información guardada. Verifique los checks verdes en documentos.', 'OK', { duration: 4000 });
        this.stepper.next();
      }
    });
  }

  public loadRequirements(protocolId?: number) {
    const idToUse = protocolId || this.protocolId;
    
    // Si ya existe el protocolo, consultamos su checklist oficial
    if (idToUse) {
      console.log(`[DEBUG] Consultando checklist oficial para ID: ${idToUse}`);
      this.isRequirementsLoading = true;
      this.protocoloService.getChecklist(Number(idToUse)).pipe(
        finalize(() => this.isRequirementsLoading = false)
      ).subscribe({
        next: (res: any) => {
          console.log('[DEBUG] Respuesta checklist backend (directo):', res);
          const list = this.extractList(res);
          this.processRequirements(list);
        },
        error: (err) => {
          console.warn('[DEBUG] Error en checklist oficial, usando fallback dinámico...', err);
          this.loadDynamicRequirements();
        }
      });
    } else {
      // Si no existe, usamos la lógica dinámica (Preview)
      this.loadDynamicRequirements();
    }
  }

  private loadDynamicRequirements() {
    const formVal = this.generalForm.getRawValue();
    if (!formVal.tipoEstudio) {
      console.log('[DEBUG] loadDynamicRequirements abortado: No hay tipoEstudio seleccionado.');
      return;
    }

    this.isRequirementsLoading = true;
    console.log('[DEBUG] Cargando requisitos dinámicos (Modo Preview)...');

    // Mapeo robusto de flags
    let typeCode = formVal.tipoEstudio as any;
    
    // Si tiposEstudio aún no ha cargado del backend, usamos un mapa de respaldo (IDs típicos de la base de datos)
    const fallbackTypes: Record<string, string> = {
      '1': 'IO',
      '2': 'EI',
      '3': 'EC'
    };

    if (!isNaN(Number(typeCode))) {
      const typeCodeAsNumber = Number(typeCode);
      const typeObj = this.tiposEstudio.find(t => t.id === typeCodeAsNumber);
      if (typeObj) {
        typeCode = typeObj.code || typeObj.codigo || typeCode;
      } else if (fallbackTypes[String(typeCode)]) {
        typeCode = fallbackTypes[String(typeCode)];
      }
    }

    // Riesgo Mayor: Si el ID es > 1 o el código no es MINIMO
    const riskObj = this.nivelesRiesgo.find(l => l.id === Number(formVal.riskLevelId));
    const riesgoMayor = riskObj ? (riskObj.code !== 'MINIMO' && riskObj.id !== 1) : false;

    console.log(`[DEBUG] Llamando API requisitos con params: tipo=${typeCode}, muestras=${!!formVal.usesBiologicalSamples}, vulnerable=${!!formVal.isVulnerablePopulation}, indigena=${!!formVal.isIndigenousPopulation}, multicentrico=${!!formVal.isMulticentric}, riesgoMayor=${riesgoMayor}, institucionesPublicas=${!!formVal.isExternal}`);

    this.protocoloService.getRequisitos(
      typeCode,
      !!formVal.usesBiologicalSamples,
      !!formVal.isVulnerablePopulation,
      !!formVal.isIndigenousPopulation,
      !!formVal.isMulticentric,
      riesgoMayor,
      !!formVal.isExternal
    ).pipe(
      finalize(() => this.isRequirementsLoading = false)
    ).subscribe({
      next: (reqs) => {
        console.log('[DEBUG] Respuesta de getRequisitos dinámicos:', reqs);
        const list = this.extractList(reqs);
        this.processRequirements(list);
      },
      error: (err) => {
        console.error('[DEBUG] Error cargando requisitos dinámicos:', err);
        this.processRequirements([]); // Forzar lista de emergencia
      }
    });
  }

  private extractList(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    
    // El backend a veces envuelve la data en .data, .results, .checklist, etc.
    const possibleKeys = ['data', 'results', 'checklist', 'requirements', 'protocolo_requisitos', 'items', 'list'];
    for (const key of possibleKeys) {
      if (data[key] && Array.isArray(data[key])) {
        return data[key];
      }
    }

    // Si es un objeto pero no tiene las claves anteriores, buscar recursivamente en el primer nivel
    for (const key in data) {
      if (Array.isArray(data[key])) return data[key];
    }

    return [];
  }

  private processRequirements(list: any[]) {
    console.log('[DEBUG] Mapeando requisitos para la UI. Cantidad inicial:', list.length);
    
    let isEmergencyMode = false;
    // ESTRATEGIA DE EMERGENCIA: Si el backend devuelve 0 (por error 403 o falta de config),
    // inyectamos los requisitos mínimos universales para no bloquear al usuario.
    if (list.length === 0) {
        console.warn('[DEBUG] Checklist vacío del backend. Inyectando requisitos de emergencia.');
        isEmergencyMode = true;
        list = [
            { id: 9001, code: 'PROTOCOLO_FINAL', name: 'Protocolo de Investigación (Requerido)', isRequired: true },
            { id: 9002, code: 'CONSENTIMIENTO', name: 'Formulario de Consentimiento Informado', isRequired: true },
            { id: 9003, code: 'CV_INVESTIGADORES', name: 'Hojas de Vida del Equipo', isRequired: true },
            { id: 9004, code: 'COMPROMISO_ETICO', name: 'Carta de Compromiso Ético', isRequired: true }
        ];
    }

    // Deduplicar por requirementCode para evitar duplicados visuales
    const uniqueMap = new Map<string, any>();
    
    list.forEach((item, index) => {
      // Prioridad según Guía Técnica v2: code y name
      const code = item.code || item.requirementCode || item.codigo_requisito || item.requirement?.code || item.requisito?.codigo || `GENERIC_${index}`;
      const name = item.name || item.requirementName || item.nombre_requisito || item.requirement?.name || item.requirement?.description || item.requisito?.nombre || 'Documento';
      const id = item.id || item.requirementId || item.requirement?.id || item.requisito?.id;
      
      // Guardamos temporalmente en el item para usarlo de forma unificada después
      item._resolvedCode = code;
      item._resolvedName = name;
      item._resolvedId = id;

      // Mantenemos la entrada si no existe o si la nueva tiene un estado más avanzado (PRESENTADO)
      if (!uniqueMap.has(code) || item.status === RequirementStatus.PRESENTADO) {
        uniqueMap.set(code, item);
      }
    });

    const dedupedList = Array.from(uniqueMap.values());

    this.documentosRequeridos = dedupedList.map((r: any) => ({
      id: r._resolvedId,
      code: r._resolvedCode,
      nombre: isEmergencyMode ? `⚠️ ${r._resolvedName}` : r._resolvedName,
      isRequired: r.isRequired !== undefined ? r.isRequired : true, // Soportar isRequired de Guía v2
      status: r.status || r.estado || RequirementStatus.NO_PRESENTADO,
      observations: r.observations || r.observaciones || '',
      icon: this.getTechnicalIcon(r._resolvedCode),
      alert: isEmergencyMode ? 'Modo de emergencia: El servidor no envió requisitos oficiales.' : this.getTechnicalAlert(r._resolvedCode),
      color: this.getStatusColor(r.status || r.estado)
    }));

    console.log(`[DEBUG] ${this.documentosRequeridos.length} requisitos procesados.`);

    this.documentosRequeridos.forEach(doc => {
      this.documentUploadStatus[doc.code] = doc.status === RequirementStatus.PRESENTADO ? 'exito' : (doc.status === RequirementStatus.OBSERVADO ? 'error' : 'pendiente');
    });
  }

  private getStatusColor(status: RequirementStatus): string {
    switch (status) {
      case RequirementStatus.PRESENTADO: return 'success';
      case RequirementStatus.OBSERVADO: return 'warn';
      default: return 'primary';
    }
  }

  private getTechnicalIcon(code: string): string {
    if (!code) return 'description';
    const map: Record<string, string> = {
      'TRADUCCION_ANCESTRAL': 'translate',
      'POLIZA_SEGURO': 'security',
      'CONTRATO_PROMOTOR': 'gavel',
      'CONSENTIMIENTO': 'verified',
      'CV_INVESTIGADORES': 'account_circle',
      'PROTOCOLO_FINAL': 'history_edu',
      'GENERIC': 'description'
    };
    return map[code] || 'description';
  }

  private getTechnicalAlert(code: string): string | null {
    if (!code) return null;
    const map: Record<string, string> = {
      'TRADUCCION_ANCESTRAL': 'Requisito mandatorio por población indígena.',
      'POLIZA_SEGURO': 'Obligatorio para Ensayos Clínicos (AM 0005-2022).',
      'CONTRATO_PROMOTOR': 'Acuerdo legal de patrocinio requerido.',
      'CONSENTIMIENTO': 'Documento crítico de cumplimiento ético.'
    };
    return map[code] || null;
  }

  onDocumentSelected(event: any, requirementCode: string) {
    const file = event.target.files[0];
    if (!file || !this.protocolId) return;

    const requirement = this.documentosRequeridos.find(d => d.code === requirementCode);
    
    // Fallback: Si no hay requirementId, usar bulk upload interno
    if (!requirement || !requirement.id) {
        this.documentUploadStatus[requirementCode] = 'subiendo';
        this.protocoloService.subirDocumentosBulk(this.protocolId, [file]).subscribe({
            next: () => {
                this.documentUploadStatus[requirementCode] = 'exito';
                this.archivosCargados[requirementCode] = file.name;
            },
            error: () => {
                this.documentUploadStatus[requirementCode] = 'error';
                this.snackBar.open('Error al subir documento huérfano.', 'Cerrar');
            }
        });
        return;
    }

    this.documentUploadStatus[requirementCode] = 'subiendo';
    
    this.protocoloService.subirDocumento(file, this.protocolId, requirement.id).subscribe({
      next: () => {
        this.documentUploadStatus[requirementCode] = 'exito';
        this.archivosCargados[requirementCode] = file.name;
        this.loadRequirements(); 
      },
      error: (err) => {
        this.documentUploadStatus[requirementCode] = 'error';
        this.snackBar.open('Error al subir documento técnico.', 'Cerrar');
      }
    });
  }

  onBulkUpload(event: any) {
    const files: File[] = Array.from(event.target.files);
    if (!files.length || !this.protocolId) return;

    this.isLoading = true;
    this.protocoloService.subirDocumentosBulk(this.protocolId, files).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('✅ Archivos cargados exitosamente.', 'Cerrar', { duration: 3000 });
        
        // Guardamos un registro manual de los archivos cargados si no hay requerimientos
        files.forEach(f => {
           this.archivosCargados[f.name] = f.name;
        });

        this.loadRequirements(this.protocolId!);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('❌ Error en la carga masiva.', 'Cerrar');
      }
    });
  }

  onEnviarFinal(): void {
    if (!this.protocolId) return;
    
    // Verificación de integridad:
    // Si el backend devolvió requisitos, validamos obligatorios.
    // Si el backend falló (documentosRequeridos vacíos), permitimos el envío 
    // SOLO SI el investigador subió al menos un archivo por el canal de contingencia (bulk upload)
    
    // Consideramos "vaciío" si solo tiene los de emergencia pero sin ID
    const hasFormalRequirements = this.documentosRequeridos.some(d => !!d.id);

    if (hasFormalRequirements) {
        const pendingMandatory = this.documentosRequeridos.some(d => d.isRequired && d.status !== RequirementStatus.PRESENTADO);
        
        if (pendingMandatory) {
          this.snackBar.open('Debe subir todos los documentos marcados como obligatorios.', 'Cerrar');
          return;
        }
    } else {
        // Validación de contingencia
        if (Object.keys(this.archivosCargados).length === 0) {
            this.snackBar.open('⚠️ Debe subir al menos un documento (Protocolo) antes de enviar.', 'Cerrar', { duration: 5000 });
            return;
        }
    }

    this.isLoading = true;
    this.protocoloService.finalizarProtocolo(this.protocolId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const codigo = res?.code || res?.data?.code || 'CEISH-GEN-001';
        this.snackBar.open(`✅ Protocolo ${codigo} enviado exitosamente.`, 'Cerrar', { duration: 5000 });
        this.router.navigate(['/investigador/mis-protocolos']);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error final: ' + (err.message || 'No se pudo completar el registro'), 'Cerrar');
      }
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) event.preventDefault();
  }
}
