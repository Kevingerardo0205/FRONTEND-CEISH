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
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
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
    MatSnackBarModule
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
                <mat-icon>security</mat-icon>
                <div class="text">
                  <span class="label">Identificación de Cuenta</span>
                  <span class="val">ID: {{ user()?.id || 'No asignado' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon>verified_user</mat-icon>
                <div class="text">
                  <span class="label">Estado de Acceso</span>
                  <span class="val" [class.text-success]="user()?.activo" [class.text-danger]="!user()?.activo">
                    {{ user()?.activo ? 'Acceso Autorizado' : 'Acceso Revocado' }}
                  </span>
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

              <div class="field-container mb-4">
                <label class="field-label">Cargo Académico / Especialidad</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="perfil" placeholder="Ej: Docente Investigador">
                  <mat-icon matSuffix class="text-muted">work_outline</mat-icon>
                  <mat-error *ngIf="profileForm.get('perfil')?.hasError('required')">El cargo es requerido</mat-error>
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

        <!-- COLUMNA DERECHA: ACREDITACIONES Y PERMISOS -->
        <div class="accreditations-column">
          
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

          <!-- SECCIÓN 2: PRIVILEGIOS CIENTÍFICOS -->
          <div class="card-premium privileges-card shadow-soft">
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
      border-radius: 24px;
      border: 1px solid #e2e8f0;
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

    .privileges-card {
      .title-section {
        display: flex;
        gap: 1rem;
        align-items: center;
        mat-icon { color: #1e3a8a; font-size: 28px; width: 28px; height: 28px; }
        h3 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; }
        p { margin: 0; }
      }
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
  `]
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacade);
  private authRepository = inject(IAuthRepositoryPort);
  private snackBar = inject(MatSnackBar);

  user = this.authFacade.currentUser;
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  profileForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(5)]],
    perfil: ['', [Validators.required]]
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

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.profileForm.patchValue({
          nombre: u.nombre || '',
          perfil: u.perfil || ''
        });
      }
    });
  }

  ngOnInit(): void {
    console.log('[ProfilePage] Inicializado');
  }

  refreshProfile(): void {
    this.isLoading.set(true);
    this.authRepository.getUserById('me')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updatedUser) => {
          this.authFacade.setUser(updatedUser);
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
            this.authFacade.setUser(updatedUser);
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
}
