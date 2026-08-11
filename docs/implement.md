# 🛠️ Guía de Implementación Técnica (Implement)

Este documento contiene fragmentos de código de referencia, plantillas de componentes y lógicas clave para guiar la construcción de los cambios detallados en la Iteración 2.

---

## 🔌 1. Definición del Servicio de Resoluciones (`FrontendResolutionsService`)

El servicio debe interactuar con el backend exponiendo el tipado de los campos condicionales.

```typescript
// Ruta recomendada: src/infrastructure/services/frontend-resolutions.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateResolutionPayload {
  protocolId: string;
  resolutionTypeId: number; // 1 = Aprobado, 2 = Aprobado con Observaciones, 3 = Rechazado
  validityYears?: number;
  followUpPeriodDays?: number;
  majorObservations?: string;   // Obligatorio si es tipo 2
  minorObservations?: string;   // Opcional si es tipo 2
  correctionProcedure?: string; // Obligatorio si es tipo 2
  pdfLetterPath?: string;
}

@Injectable({ providedIn: 'root' })
export class FrontendResolutionsService {
  private http = inject(HttpClient);
  private baseUrl = '/api/resolutions';

  createResolution(payload: CreateResolutionPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  getResolutionsByProtocol(protocolId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/protocol/${protocolId}`);
  }
}
```

---

## 🖋️ 2. Pantalla de Emisión de Resoluciones (Formulario Reactivo)

Esquema de implementación de validación dinámica en el componente `CreateResolutionForm`:

```typescript
// Componente de Formulario de Resolución
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FrontendResolutionsService } from '@infrastructure/services/frontend-resolutions.service';
import { MatDialog } from '@angular/material/dialog';
import { ConflictDialogComponent } from '../../components/conflict-dialog/conflict-dialog.component';

@Component({
  selector: 'app-create-resolution-form',
  templateUrl: './create-resolution-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class CreateResolutionFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private resolutionsService = inject(FrontendResolutionsService);
  private dialog = inject(MatDialog);

  resolutionForm = this.fb.group({
    protocolId: ['', [Validators.required]],
    resolutionTypeId: [1, [Validators.required]],
    majorObservations: [''],
    minorObservations: [''],
    correctionProcedure: ['']
  });

  ngOnInit() {
    // Escucha cambios para añadir o quitar validaciones condicionales
    this.resolutionForm.get('resolutionTypeId')?.valueChanges.subscribe(typeId => {
      this.updateConditionalValidators(typeId);
    });
  }

  private updateConditionalValidators(typeId: number) {
    const majorObs = this.resolutionForm.get('majorObservations');
    const corrProc = this.resolutionForm.get('correctionProcedure');

    if (typeId === 2) { // Aprobado con Observaciones
      majorObs?.setValidators([Validators.required, Validators.minLength(10)]);
      corrProc?.setValidators([Validators.required, Validators.minLength(10)]);
    } else {
      majorObs?.clearValidators();
      corrProc?.clearValidators();
    }
    majorObs?.updateValueAndValidity();
    corrProc?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.resolutionForm.invalid) return;

    this.resolutionsService.createResolution(this.resolutionForm.getRawValue()).subscribe({
      next: (res) => {
        // Redirección o mensaje de éxito
      },
      error: (err) => {
        if (err.status === 409) {
          // Captura de Concurrencia (Optimistic Locking)
          this.dialog.open(ConflictDialogComponent, {
            data: { message: 'El expediente de este protocolo ya ha sido modificado concurrentemente. Por favor, recargue la página.' }
          });
        }
      }
    });
  }
}
```

---

## 🧑‍🔬 3. Lógica del Investigador: Lista de Requisitos Inmutables

Lógica en la plantilla HTML para controlar la inmutabilidad de los documentos:

```html
<!-- checklist.component.html -->
<div class="requirements-list">
  @for (item of checklist; track item.id) {
    <div class="requirement-row" [class.approved]="item.status === 'APROBADO'">
      <div class="requirement-info">
        <span class="requirement-name">{{ item.name }}</span>
        @if (item.status === 'APROBADO' || item.status === 'NO_APLICA') {
          <span class="badge badge-success">✓ Aprobado (Inmutable)</span>
        } @else {
          <span class="badge badge-warning">⚠ Pendiente / Observado</span>
        }
      </div>

      <div class="requirement-actions">
        <!-- Si ya está aprobado, solo se permite la descarga, no la subida -->
        @if (item.status === 'APROBADO' || item.status === 'NO_APLICA') {
          <button (click)="downloadFile(item.attachedDocument?.path)">
            Descargar Documento V1
          </button>
        } @else {
          <!-- Habilitar zona de carga para subsanación -->
          <input type="file" (change)="onFileSelected($event, item.code)" />
          <button (click)="uploadDocument(item.code)">Subir Versión Corregida</button>
        }
      </div>
    </div>
  }
</div>
```

---

## ⏳ 4. Detalle Histórico en Línea de Tiempo (Estado 19)

Lógica para recuperar y mostrar el historial de observaciones guardadas al hacer clic en una versión con subsanación:

```typescript
// timeline.component.ts
import { Component, Input, inject } from '@angular/core';
import { ProtocolVersionEntity } from '@domain/entities/protocol.entity';
import { MatDialog } from '@angular/material/dialog';
import { HistoricalObservationsDialogComponent } from '../historical-observations-dialog/historical-observations-dialog.component';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  standalone: true
})
export class TimelineComponent {
  @Input() versions: ProtocolVersionEntity[] = [];
  private dialog = inject(MatDialog);

  onSelectVersionEvent(version: ProtocolVersionEntity) {
    // Si la versión fue observada (statusId 19 o requiere subsanación)
    if (version.statusId === 19 || version.status === 'REQUIERE_SUBSANACION_VERSION') {
      this.dialog.open(HistoricalObservationsDialogComponent, {
        width: '600px',
        data: {
          versionNumber: version.versionNumber,
          majorObservations: version.majorObservations,
          minorObservations: version.minorObservations,
          correctionProcedure: version.correctionProcedure,
          createdAt: version.createdAt
        }
      });
    }
  }
}
```
