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
import { CrearProtocoloDto, InvestigadorEquipo, InstitucionParticipante, EstadoProtocolo } from '../../../domain/dtos/crear-protocolo.dto';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { TipoEstudio, RequisitoDocumento, getRequisitosPorTipoEstudio } from '../../../constants/anexos-pet.constants';
import { forkJoin, of } from 'rxjs';

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
  protocolId: number | null = null;
  
  readonly coberturas = ['Local (Cantonal)', 'Provincial (Chimborazo)', 'Regional', 'Nacional', 'Internacional'];
  readonly funcionesEquipo = ['Investigador Principal', 'Coinvestigador', 'Tutor / Director', 'Asistente de Investigación', 'Estudiante'];
  
  tiposEstudio: any[] = [];
  nivelesRiesgo: any[] = [];
  documentosRequeridos: RequisitoDocumento[] = [];
  documentUploadStatus: { [key: string]: string } = {};
  archivosCargados: { [key: string]: string } = {};

  generalForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200)]],
    tipoEstudio: ['', Validators.required],
    riskLevelId: ['', Validators.required],
    coberturaGeografica: ['', Validators.required],
    duracionMeses: [1, [Validators.required, Validators.min(1), Validators.max(120)]],
    usesBiologicalSamples: [false],
    isVulnerablePopulation: [false],
    isMulticentric: [false],
    isExternal: [false],
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
    this.addInvestigadorPrincipal();
    this.addInstitucion();
    this.loadStudyTypes();
    this.loadRiskLevels();

    this.generalForm.get('tipoEstudio')?.valueChanges.subscribe(() => this.loadRequirements());
    this.generalForm.get('usesBiologicalSamples')?.valueChanges.subscribe(() => this.loadRequirements());
    this.generalForm.get('isVulnerablePopulation')?.valueChanges.subscribe(() => this.loadRequirements());
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
      'Regional': 'PROVINCIAL',
      'Nacional': 'NACIONAL',
      'Internacional': 'INTERNACIONAL'
    };

    const formVal = this.generalForm.getRawValue();

    const payload: CrearProtocoloDto = {
      title: formVal.titulo!,
      principalInvestigatorId: Number(user?.id), // CORRECCIÓN: Forzar Number
      studyTypeId: Number(formVal.tipoEstudio),
      riskLevelId: Number(formVal.riskLevelId),
      geographicCoverage: coverageMap[formVal.coberturaGeografica!] || 'LOCAL',
      studyDurationMonths: Number(formVal.duracionMeses),
      usesBiologicalSamples: !!formVal.usesBiologicalSamples,
      isVulnerablePopulation: !!formVal.isVulnerablePopulation,
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

    console.log('Enviando Payload Corregido:', payload);

    this.protocoloService.guardarProtocoloInicial(payload).subscribe({
      next: (res: any) => {
        const id = res?.id || res?.data?.id;
        if (id) {
          this.protocolId = id;
          this.uploadAllCVs(id);
          // Refrescamos requisitos ahora que el protocolo existe
          this.loadRequirements(id);
        } else {
          this.isLoading = false;
          this.snackBar.open('❌ Error: El servidor no devolvió un ID válido.', 'Cerrar');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.log('--- ERROR DEL BACKEND ---');
        console.table(err.error?.message || err.error);
        
        const backendError = err.response?.data || err.error;
        const serverMessage = backendError?.message;
        const errorToShow = Array.isArray(serverMessage) ? serverMessage[0] : (serverMessage || 'Error de validación');

        this.snackBar.open('❌ Error: ' + errorToShow, 'Cerrar', { duration: 10000 });
      }
    });
  }

  private uploadAllCVs(protocolId: number) {
    if (!protocolId) {
      this.isLoading = false;
      return;
    }

    // ID real del catálogo de documentos para los CVs
    const CV_TYPE_ID = 4;

    const uploads = this.equipoInvestigador.controls.map((control, index) => {
      const file = control.get('cvFile')?.value;
      if (file) {
        // ENVIAMOS JSON EN LUGAR DE FORMDATA
        const payload = {
          protocolId: protocolId,
          fileName: file.name,
          path: `/uploads/protocols/${protocolId}/cv_${index}_${file.name}`,
          sizeBytes: file.size,
          documentTypeId: CV_TYPE_ID
        };
        return this.protocoloService.subirDocumento(payload);
      }
      return of(null);
    });

    forkJoin(uploads).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Información y CVs guardados exitosamente.', 'OK', { duration: 3000 });
        this.stepper.next();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error subiendo CVs:', err);
        this.snackBar.open('Protocolo creado pero falló la subida de algunos CVs. ' + (err.error?.message || ''), 'Cerrar');
        this.stepper.next();
      }
    });
  }

  private loadRequirements(protocolId?: number) {
    const studyTypeId = this.generalForm.get('tipoEstudio')?.value;
    if (!studyTypeId) return;

    // BUSCAR EL CÓDIGO (IO, EI, EC) basado en el ID seleccionado
    const selectedType = this.tiposEstudio.find(t => t.id === Number(studyTypeId));
    const codigoTipo = selectedType ? (selectedType.codigo || selectedType.code) : '';

    if (!codigoTipo) {
      console.warn('No se encontró el código para el tipo de estudio:', studyTypeId);
      return;
    }

    const muestras = !!this.generalForm.get('usesBiologicalSamples')?.value;
    const vulnerable = !!this.generalForm.get('isVulnerablePopulation')?.value;

    console.log('Cargando requisitos para:', { codigoTipo, muestras, vulnerable, protocolId });

    // Si ya tenemos protocolId, intentamos traerlos del protocolo específico
    const request = protocolId 
      ? this.protocoloService.obtenerRequisitosDeProtocolo(protocolId)
      : this.protocoloService.getRequisitos(codigoTipo, muestras, vulnerable);

    request.subscribe({
      next: (reqs: any) => {
        // Forzamos que se reconozca el array
        let requirementsArray = Array.isArray(reqs) ? reqs : (reqs?.data || []);
        
        // Mapeo si vienen con nombres de campos de base de datos (codigo_requisito -> id)
        if (requirementsArray.length > 0 && requirementsArray[0].codigo_requisito) {
          requirementsArray = requirementsArray.map((r: any) => ({
            id: r.id || r.codigo_requisito,
            nombre: r.nombre_requisito || r.nombre,
            anexo: r.anexo || 'Requisito',
            formatosAceptados: ['application/pdf'],
            maxSizeMB: 10
          }));
        }

        // FALLBACK LOCAL SI EL BACKEND SIGUE VACÍO
        if (requirementsArray.length === 0) {
          console.warn('Backend devolvió requisitos vacíos, usando fallback local.');
          requirementsArray = getRequisitosPorTipoEstudio(codigoTipo as TipoEstudio);
        }

        this.documentosRequeridos = requirementsArray;
        console.log('Documentos cargados:', this.documentosRequeridos);

        if (this.documentosRequeridos.length > 0) {
          this.documentosRequeridos.forEach((doc: any) => {
            if (!this.documentUploadStatus[doc.id]) this.documentUploadStatus[doc.id] = 'pendiente';
          });
        }
      },
      error: (err) => {
        console.error('Error cargando requisitos:', err);
        // Fallback local en caso de error
        this.documentosRequeridos = getRequisitosPorTipoEstudio(codigoTipo as TipoEstudio);
      }
    });
  }

  onDocumentSelected(event: any, docId: string) {
    const file = event.target.files[0];
    if (!file || !this.protocolId) return;

    this.documentUploadStatus[docId] = 'subiendo';
    
    // Mapeo manual de IDs locales (strings) a IDs de backend (números)
    // Intentamos parsear a número, si no, usamos 1 como default (o mapeamos según código si supiéramos)
    const numericDocId = parseInt(docId);
    
    // ENVIAMOS JSON EN LUGAR DE FORMDATA para que el backend lo entienda sin Multer
    const payload = {
      protocolId: this.protocolId,
      fileName: file.name,
      path: `/uploads/protocols/${this.protocolId}/${file.name}`, // Ruta simulada
      sizeBytes: file.size,
      documentTypeId: isNaN(numericDocId) ? 1 : numericDocId 
    };

    console.log('Subiendo documento:', payload);

    this.protocoloService.subirDocumento(payload).subscribe({
      next: () => {
        this.documentUploadStatus[docId] = 'exito';
        this.archivosCargados[docId] = file.name;
      },
      error: (err) => {
        this.documentUploadStatus[docId] = 'error';
        console.error('Error subiendo documento:', err);
        this.snackBar.open('Error al subir documento técnico.', 'Cerrar');
      }
    });
  }

  onEnviarFinal(): void {
    if (!this.protocolId) return;
    const requiredPending = this.documentosRequeridos.some(d => !d.esCondicional && this.documentUploadStatus[d.id] !== 'exito');
    if (requiredPending) {
      this.snackBar.open('Debe subir todos los documentos obligatorios.', 'Cerrar');
      return;
    }

    this.isLoading = true;
    this.protocoloService.finalizarProtocolo(this.protocolId).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('✅ Solicitud enviada al CEISH. Código generado.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/investigador/mis-protocolos']);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error final: ' + (err.error?.message || 'No se pudo completar el registro'), 'Cerrar');
      }
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) event.preventDefault();
  }
}
