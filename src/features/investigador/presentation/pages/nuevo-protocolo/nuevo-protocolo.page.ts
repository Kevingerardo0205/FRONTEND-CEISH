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
import { TipoEstudio, RequisitoDocumento } from '../../../constants/anexos-pet.constants';
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
  nivelesRiesgo: any[] = []; // Nueva lista para niveles de riesgo
  documentosRequeridos: RequisitoDocumento[] = [];
  documentUploadStatus: { [key: string]: string } = {};
  archivosCargados: { [key: string]: string } = {};

  generalForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200)]],
    tipoEstudio: ['', Validators.required],
    riskLevelId: ['', Validators.required], // Nuevo campo
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
    this.loadRiskLevels(); // Cargar riesgos al iniciar

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
    const payload: CrearProtocoloDto = {
      ...this.generalForm.value as any,
      equipoInvestigador: this.equipoInvestigador.getRawValue(),
      instituciones: this.instituciones.value,
      isAffidavitAccepted: true,
      lugarEjecucion: this.generalForm.value.coberturaGeografica || 'Ecuador'
    };

    this.protocoloService.guardarProtocoloInicial(payload).subscribe({
      next: (res) => {
        this.protocolId = res.id;
        this.uploadAllCVs(res.id);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al registrar protocolo.', 'Cerrar');
      }
    });
  }

  private uploadAllCVs(protocolId: number) {
    const uploads = this.equipoInvestigador.controls.map((control, index) => {
      const file = control.get('cvFile')?.value;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('protocolId', protocolId.toString());
        formData.append('documentTypeId', `cv_investigador_${index}`);
        return this.protocoloService.subirDocumento(formData);
      }
      return of(null);
    });

    forkJoin(uploads).subscribe({
      next: () => {
        this.isLoading = false;
        this.stepper.next();
      },
      error: () => {
        this.isLoading = false;
        this.stepper.next();
      }
    });
  }

  private loadRequirements() {
    const tipo = this.generalForm.get('tipoEstudio')?.value;
    if (!tipo) return;

    const muestras = this.generalForm.get('usesBiologicalSamples')?.value || false;
    const vulnerable = this.generalForm.get('isVulnerablePopulation')?.value || false;

    this.protocoloService.getRequisitos(tipo, muestras, vulnerable).subscribe({
      next: (reqs: any) => {
        const requirementsArray = Array.isArray(reqs) ? reqs : (reqs?.data || []);
        
        if (requirementsArray.length > 0) {
          this.documentosRequeridos = requirementsArray;
          requirementsArray.forEach((doc: any) => {
            if (!this.documentUploadStatus[doc.id]) this.documentUploadStatus[doc.id] = 'pendiente';
          });
        } else {
          this.documentosRequeridos = [];
        }
      },
      error: (err) => {
        console.error('Error cargando requisitos dinámicos:', err);
        this.documentosRequeridos = [];
        this.snackBar.open('Error al conectar con el servicio de requisitos.', 'Cerrar');
      }
    });
  }

  onDocumentSelected(event: any, docId: string) {
    const file = event.target.files[0];
    if (!file || !this.protocolId) return;

    this.documentUploadStatus[docId] = 'subiendo';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('protocolId', this.protocolId.toString());
    formData.append('documentTypeId', docId);

    this.protocoloService.subirDocumento(formData).subscribe({
      next: () => {
        this.documentUploadStatus[docId] = 'exito';
        this.archivosCargados[docId] = file.name;
      },
      error: () => {
        this.documentUploadStatus[docId] = 'error';
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
        this.router.navigate(['/investigador/mis-protocolos']);
      },
      error: () => this.isLoading = false
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) event.preventDefault();
  }
}
