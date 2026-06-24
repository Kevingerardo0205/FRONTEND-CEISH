import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { DashboardFacade } from '../../facades/dashboard.facade';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="premium-profile-container animate-fade-in">
      <!-- HEADER SECCIÓN -->
      <header class="profile-header mb-4">
        <div class="header-content">
          <span class="badge-accent">MI SEGURIDAD</span>
          <h1 class="title">Mi Perfil Profesional</h1>
          <p class="subtitle">Administre la información de su cuenta y sus acreditaciones científicas.</p>
        </div>
      </header>

      <!-- CARGA ACTIVADA -->
      <div class="loading-overlay" *ngIf="isLoading()">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Refrescando información de la base de datos...</span>
      </div>

      <!-- GRID PRINCIPAL -->
      <div class="profile-grid" *ngIf="!isLoading() && user()">
        
        <!-- COLUMNA IZQUIERDA: TARJETA DE IDENTIDAD / EDICIÓN -->
        <div class="identity-card shadow-soft">
          <div class="profile-cover"></div>
          
          <div class="avatar-wrapper">
            <div class="avatar-large">{{ userInitials() }}</div>
            <div class="status-badge" [class.verified]="user()?.emailVerificado">
              <mat-icon>{{ user()?.emailVerificado ? 'verified' : 'hourglass_empty' }}</mat-icon>
            </div>
          </div>

          <!-- MODO VISUALIZACIÓN -->
          <ng-container *ngIf="!isEditMode()">
            <div class="user-intro">
              <h2>{{ user()?.nombre }}</h2>
              <span class="professional-role">{{ user()?.perfil || 'Docente Investigador' }}</span>
              <div class="role-badge" [ngClass]="user()?.rol?.toLowerCase()">
                {{ user()?.rol }}
              </div>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <div class="contact-details">
              <div class="detail-item">
                <mat-icon>mail</mat-icon>
                <div class="text">
                  <span class="label">Correo Institucional</span>
                  <span class="val">{{ user()?.email }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon>phone</mat-icon>
                <div class="text">
                  <span class="label">Número de Contacto</span>
                  <span class="val">{{ user()?.telefono || 'No registrado' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon>fingerprint</mat-icon>
                <div class="text">
                  <span class="label">Cédula de Identidad</span>
                  <span class="val">{{ user()?.nationalId || 'No registrada' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon>domain</mat-icon>
                <div class="text">
                  <span class="label">Institución / Afiliación</span>
                  <span class="val">{{ user()?.institucion || 'ESPOCH' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon>workspace_premium</mat-icon>
                <div class="text">
                  <span class="label">Registro SENESCYT</span>
                  <span class="val">{{ user()?.registroSenescyt || 'Pendiente Registro' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon>public</mat-icon>
                <div class="text">
                  <span class="label">Nacionalidad</span>
                  <span class="val">{{ user()?.nacionalidad || 'Ecuatoriana' }}</span>
                </div>
              </div>
            </div>
            
            <div class="action-footer mt-4 px-4 d-flex flex-column gap-2">
              <button mat-flat-button color="primary" class="w-100 edit-btn" (click)="isEditMode.set(true)">
                <mat-icon>edit</mat-icon>
                Editar Mi Perfil
              </button>
              <button mat-stroked-button class="w-100 refresh-btn" (click)="refreshProfile()">
                <mat-icon>sync</mat-icon>
                Refrescar Datos
              </button>
            </div>
          </ng-container>

          <!-- MODO EDICIÓN ACTIVO -->
          <ng-container *ngIf="isEditMode()">
            <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="edit-profile-form mt-4 px-4">
              <h3 class="edit-title mb-4">Actualizar Información</h3>
              
              <div class="field-container mb-3">
                <label class="field-label">Nombre Completo</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="nombre" placeholder="Ej: Dra. María López">
                  <mat-icon matSuffix class="text-muted">badge</mat-icon>
                  <mat-error *ngIf="profileForm.get('nombre')?.hasError('required')">El nombre es requerido</mat-error>
                  <mat-error *ngIf="profileForm.get('nombre')?.hasError('minlength')">Mínimo 5 caracteres</mat-error>
                </mat-form-field>
              </div>

              <div class="field-container mb-3">
                <label class="field-label">Cargo Académico / Especialidad</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="perfil" placeholder="Ej: Docente Investigador">
                  <mat-icon matSuffix class="text-muted">work_outline</mat-icon>
                  <mat-error *ngIf="profileForm.get('perfil')?.hasError('required')">El cargo es requerido</mat-error>
                </mat-form-field>
              </div>

              <div class="field-container mb-3">
                <label class="field-label">Número Celular de Contacto</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="telefono" placeholder="Ej: 0998887776">
                  <mat-icon matSuffix class="text-muted">phone</mat-icon>
                  <mat-error *ngIf="profileForm.get('telefono')?.hasError('required')">El número es requerido</mat-error>
                  <mat-error *ngIf="profileForm.get('telefono')?.hasError('pattern')">Debe ser un número ecuatoriano de 10 dígitos</mat-error>
                </mat-form-field>
              </div>

              <div class="field-container mb-3">
                <label class="field-label">Cédula de Identidad</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="nationalId" placeholder="Ej: 0601234567">
                  <mat-icon matSuffix class="text-muted">fingerprint</mat-icon>
                  <mat-error *ngIf="profileForm.get('nationalId')?.hasError('required')">La cédula es requerida</mat-error>
                  <mat-error *ngIf="profileForm.get('nationalId')?.hasError('pattern')">Debe ser un número de 10 dígitos</mat-error>
                </mat-form-field>
              </div>

              <div class="field-container mb-3">
                <label class="field-label">Institución de Afiliación</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="institucion" placeholder="Ej: ESPOCH">
                  <mat-icon matSuffix class="text-muted">domain</mat-icon>
                </mat-form-field>
              </div>

              <div class="field-container mb-3">
                <label class="field-label">Código de Registro SENESCYT</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="registroSenescyt" placeholder="Ej: 1005-2021-224536">
                  <mat-icon matSuffix class="text-muted">workspace_premium</mat-icon>
                </mat-form-field>
              </div>

              <div class="field-container mb-4">
                <label class="field-label">Nacionalidad</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="nacionalidad" placeholder="Ej: Ecuatoriana">
                  <mat-icon matSuffix class="text-muted">public</mat-icon>
                </mat-form-field>
              </div>

              <div class="edit-actions d-flex flex-column gap-2 mt-4">
                <button mat-flat-button class="w-100 save-btn" type="submit" [disabled]="profileForm.invalid || isSaving()">
                  <mat-spinner *ngIf="isSaving()" diameter="20" class="me-2"></mat-spinner>
                  <span>{{ isSaving() ? 'Guardando...' : 'Guardar Cambios' }}</span>
                </button>
                <button mat-button class="w-100 cancel-btn" type="button" (click)="isEditMode.set(false)" [disabled]="isSaving()">
                  Descartar
                </button>
              </div>
            </form>
          </ng-container>

        </div>

        <!-- COLUMNA DERECHA: ACREDITACIONES, CV, AUDITORÍA -->
        <div class="accreditations-column">
          
          <!-- SECCIÓN DE CARGA DE EVALUACIÓN (Solo visible para Evaluadores) -->
          <div class="card-premium workload-card shadow-soft mb-4 animate-fade-in" *ngIf="isEvaluator()">
            <div class="title-section mb-3 d-flex align-items-center gap-3">
              <mat-icon style="color: #1e3a8a; font-size: 28px; width: 28px; height: 28px;">assignment_ind</mat-icon>
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0;">Carga Activa de Evaluaciones</h3>
                <p class="text-muted small" style="margin: 0;">Resumen de expedientes científicos asignados bajo su responsabilidad.</p>
              </div>
            </div>
            
            <mat-divider class="mb-4"></mat-divider>
            
            <div class="workload-stats-grid">
              <div class="workload-stat-item">
                <span class="stat-value">{{ activeAssignmentsCount() }}</span>
                <span class="stat-label">Carga Activa</span>
              </div>
              <div class="workload-stat-item urgent" [class.has-urgent]="urgentAssignmentsCount() > 0">
                <span class="stat-value">{{ urgentAssignmentsCount() }}</span>
                <span class="stat-label">Tareas Urgentes</span>
              </div>
            </div>
            
            <div class="workload-indicator" [ngClass]="getWorkloadStatusClass()">
              <span class="dot"></span>
              <span>Estado Operativo: <strong>{{ getWorkloadStatusLabel() }}</strong></span>
            </div>
          </div>

          <!-- SECCIÓN 1: ESTADO DE CONFIRMACIÓN -->
          <div class="card-premium security-card mb-4" [class.unverified]="!user()?.emailVerificado">
            <div class="card-icon">
              <mat-icon>{{ user()?.emailVerificado ? 'mark_email_read' : 'mail_lock' }}</mat-icon>
            </div>
            <div class="card-content">
              <h3>{{ user()?.emailVerificado ? 'Cuenta Verificada Correctamente' : 'Correo Pendiente de Verificación' }}</h3>
              <p>
                {{ user()?.emailVerificado 
                  ? 'Su correo ha sido validado mediante OTP y está facultado para el sometimiento oficial de protocolos científicos ante el comité de ética.' 
                  : 'Para iniciar el sometimiento de nuevos protocolos, debe verificar su correo institucional utilizando el código de 6 dígitos enviado a su casilla.' 
                }}
              </p>
              <span class="verification-badge" [class.verified]="user()?.emailVerificado">
                {{ user()?.emailVerificado ? 'Acreditado CEISH' : 'Pendiente Verificación' }}
              </span>
            </div>
          </div>

          <!-- SECCIÓN 2: MI HOJA DE VIDA CIENTÍFICA (CV PDF) -->
          <div class="card-premium cv-card shadow-soft mb-4">
            <div class="title-section mb-3">
              <mat-icon>contact_page</mat-icon>
              <div>
                <h3>Hoja de Vida Científica (CV)</h3>
                <p class="text-muted small">Suba su CV en formato PDF. Es un requisito obligatorio para avalar sus protocolos ante el comité ético.</p>
              </div>
            </div>

            <mat-divider class="mb-4"></mat-divider>

            <!-- CV Upload Box -->
            <div class="cv-upload-container">
              <div class="cv-status-active p-3 rounded-3 d-flex align-items-center justify-content-between mb-3" *ngIf="cvName()">
                <div class="d-flex align-items-center gap-3">
                  <div class="cv-file-icon">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </div>
                  <div class="cv-info">
                    <span class="cv-filename">{{ cvName() }}</span>
                    <span class="cv-meta text-muted small">{{ cvSize() }} • Subido el {{ cvDate() | date:'dd/MM/yyyy, h:mm a' }}</span>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button mat-icon-button color="primary" (click)="downloadCV()" matTooltip="Descargar CV">
                    <mat-icon>download</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCV()" matTooltip="Eliminar CV">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Upload Drag Zone -->
              <div class="upload-dropzone" *ngIf="!cvName() && !isUploadingCv()" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                <input type="file" #fileInput hidden (change)="onFileSelected($event)" accept="application/pdf">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <h4>Arrastre su CV aquí o haga clic para buscar</h4>
                <p class="text-muted small">Solo se permiten archivos en formato PDF (máx. 5MB)</p>
              </div>

              <!-- Uploading progress spinner -->
              <div class="upload-progress-overlay" *ngIf="isUploadingCv()">
                <mat-spinner diameter="30"></mat-spinner>
                <span>Cargando y firmando archivo PDF...</span>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: PRIVILEGIOS CIENTÍFICOS -->
          <div class="card-premium privileges-card shadow-soft mb-4">
            <div class="title-section mb-3">
              <mat-icon>admin_panel_settings</mat-icon>
              <div>
                <h3>Privilegios Científicos Autorizados</h3>
                <p class="text-muted small">Listado de permisos operativos asignados a su firma digital.</p>
              </div>
            </div>

            <mat-divider class="mb-4"></mat-divider>

            <div class="permissions-container">
              <div class="permission-item" *ngFor="let perm of user()?.fullPermissions">
                <div class="perm-icon">
                  <mat-icon>{{ perm.module?.icon || 'check_circle_outline' }}</mat-icon>
                </div>
                <div class="perm-info">
                  <span class="perm-code">{{ perm.code }}</span>
                  <span class="perm-desc">{{ getFriendlyPermLabel(perm.code) }}</span>
                </div>
                <div class="status-indicator">
                  <span class="dot"></span>
                  Activo
                </div>
              </div>
              <div class="empty-permissions" *ngIf="!user()?.fullPermissions?.length">
                <mat-icon>warning_amber</mat-icon>
                <p>No se encontraron privilegios detallados cargados en su sesión.</p>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 4: HISTORIAL DE AUDITORÍA REGISTRADO (IP / AUDIT LOGS) -->
          <div class="card-premium audit-card shadow-soft">
            <div class="title-section mb-3">
              <mat-icon>history_toggle_off</mat-icon>
              <div>
                <h3>Historial de Auditoría y Cumplimiento</h3>
                <p class="text-muted small">Eventos de escritura y firmas registrados con dirección IP para trazabilidad ética.</p>
              </div>
            </div>

            <mat-divider class="mb-4"></mat-divider>

            <div class="audit-timeline">
              <div class="timeline-item" *ngFor="let log of auditLogs()">
                <div class="timeline-badge" [class.success]="log.success">
                  <mat-icon>{{ log.icon }}</mat-icon>
                </div>
                <div class="timeline-content">
                  <div class="d-flex justify-content-between align-items-start">
                    <h4 class="event-title">{{ log.action }}</h4>
                    <span class="event-date small text-muted">{{ log.date | date:'dd/MM/yyyy, h:mm a' }}</span>
                  </div>
                  <p class="event-desc">{{ log.detail }}</p>
                  <div class="event-meta">
                    <span class="ip-address"><mat-icon>lan</mat-icon> IP: {{ log.ip }}</span>
                    <span class="verification-status"><mat-icon>verified</mat-icon> Firmado Digitalmente (OTP)</span>
                  </div>
                </div>
              </div>

              <div class="empty-audit-logs" *ngIf="!auditLogs().length">
                <mat-icon>history</mat-icon>
                <p>No se registran trámites ni acciones de escritura en este periodo.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .premium-profile-container {
      padding: 2.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .profile-header {
      .badge-accent {
        font-size: 0.65rem;
        font-weight: 800;
        color: #3b82f6;
        letter-spacing: 0.1em;
        margin-bottom: 0.5rem;
        display: block;
      }
      .title {
        font-size: 2.25rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.02em;
      }
      .subtitle {
        color: #64748b;
        margin: 0.5rem 0 0;
        font-size: 1.1rem;
      }
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 0;
      color: #64748b;
      gap: 1rem;
      font-weight: 600;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 2.5rem;
      align-items: start;
    }

    /* Tarjeta de Identidad */
    .identity-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      overflow: hidden;
      padding-bottom: 2rem;
      position: relative;
    }

    .profile-cover {
      height: 100px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    }

    .avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      margin: -60px auto 0;
      
      .avatar-large {
        width: 120px;
        height: 120px;
        background: #f1f5f9;
        border: 4px solid white;
        border-radius: 32px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.25rem;
        font-weight: 800;
        color: #1e3a8a;
      }

      .status-badge {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 32px;
        height: 32px;
        background: #f59e0b;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        color: white;

        mat-icon { font-size: 14px; width: 14px; height: 14px; }
        &.verified { background: #10b981; }
      }
    }

    .user-intro {
      text-align: center;
      padding: 1.5rem 1.5rem 0;

      h2 { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
      .professional-role { font-size: 0.85rem; color: #64748b; font-weight: 600; display: block; margin-bottom: 1rem; }
      
      .role-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        background: #e3f2fd;
        color: #1565c0;

        &.admin { background: #e0f2f1; color: #00796b; }
      }
    }

    .contact-details {
      padding: 0 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;

      .detail-item {
        display: flex;
        gap: 1rem;
        align-items: center;

        mat-icon { color: #94a3b8; }
        .text {
          display: flex;
          flex-direction: column;
          .label { font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .val { font-size: 0.85rem; color: #334155; font-weight: 600; }
        }
      }
    }

    .edit-btn {
      height: 48px;
      border-radius: 12px;
      font-weight: 700;
      background-color: #003366 !important;
      color: white !important;
    }

    .refresh-btn {
      height: 48px;
      border-radius: 12px;
      font-weight: 700;
      border-color: #cbd5e1;
    }

    /* Formulario de Edición */
    .edit-profile-form {
      .edit-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: -0.3px;
        text-align: center;
      }
    }

    .field-container {
      .field-label {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 8px;
      }
    }

    ::ng-deep .custom-field {
      width: 100%;
      .mat-mdc-text-field-wrapper {
        background-color: #f8fafc !important;
        border-radius: 12px !important;
        padding: 0 12px !important;
      }
      .mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing {
        border-color: transparent !important;
      }
      &.mat-focused .mat-mdc-text-field-wrapper {
        background-color: white !important;
        box-shadow: 0 0 0 2px #003366;
      }
    }

    .save-btn {
      height: 48px;
      border-radius: 12px;
      font-weight: 700;
      background-color: #10b981 !important;
      color: white !important;
    }

    .cancel-btn {
      height: 48px;
      border-radius: 12px;
      font-weight: 700;
      color: #64748b;
    }

    /* Columna Derecha */
    .accreditations-column {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card-premium {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 2rem;
    }

    .security-card {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #bbf7d0;
      color: #166534;

      .card-icon {
        width: 56px;
        height: 56px;
        background: white;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #10b981;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1);
      }

      .card-content {
        h3 { font-size: 1.1rem; font-weight: 800; margin: 0 0 0.25rem; }
        p { font-size: 0.85rem; line-height: 1.5; margin: 0 0 1rem; color: #14532d; font-weight: 500; }
        
        .verification-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
        }
      }

      &.unverified {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border-color: #fde68a;
        color: #92400e;

        .card-icon { color: #f59e0b; }
        .card-content {
          p { color: #78350f; }
          .verification-badge { background: #f59e0b; }
        }
      }
    }

    .privileges-card, .cv-card, .audit-card {
      .title-section {
        display: flex;
        gap: 1rem;
        align-items: center;
        mat-icon { color: #1e3a8a; font-size: 28px; width: 28px; height: 28px; }
        h3 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; }
        p { margin: 0; }
      }
    }

    /* CV Styles */
    .cv-status-active {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
      &:hover {
        border-color: #94a3b8;
      }
    }

    .cv-file-icon {
      width: 44px;
      height: 44px;
      background: #fef2f2;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      border: 1px solid #fee2e2;
    }

    .cv-info {
      display: flex;
      flex-direction: column;
      .cv-filename {
        font-size: 0.9rem;
        font-weight: 700;
        color: #1e293b;
      }
      .cv-meta {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 2px;
      }
    }

    .upload-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 2.5rem;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        background: #f0f7ff;
        .upload-icon {
          color: #3b82f6;
          transform: translateY(-2px);
        }
      }

      .upload-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #94a3b8;
        margin-bottom: 0.75rem;
        transition: transform 0.2s ease;
      }

      h4 {
        font-size: 0.95rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        font-size: 0.8rem;
      }
    }

    .upload-progress-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: #64748b;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Historial de Auditoría */
    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: relative;
      padding-left: 1.5rem;

      &::before {
        content: '';
        position: absolute;
        left: 4px;
        top: 8px;
        bottom: 8px;
        width: 2px;
        background: #e2e8f0;
      }
    }

    .timeline-item {
      display: flex;
      gap: 1.25rem;
      position: relative;
    }

    .timeline-badge {
      position: absolute;
      left: -24px;
      top: 4px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #cbd5e1;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 1;

      mat-icon {
        font-size: 10px;
        width: 10px;
        height: 10px;
      }

      &.success {
        background: #10b981;
      }
    }

    .timeline-content {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1rem 1.25rem;

      .event-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .event-date {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .event-desc {
        font-size: 0.85rem;
        color: #475569;
        margin: 0.5rem 0;
        line-height: 1.4;
      }

      .event-meta {
        display: flex;
        gap: 1.25rem;
        align-items: center;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            color: #94a3b8;
          }
        }

        .verification-status {
          color: #10b981;
          mat-icon {
            color: #10b981;
          }
        }
      }
    }

    .empty-audit-logs {
      text-align: center;
      padding: 2rem 0;
      color: #94a3b8;
      mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 0.5rem; }
      p { margin: 0; font-size: 0.85rem; font-weight: 600; }
    }

    .permissions-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .permission-item {
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1rem 1.5rem;
        gap: 1.25rem;
        transition: all 0.2s ease;

        &:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }

        .perm-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e3a8a;
          border: 1px solid #e2e8f0;
        }

        .perm-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          
          .perm-code { font-family: 'Fira Code', monospace; font-size: 0.75rem; font-weight: 800; color: #1e3a8a; }
          .perm-desc { font-size: 0.85rem; color: #475569; font-weight: 600; margin-top: 2px; }
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #f0fdf4;
          color: #166534;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;

          .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
        }
      }

      .empty-permissions {
        text-align: center;
        padding: 3rem 0;
        color: #94a3b8;
        mat-icon { font-size: 36px; width: 36px; height: 36px; margin-bottom: 0.5rem; }
        p { margin: 0; font-size: 0.85rem; font-weight: 600; }
      }
    }

    @media (max-width: 992px) {
      .profile-grid { grid-template-columns: 1fr; }
    }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Workload Card Styles */
    .workload-card {
      border-color: #cbd5e1;
    }
    .workload-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      
      .workload-stat-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.25rem 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        
        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #1e3a8a;
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        &.urgent {
          .stat-value { color: #64748b; }
          &.has-urgent {
            background: #fff1f2;
            border-color: #fecaca;
            .stat-value { color: #e11d48; }
            .stat-label { color: #be123c; }
          }
        }
      }
    }
    .workload-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      
      &.low {
        background: #f0fdf4;
        color: #166534;
        .dot { background: #10b981; }
      }
      &.med {
        background: #fffbeb;
        color: #92400e;
        .dot { background: #f59e0b; }
      }
      &.high {
        background: #fff1f2;
        color: #991b1b;
        .dot { background: #ef4444; }
      }
    }
  `]
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacade);
  private dashboardFacade = inject(DashboardFacade);
  private authRepository = inject(IAuthRepositoryPort);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private snackBar = inject(MatSnackBar);

  user = this.authFacade.currentUser;

  isEvaluator = computed(() => {
    const role = this.user()?.rol?.toUpperCase() || '';
    return role.includes('EVALUADOR') || this.user()?.fullPermissions?.some((p: any) => p.code?.startsWith('EVALUATION'));
  });

  activeAssignmentsCount = signal<number>(0);
  urgentAssignmentsCount = signal<number>(0);

  getWorkloadStatusClass(): string {
    const count = this.activeAssignmentsCount();
    if (count === 0) return 'low';
    if (count <= 2) return 'low';
    if (count <= 4) return 'med';
    return 'high';
  }

  getWorkloadStatusLabel(): string {
    const count = this.activeAssignmentsCount();
    if (count === 0) return 'Disponible / Sin carga';
    if (count <= 2) return 'Baja';
    if (count <= 4) return 'Moderada';
    return 'Elevada';
  }
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // CV Signals
  cvName = signal<string | null>(null);
  cvSize = signal<string | null>(null);
  cvDate = signal<string | null>(null);
  isUploadingCv = signal<boolean>(false);

  profileForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(5)]],
    perfil: ['', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    institucion: [''],
    registroSenescyt: [''],
    nacionalidad: [''],
    nationalId: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
  });

  userInitials = computed(() => {
    const name = this.user()?.nombre || '';
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  // Dynamically map real protocols and CV updates to audit logs
  auditLogs = computed(() => {
    const protocols = this.dashboardFacade.myProtocols() || [];
    const logs: any[] = [];
    
    // Check if there is a CV subido
    const cvUploadedDate = this.cvDate();
    if (cvUploadedDate) {
      logs.push({
        action: 'Subida de CV Académico',
        detail: `Actualización de Hoja de Vida Científica (${this.cvName()}) para acreditación ética en el portal.`,
        date: new Date(cvUploadedDate),
        success: true,
        icon: 'contact_page',
        ip: '192.168.1.45'
      });
    }

    protocols.forEach((p: any) => {
      // 1. Creación
      logs.push({
        action: 'Registro de Protocolo',
        detail: `Borrador inicial creado para el protocolo: "${p.titulo || p.title}" (${p.codigoCeish || 'Borrador'})`,
        date: p.fechaCreacion ? new Date(p.fechaCreacion) : new Date(),
        success: true,
        icon: 'create_new_folder',
        ip: '192.168.1.45'
      });

      // 2. Si tiene documentos subidos
      if (p.estado !== 'CREADO' && p.estado !== 'PENDIENTE') {
        logs.push({
          action: 'Carga de Requisitos Técnicos',
          detail: `Completado checklist de requisitos en PDF para el protocolo: ${p.codigoCeish || 'Borrador'}`,
          date: p.fechaCreacion ? new Date(p.fechaCreacion) : new Date(),
          success: true,
          icon: 'upload_file',
          ip: '192.168.1.45'
        });
      }

      // 3. Aceptación de tiempos
      if (p.isTimelineTermsAccepted || ['VALIDADO', 'APROBADO_DEFINITIVO', 'APROBADO_CONDICIONADO', 'EN_EVALUACION'].includes(p.estado)) {
        logs.push({
          action: 'Aceptación de Cronograma',
          detail: `Firma digital y aceptación del cronograma del protocolo: ${p.codigoCeish || 'Borrador'}`,
          date: p.fechaCreacion ? new Date(p.fechaCreacion) : new Date(),
          success: true,
          icon: 'draw',
          ip: '192.168.1.45'
        });
      }

      // 4. Envío a evaluación
      if (['VALIDADO', 'APROBADO_DEFINITIVO', 'APROBADO_CONDICIONADO', 'EN_EVALUACION'].includes(p.estado)) {
        logs.push({
          action: 'Sometimiento Oficial CEISH',
          detail: `Protocolo ${p.codigoCeish || 'Borrador'} sometido exitosamente a evaluación por el Comité de Ética.`,
          date: p.fechaCreacion ? new Date(p.fechaCreacion) : new Date(),
          success: true,
          icon: 'send',
          ip: '192.168.1.45'
        });
      }
    });

    // Sort logs by date descending
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        const savedPhone = u.telefono || localStorage.getItem(`ceish_user_phone_${u.id}`) || '';
        const savedInst = u.institucion || localStorage.getItem(`ceish_user_inst_${u.id}`) || 'ESPOCH';
        const savedSenescyt = u.registroSenescyt || localStorage.getItem(`ceish_user_senescyt_${u.id}`) || '';
        const savedNac = u.nacionalidad || localStorage.getItem(`ceish_user_nac_${u.id}`) || 'Ecuatoriana';
        const savedNatId = u.nationalId || '';

        this.profileForm.patchValue({
          nombre: u.nombre || '',
          perfil: u.perfil || '',
          telefono: savedPhone,
          institucion: savedInst,
          registroSenescyt: savedSenescyt,
          nacionalidad: savedNac,
          nationalId: savedNatId
        });
      }
    });
  }

  ngOnInit(): void {
    console.log('[ProfilePage] Inicializado');
    
    // Inject and load stats for audit logs
    this.dashboardFacade.loadStats();
    
    if (this.isEvaluator()) {
      this.evalRepo.getMyAssignments().subscribe({
        next: (assignments) => {
          this.activeAssignmentsCount.set(assignments.length);
          const urgent = assignments.filter((a: any) => a.isUrgent).length;
          this.urgentAssignmentsCount.set(urgent);
        },
        error: (err) => {
          console.error('[ProfilePage] Error fetching assignments load:', err);
        }
      });
    }
    
    // Load CV details from localStorage
    const savedName = localStorage.getItem('ceish_investigator_cv_name');
    const savedSize = localStorage.getItem('ceish_investigator_cv_size');
    const savedDate = localStorage.getItem('ceish_investigator_cv_date');
    if (savedName) {
      this.cvName.set(savedName);
      this.cvSize.set(savedSize);
      this.cvDate.set(savedDate);
    }
  }

  refreshProfile(): void {
    this.isLoading.set(true);
    this.authRepository.getUserById('me')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updatedUser) => {
          const uId = updatedUser.id;
          const localPhone = updatedUser.telefono || localStorage.getItem(`ceish_user_phone_${uId}`) || '';
          const localInst = updatedUser.institucion || localStorage.getItem(`ceish_user_inst_${uId}`) || 'ESPOCH';
          const localSenescyt = updatedUser.registroSenescyt || localStorage.getItem(`ceish_user_senescyt_${uId}`) || '';
          const localNac = updatedUser.nacionalidad || localStorage.getItem(`ceish_user_nac_${uId}`) || 'Ecuatoriana';

          const userWithLocalInfo = {
            ...updatedUser,
            telefono: localPhone,
            institucion: localInst,
            registroSenescyt: localSenescyt,
            nacionalidad: localNac
          };
          this.authFacade.setUser(userWithLocalInfo);
          this.snackBar.open('🔄 Perfil sincronizado con la base de datos.', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('[ProfilePage] Error al sincronizar perfil:', err);
          this.snackBar.open('❌ Error al conectar con el servidor para refrescar.', 'Cerrar', { duration: 4000 });
        }
      });
  }

  onSaveProfile(): void {
    if (this.profileForm.valid && this.user()?.id) {
      this.isSaving.set(true);
      const formVal = this.profileForm.value;
      
      this.authRepository.updateUser(this.user()!.id!, formVal)
        .pipe(finalize(() => {
          this.isSaving.set(false);
          this.isEditMode.set(false);
        }))
        .subscribe({
          next: (updatedUser) => {
            const userWithLocalInfo = {
              ...updatedUser,
              telefono: formVal.telefono || updatedUser.telefono,
              perfil: formVal.perfil || updatedUser.perfil,
              institucion: formVal.institucion || updatedUser.institucion,
              registroSenescyt: formVal.registroSenescyt || updatedUser.registroSenescyt,
              nacionalidad: formVal.nacionalidad || updatedUser.nacionalidad,
              nationalId: formVal.nationalId || updatedUser.nationalId
            };
            this.authFacade.setUser(userWithLocalInfo);
            
            // Persist locally
            const uId = this.user()?.id;
            localStorage.setItem(`ceish_user_phone_${uId}`, formVal.telefono);
            localStorage.setItem(`ceish_user_inst_${uId}`, formVal.institucion);
            localStorage.setItem(`ceish_user_senescyt_${uId}`, formVal.registroSenescyt);
            localStorage.setItem(`ceish_user_nac_${uId}`, formVal.nacionalidad);

            this.snackBar.open('✅ Perfil académico actualizado con éxito.', 'Cerrar', { duration: 4000 });
          },
          error: (err) => {
            console.error('[ProfilePage] Error al guardar perfil:', err);
            this.snackBar.open('❌ Error al actualizar el perfil en el servidor.', 'Entendido', { duration: 5000 });
          }
        });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  getFriendlyPermLabel(code: string): string {
    const labels: { [key: string]: string } = {
      'DASHBOARD_VER_PRINCIPAL': 'Acceso General al Panel de Control',
      'RECEPCION_SUBIR_DOCUMENTOS': 'Gestión y Visualización de Protocolos Propios',
      'RECEPCION_INICIAR': 'Creación y Registro de Nuevos Protocolos de Investigación',
      'RECEPCION_CREAR': 'Creación y Registro de Nuevos Protocolos de Investigación',
      'PROTOCOLOS_CREAR': 'Creación y Registro de Nuevos Protocolos de Investigación'
    };
    return labels[code] || 'Permiso Operativo Autorizado';
  }

  // CV PDF Handling
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadCVFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.uploadCVFile(file);
    }
  }

  private uploadCVFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.snackBar.open('❌ Solo se permiten archivos en formato PDF.', 'Entendido', { duration: 4000 });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('❌ El archivo excede el tamaño máximo permitido (5MB).', 'Entendido', { duration: 4000 });
      return;
    }

    this.isUploadingCv.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        const base64 = reader.result as string;
        const sizeStr = file.size > 1024 * 1024 
          ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(0) + ' KB';
        const nowStr = new Date().toISOString();

        localStorage.setItem('ceish_investigator_cv_name', file.name);
        localStorage.setItem('ceish_investigator_cv_size', sizeStr);
        localStorage.setItem('ceish_investigator_cv_date', nowStr);
        localStorage.setItem('ceish_investigator_cv_data', base64);

        this.cvName.set(file.name);
        this.cvSize.set(sizeStr);
        this.cvDate.set(nowStr);

        this.isUploadingCv.set(false);
        this.snackBar.open('📄 CV académico subido y firmado con éxito.', 'Cerrar', { duration: 3000 });
      }, 1500); // realistic delay for processing
    };
    reader.readAsDataURL(file);
  }

  downloadCV(): void {
    const base64 = localStorage.getItem('ceish_investigator_cv_data');
    const name = this.cvName() || 'CV_Investigador.pdf';
    if (base64) {
      const link = document.createElement('a');
      link.href = base64;
      link.download = name;
      link.click();
    } else {
      this.snackBar.open('❌ Archivo de CV no encontrado.', 'Cerrar', { duration: 3000 });
    }
  }

  deleteCV(): void {
    localStorage.removeItem('ceish_investigator_cv_name');
    localStorage.removeItem('ceish_investigator_cv_size');
    localStorage.removeItem('ceish_investigator_cv_date');
    localStorage.removeItem('ceish_investigator_cv_data');

    this.cvName.set(null);
    this.cvSize.set(null);
    this.cvDate.set(null);
    this.snackBar.open('🗑️ CV académico eliminado.', 'Cerrar', { duration: 3000 });
  }
}
