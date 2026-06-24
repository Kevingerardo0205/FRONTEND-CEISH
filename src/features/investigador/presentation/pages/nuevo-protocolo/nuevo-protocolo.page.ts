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
  
  tiposEstudio: any[] = [];
  documentosRequeridos: any[] = [];
  documentUploadStatus: { [key: string]: string } = {};
  archivosCargados: { [key: string]: string } = {};

  generalForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200)]],
    tipoEstudio: ['', Validators.required],
    isAffidavitAccepted: [false, Validators.requiredTrue],
    
    // Characteristics flags
    usesBiologicalSamples: [false, Validators.required],
    isVulnerablePopulation: [false, Validators.required],
    isIndigenousPopulation: [false, Validators.required],
    isMulticentric: [false, Validators.required],
    isExternal: [false, Validators.required]
  });

  ngOnInit(): void {
    console.log('[DEBUG] NuevoProtocoloPage inicializado');
    this.loadStudyTypes();
  }

  private loadStudyTypes() {
    this.protocoloService.getStudyTypes().subscribe({
      next: (types: any) => {
        this.tiposEstudio = Array.isArray(types) ? types : (types?.data || []);
      },
      error: () => this.snackBar.open('Error al cargar tipos de estudio.', 'Cerrar')
    });
  }

  guardarInicial(): void {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      this.snackBar.open('Complete todos los campos obligatorios antes de continuar.', 'Cerrar');
      return;
    }

    this.isLoading = true;
    const user = this.authFacade.currentUser();
    const formVal = this.generalForm.getRawValue();

    const payload: CrearProtocoloDto = {
      title: formVal.titulo!,
      principalInvestigatorId: Number(user?.id),
      studyTypeId: Number(formVal.tipoEstudio),
      riskLevelId: null as any,
      geographicCoverage: null as any,
      studyDurationMonths: null as any,
      
      usesBiologicalSamples: !!formVal.usesBiologicalSamples,
      isVulnerablePopulation: !!formVal.isVulnerablePopulation,
      isIndigenousPopulation: !!formVal.isIndigenousPopulation,
      isMulticentric: !!formVal.isMulticentric,
      hasExternalInstitutions: !!formVal.isExternal,
      
      sponsorRuc: null as any,
      sponsorPhone: null as any,
      sponsorAddress: null as any,
      sponsorWeb: '',
      sponsorExecutingAgency: null as any,
      financingAmount: 0,
      isAffidavitAccepted: !!formVal.isAffidavitAccepted,
      
      investigators: [],
      institutions: []
    };

    this.protocoloService.guardarProtocoloInicial(payload).subscribe({
      next: (res: any) => {
        const id = res?.id || res?.data?.id;
        console.log('[DEBUG] Protocolo creado exitosamente. ID:', id);
        if (id) {
          this.protocolId = id;
          this.snackBar.open('Protocolo registrado. Cargando requisitos oficiales...', 'Info', { duration: 3000 });
          
          this.protocoloService.getChecklist(id).subscribe({
            next: (checklistRes) => {
              this.isLoading = false;
              const list = this.extractList(checklistRes);
              this.processRequirements(list);
              this.stepper.next(); // Avanza al Paso 2 (Documentos)
            },
            error: () => {
              this.isLoading = false;
              this.snackBar.open('⚠️ Protocolo creado, pero hubo un problema al generar la lista oficial.', 'Cerrar');
              this.processRequirements([]);
              this.stepper.next();
            }
          });
        } else {
          this.isLoading = false;
          this.snackBar.open('❌ Error: El servidor no devolvió un ID de protocolo válido.', 'Cerrar');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('❌ Error: ' + (err.message || 'Error de validación al crear el protocolo'), 'Cerrar', { duration: 10000 });
      }
    });
  }

  public loadRequirements(protocolId?: number) {
    const idToUse = protocolId || this.protocolId;
    
    if (idToUse) {
      console.log(`[DEBUG] Consultando checklist oficial para ID: ${idToUse}`);
      this.isRequirementsLoading = true;
      this.protocoloService.getChecklist(Number(idToUse)).pipe(
        finalize(() => this.isRequirementsLoading = false)
      ).subscribe({
        next: (res: any) => {
          const list = this.extractList(res);
          this.processRequirements(list);
        },
        error: (err) => {
          console.warn('[DEBUG] Error en checklist oficial...', err);
          this.processRequirements([]);
        }
      });
    }
  }

  private extractList(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    
    const possibleKeys = ['data', 'results', 'checklist', 'requirements', 'protocolo_requisitos', 'items', 'list'];
    for (const key of possibleKeys) {
      if (data[key] && Array.isArray(data[key])) {
        return data[key];
      }
    }

    for (const key in data) {
      if (Array.isArray(data[key])) return data[key];
    }

    return [];
  }

  private processRequirements(list: any[]) {
    let isEmergencyMode = false;
    if (list.length === 0) {
        isEmergencyMode = true;
        list = [
            { id: 9001, code: 'PROTOCOLO_FINAL', name: 'Protocolo de Investigación (Requerido)', isRequired: true },
            { id: 9002, code: 'CONSENTIMIENTO', name: 'Formulario de Consentimiento Informado', isRequired: true },
            { id: 9003, code: 'CV_INVESTIGADORES', name: 'Hojas de Vida del Equipo', isRequired: true },
            { id: 9004, code: 'COMPROMISO_ETICO', name: 'Carta de Compromiso Ético', isRequired: true }
        ];
    }

    const uniqueMap = new Map<string, any>();
    list.forEach((item, index) => {
      const code = item.code || item.requirementCode || item.codigo_requisito || item.requirement?.code || item.requisito?.codigo || `GENERIC_${index}`;
      const name = item.name || item.requirementName || item.nombre_requisito || item.requirement?.name || item.requirement?.description || item.requisito?.nombre || 'Documento';
      const id = item.id || item.requirementId || item.requirement?.id || item.requisito?.id;
      
      item._resolvedCode = code;
      item._resolvedName = name;
      item._resolvedId = id;

      if (!uniqueMap.has(code) || item.status === RequirementStatus.PRESENTADO) {
        uniqueMap.set(code, item);
      }
    });

    const dedupedList = Array.from(uniqueMap.values());

    this.documentosRequeridos = dedupedList.map((r: any) => ({
      id: r._resolvedId,
      code: r._resolvedCode,
      nombre: isEmergencyMode ? `⚠️ ${r._resolvedName}` : r._resolvedName,
      isRequired: r.isRequired !== undefined ? r.isRequired : true,
      status: r.status || r.estado || RequirementStatus.NO_PRESENTADO,
      observations: r.observations || r.observaciones || '',
      icon: this.getTechnicalIcon(r._resolvedCode),
      alert: isEmergencyMode ? 'Modo de emergencia: El servidor no envió requisitos oficiales.' : this.getTechnicalAlert(r._resolvedCode),
      color: this.getStatusColor(r.status || r.estado)
    }));

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
      'CV_IP': 'account_circle',
      'PROTOCOLO_FINAL': 'history_edu',
      'PROTOCOLO_COMPLETO': 'history_edu',
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
    
    if (!requirement || !requirement.id) {
        this.documentUploadStatus[requirementCode] = 'subiendo';
        this.protocoloService.subirDocumentosBulk(this.protocolId, [file]).subscribe({
            next: () => {
                this.documentUploadStatus[requirementCode] = 'exito';
                this.archivosCargados[requirementCode] = file.name;
            },
            error: () => {
                this.documentUploadStatus[requirementCode] = 'error';
                this.snackBar.open('Error al subir documento.', 'Cerrar');
            }
        });
        return;
    }

    this.documentUploadStatus[requirementCode] = 'subiendo';
    
    this.protocoloService.subirDocumento(file, this.protocolId, requirement.id, requirementCode).subscribe({
      next: () => {
        this.documentUploadStatus[requirementCode] = 'exito';
        this.archivosCargados[requirementCode] = file.name;
        this.loadRequirements(); 
      },
      error: (err) => {
        console.error('[NuevoProtocoloPage] Error en subirDocumento:', err);
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
        
        files.forEach(f => {
           this.archivosCargados[f.name] = f.name;
        });

        this.loadRequirements(this.protocolId!);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('❌ Error en la carga masiva.', 'Cerrar');
      }
    });
  }

  onEnviarFinal(): void {
    if (!this.protocolId) return;
    
    const hasFormalRequirements = this.documentosRequeridos.some(d => !!d.id);

    if (hasFormalRequirements) {
        const pendingMandatory = this.documentosRequeridos.some(d => d.isRequired && d.status !== RequirementStatus.PRESENTADO);
        
        if (pendingMandatory) {
          this.snackBar.open('Debe subir todos los documentos marcados como obligatorios.', 'Cerrar');
          return;
        }
    } else {
        if (Object.keys(this.archivosCargados).length === 0) {
            this.snackBar.open('⚠️ Debe subir al menos un documento antes de enviar.', 'Cerrar', { duration: 5000 });
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
