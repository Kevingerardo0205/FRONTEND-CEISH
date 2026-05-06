import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatStepperModule } from '@angular/material/stepper';
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

import { ProtocoloService } from '../../../application/services/protocolo.service';
import { CrearProtocoloDto } from '../../../domain/dtos/crear-protocolo.dto';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { TipoEstudio, getRequisitosPorTipoEstudio, RequisitoDocumento } from '../../../constants/anexos-pet.constants';

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
    MatToolbarModule, MatTooltipModule
  ],
  templateUrl: './nuevo-protocolo.page.html',
  styleUrls: ['./nuevo-protocolo.page.scss']
})
export class NuevoProtocoloPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly protocoloService = inject(ProtocoloService);
  private readonly authFacade = inject(AuthFacade);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  isLoading = false;
  readonly coberturas = ['Local (Cantonal)', 'Provincial (Chimborazo)', 'Regional', 'Nacional', 'Internacional'];
  readonly funcionesEquipo = ['Investigador Principal', 'Coinvestigador', 'Tutor / Director', 'Asistente de Investigación', 'Estudiante'];
  
  documentosRequeridos: RequisitoDocumento[] = [];
  archivosDocumentos: { [key: string]: File } = {};

  // 1. Datos Generales
  step1Form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200)]],
    coberturaGeografica: ['', Validators.required],
    duracionMeses: [1, [Validators.required, Validators.min(1), Validators.max(120)]],
  });

  // 2. Equipo de Investigación
  step2Form = this.fb.group({
    equipoInvestigador: this.fb.array([])
  });

  // 3. Subir Documentos
  step3Form = this.fb.group({
    tipoEstudio: ['', Validators.required]
  });

  get equipoInvestigador() {
    return this.step2Form.get('equipoInvestigador') as FormArray;
  }

  ngOnInit(): void {
    this.addInvestigadorPrincipal();
    
    // Escuchar cambios en tipo de estudio para actualizar documentos requeridos
    this.step3Form.get('tipoEstudio')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.documentosRequeridos = getRequisitosPorTipoEstudio(tipo as TipoEstudio);
        this.archivosDocumentos = {}; // Reiniciar archivos al cambiar tipo
      }
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.equipoInvestigador.at(index).get('cvFile')?.setValue(file);
    }
  }

  onDocumentSelected(event: any, docId: string) {
    const file = event.target.files[0];
    if (file) {
      this.archivosDocumentos[docId] = file;
    }
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

  removeMiembro(index: number) {
    if (index > 0) this.equipoInvestigador.removeAt(index);
  }

  onEnviar(): void {
    this.step1Form.markAllAsTouched();
    this.step2Form.markAllAsTouched();
    this.step3Form.markAllAsTouched();

    if (this.isFormInvalid()) {
      this.snackBar.open('⚠️ Existen campos con errores o incompletos. Por favor revise cada sección.', 'Revisar', { 
        duration: 5000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Validar que todos los documentos requeridos estén cargados
    const faltanDocumentos = this.documentosRequeridos.some(doc => !this.archivosDocumentos[doc.id]);
    if (faltanDocumentos) {
      this.snackBar.open('⚠️ Debe subir todos los documentos requeridos.', 'Cerrar', { 
        duration: 5000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    if (this.isLoading) return;

    const protocolData: Partial<CrearProtocoloDto> = {
      ...this.step1Form.value as any,
      ...this.step2Form.getRawValue() as any,
      ...this.step3Form.value as any,
      lugarEjecucion: this.step1Form.value.coberturaGeografica || 'Ecuador', 
      fechaInicioEstimada: new Date().toISOString(),
      fechaFinEstimada: new Date().toISOString(),
      poblacionVulnerable: false,
      utilizaMuestrasBiologicas: false,
      multicentrico: false
    };

    this.isLoading = true;
    const formData = new FormData();
    formData.append('data', JSON.stringify(protocolData));

    // Adjuntar archivos CV
    this.equipoInvestigador.controls.forEach((control, index) => {
      const file = control.get('cvFile')?.value;
      if (file) {
        formData.append(`cv_investigador_${index}`, file);
      }
    });

    // Adjuntar documentos del protocolo
    Object.keys(this.archivosDocumentos).forEach(key => {
      formData.append(key, this.archivosDocumentos[key]);
    });

    this.protocoloService.crearProtocolo(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('✅ Protocolo registrado con éxito.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/investigador/mis-protocolos']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error enviando protocolo:', err);
        this.snackBar.open('❌ Error crítico al enviar el formulario.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private isFormInvalid(): boolean {
    return this.step1Form.invalid || this.step2Form.invalid || this.step3Form.invalid;
  }
}
