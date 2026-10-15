import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TipoEstudio } from '../../../constants/anexos-pet.constants';

@Component({
  selector: 'app-formulario-datos-generales',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, 
    MatInputModule, MatSelectModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule
  ],
  template: `
    <form [formGroup]="formGroup" class="row g-3">
      <div class="col-md-6">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Investigador Principal</mat-label>
          <input matInput formControlName="investigadorPrincipal" readonly>
          <mat-hint>Autocompletado según sesión</mat-hint>
        </mat-form-field>
      </div>
      
      <div class="col-md-6">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Email Institucional de Contacto</mat-label>
          <input matInput formControlName="emailContacto" type="email">
          <mat-error *ngIf="formGroup.get('emailContacto')?.hasError('required')">Requerido</mat-error>
          <mat-error *ngIf="formGroup.get('emailContacto')?.hasError('email')">Email inválido</mat-error>
        </mat-form-field>
      </div>

      <div class="col-12">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Título Completo del Protocolo</mat-label>
          <input matInput formControlName="titulo" placeholder="Ej: Evaluación de la eficacia de...">
          <mat-hint>Debe coincidir exactamente con el Anexo 2</mat-hint>
          <mat-error *ngIf="formGroup.get('titulo')?.hasError('required')">El título es obligatorio</mat-error>
          <mat-error *ngIf="formGroup.get('titulo')?.hasError('minlength')">Mínimo 10 caracteres</mat-error>
        </mat-form-field>
      </div>

      <div class="col-12">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Resumen del Proyecto (Abstract)</mat-label>
          <textarea matInput formControlName="resumen" rows="4" placeholder="Síntesis de la investigación..."></textarea>
          <mat-hint>Mínimo 50 caracteres</mat-hint>
          <mat-error *ngIf="formGroup.get('resumen')?.hasError('required')">El resumen es obligatorio</mat-error>
        </mat-form-field>
      </div>

      <div class="col-md-6">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Tipo de Diseño / Metodología</mat-label>
          <input matInput formControlName="disenoEstudio" placeholder="Ej: Transversal, Doble Ciego, etc.">
          <mat-error *ngIf="formGroup.get('disenoEstudio')?.hasError('required')">Campo obligatorio</mat-error>
        </mat-form-field>
      </div>

      <div class="col-md-6">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Lugar de Ejecución</mat-label>
          <input matInput formControlName="lugarEjecucion" placeholder="Ciudad, Institución, Centro de Salud">
          <mat-error *ngIf="formGroup.get('lugarEjecucion')?.hasError('required')">Campo obligatorio</mat-error>
        </mat-form-field>
      </div>

      <div class="col-md-4">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Fecha Inicio (Estimada)</mat-label>
          <input matInput [matDatepicker]="pickerStart" formControlName="fechaInicioEstimada">
          <mat-datepicker-toggle matIconSuffix [for]="pickerStart"></mat-datepicker-toggle>
          <mat-datepicker #pickerStart></mat-datepicker>
          <mat-error *ngIf="formGroup.get('fechaInicioEstimada')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>
      </div>

      <div class="col-md-4">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Fecha Fin (Estimada)</mat-label>
          <input matInput [matDatepicker]="pickerEnd" formControlName="fechaFinEstimada">
          <mat-datepicker-toggle matIconSuffix [for]="pickerEnd"></mat-datepicker-toggle>
          <mat-datepicker #pickerEnd></mat-datepicker>
          <mat-error *ngIf="formGroup.get('fechaFinEstimada')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>
      </div>

      <div class="col-md-4">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Duración (Meses)</mat-label>
          <input matInput type="number" formControlName="duracionMeses">
          <mat-error *ngIf="formGroup.get('duracionMeses')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>
      </div>

      <div class="col-12">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Institución Patrocinadora / Financiamiento</mat-label>
          <input matInput formControlName="institucionPatrocinadora" placeholder="Ej: ESPOCH, Empresa Privada, Autofinanciado">
          <mat-error *ngIf="formGroup.get('institucionPatrocinadora')?.hasError('required')">Campo obligatorio</mat-error>
        </mat-form-field>
      </div>

      <div class="col-12">
        <div class="p-3 border rounded bg-light shadow-sm">
          <h6 class="fw-bold mb-3 d-flex align-items-center">
            <mat-icon class="me-2 text-primary">security</mat-icon>
            Consideraciones Éticas (PET Sección 4.1.2)
          </h6>
          <div class="row">
            <div class="col-md-4">
              <mat-checkbox formControlName="poblacionVulnerable">Población Vulnerable</mat-checkbox>
            </div>
            <div class="col-md-4">
              <mat-checkbox formControlName="utilizaMuestrasBiologicas">Muestras Biológicas</mat-checkbox>
            </div>
            <div class="col-md-4">
              <mat-checkbox formControlName="multicentrico">Estudio Multicéntrico</mat-checkbox>
            </div>
          </div>
        </div>
      </div>
    </form>
  `
})
export class FormularioDatosGeneralesComponent {
  @Input() formGroup!: FormGroup;
  @Input() tipoEstudio: TipoEstudio | null = null;
}
