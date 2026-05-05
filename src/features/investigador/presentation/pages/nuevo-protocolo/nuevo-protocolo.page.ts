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

import { ProtocoloService } from '../../../application/services/protocolo.service';
import { CrearProtocoloDto } from '../../../domain/dtos/crear-protocolo.dto';
import { AuthFacade } from '@features/auth/facades/auth.facade';

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
    MatToolbarModule
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

  // 1. Datos Generales
  step1Form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(200)]],
    tipoEstudio: ['', Validators.required],
    coberturaGeografica: ['', Validators.required],
    montoTotal: [0, [Validators.required, Validators.min(0)]],
    fuenteFinanciamiento: ['', [Validators.required, Validators.minLength(3)]],
    duracionMeses: [1, [Validators.required, Validators.min(1), Validators.max(120)]],
  });

  // 2. Patrocinador e Equipo
  step2Form = this.fb.group({
    nombrePatrocinador: ['', [Validators.required, Validators.minLength(3)]],
    identificacionPatrocinador: ['', [Validators.required, ecuadorianIdValidator]],
    correoPatrocinador: ['', [Validators.required, Validators.email]],
    telefonoPatrocinador: ['', [Validators.required, ecuadorianPhoneValidator]],
    direccionPatrocinador: ['', [Validators.required, Validators.minLength(5)]],
    equipoInvestigador: this.fb.array([])
  });

  // 3. Detalle de la Investigación
  step3Form = this.fb.group({
    resumenEstructurado: ['', [Validators.required, Validators.minLength(100)]],
    problemaInvestigacion: ['', [Validators.required, Validators.minLength(50)]],
    justificacion: ['', [Validators.required, Validators.minLength(50)]],
    marcoTeorico: ['', [Validators.required, Validators.minLength(100)]],
    objetivoGeneral: ['', [Validators.required, Validators.minLength(20)]],
    objetivosEspecificos: ['', [Validators.required, Validators.minLength(20)]],
    hipotesis: ['']
  });

  // 4. Metodología
  step4Form = this.fb.group({
    disenoEstudio: ['', [Validators.required, Validators.minLength(10)]],
    descripcionPoblacion: ['', [Validators.required, Validators.minLength(50)]],
    criteriosInclusionExclusion: ['', [Validators.required, Validators.minLength(20)]],
    operacionalizacionVariables: ['', [Validators.required, Validators.minLength(50)]],
    procedimientosDetallados: ['', [Validators.required, Validators.minLength(100)]],
    paqueteEstadistico: ['', Validators.required]
  });

  // 5. Ética y Resultados
  step5Form = this.fb.group({
    procesoAnonimizacion: ['', [Validators.required, Validators.minLength(50)]],
    balanceRiesgoBeneficio: ['', [Validators.required, Validators.minLength(50)]],
    resultadosEsperados: ['', [Validators.required, Validators.minLength(50)]],
    referenciasBibliograficas: ['', [Validators.required, Validators.minLength(50)]]
  });

  get equipoInvestigador() {
    return this.step2Form.get('equipoInvestigador') as FormArray;
  }

  ngOnInit(): void {
    this.addInvestigadorPrincipal();
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
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
      celular: ['', [Validators.required, ecuadorianPhoneValidator]]
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
      celular: ['', [Validators.required, ecuadorianPhoneValidator]]
    }));
  }

  removeMiembro(index: number) {
    if (index > 0) this.equipoInvestigador.removeAt(index);
  }

  onEnviar(): void {
    this.step1Form.markAllAsTouched();
    this.step2Form.markAllAsTouched();
    this.step3Form.markAllAsTouched();
    this.step4Form.markAllAsTouched();
    this.step5Form.markAllAsTouched();

    if (this.isFormInvalid()) {
      this.snackBar.open('⚠️ Existen campos con errores o incompletos. Por favor revise cada sección.', 'Revisar', { 
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
      ...this.step4Form.value as any,
      ...this.step5Form.value as any,
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
    return this.step1Form.invalid || this.step2Form.invalid || this.step3Form.invalid || this.step4Form.invalid || this.step5Form.invalid;
  }
}
