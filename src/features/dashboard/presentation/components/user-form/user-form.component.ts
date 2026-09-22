import { Component, ChangeDetectionStrategy, input, output, inject, effect, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { GetSecurityCatalogUseCase } from '../../../../security/application/security.use-cases';

@Component({
  selector: 'app-user-registration-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatChipsModule
  ],
  template: `
    <div class="high-end-card">
      <header class="form-header">
        <div class="header-icon">
          <mat-icon>{{ userToEdit() ? 'manage_accounts' : 'person_add' }}</mat-icon>
        </div>
        <div>
          <h2>{{ userToEdit() ? 'Modificar Perfil' : 'Registro de Profesional' }}</h2>
          <p>{{ userToEdit() ? 'Actualice los accesos y datos del usuario' : 'Gestión de nuevos integrantes al sistema' }}</p>
        </div>
      </header>

      <form [formGroup]="userForm" (ngSubmit)="submit()" class="animate-fade-in">

        <!-- BANNER INFORMATIVO: INVITACIÓN -->
        <div class="info-banner mb-4" *ngIf="!userToEdit()">
          <mat-icon>mail_outline</mat-icon>
          <div class="info-content">
            <strong>Flujo de Invitación Activo</strong>
            <p>Al registrar al usuario, el sistema enviará automáticamente un correo con un código de seguridad (OTP) para que configure su propia contraseña.</p>
          </div>
        </div>

        <div class="field-container">
          <label class="field-label">Cédula / ID Nacional</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="cedula" placeholder="Ej: 0601234567" maxlength="10">
            <mat-icon matSuffix class="text-muted">fingerprint</mat-icon>
            <mat-error>Ingrese una cédula válida</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container">
          <label class="field-label">Nombre Completo</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="nombre" placeholder="Ej: Dra. María López">
            <mat-icon matSuffix class="text-muted">badge</mat-icon>
            <mat-error>El nombre es obligatorio (min 5 carácteres)</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container">
          <label class="field-label">Correo Institucional</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="email" placeholder="usuario@espoch.edu.ec" type="email">
            <mat-icon matSuffix class="text-muted">alternate_email</mat-icon>
            <mat-error>Ingrese un correo válido</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container mb-2">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <label class="field-label mb-0">Roles del Sistema</label>
            <span *ngIf="isInvestigadorLocked()" class="badge bg-secondary-subtle text-secondary border small d-inline-flex align-items-center gap-1">
              <mat-icon style="font-size: 14px; width: 14px; height: 14px;">lock</mat-icon> Rol Bloqueado (Exclusivo)
            </span>
          </div>
          <mat-form-field appearance="outline" class="custom-field">
            <mat-select formControlName="roles" placeholder="--- SELECCIONE ROLES ---" multiple [disabled]="!!isInvestigadorLocked()">
              <mat-option *ngFor="let r of availableRoles()" [value]="r.code" [disabled]="!!isInvestigadorLocked() && r.code !== 'INVESTIGADOR'">
                {{ r.label }}
              </mat-option>
            </mat-select>
            <mat-icon matSuffix [class.text-warning]="isInvestigadorLocked()" class="text-muted">
              {{ isInvestigadorLocked() ? 'lock' : 'admin_panel_settings' }}
            </mat-icon>
            <mat-error>Seleccione al menos un rol</mat-error>
          </mat-form-field>
        </div>

        <!-- ALERTA DE EXCLUSIVIDAD / SEGREGACIÓN DE FUNCIONES (SoD) -->
        <div *ngIf="isInvestigadorLocked()" class="investigador-sod-alert d-flex align-items-center gap-2 p-2.5 rounded-3 mb-3 animate-fade-in">
          <mat-icon class="sod-icon">lock</mat-icon>
          <span class="small">
            <strong>Perfil de Investigador Exclusivo:</strong> Los investigadores principales cuentan con un perfil cerrado y exclusivo. La asignación de roles de comité se encuentra <strong>bloqueada por interfaz</strong>.
          </span>
        </div>

        <!-- CONFIGURACIÓN GRANULAR DE VIGENCIA POR CADA ROL -->
        <div *ngIf="rolesConfig().length > 0" class="roles-config-section mb-4 animate-fade-in">
          <div class="section-header mb-3">
            <div class="d-flex align-items-center gap-2">
              <mat-icon class="text-primary small-icon">tune</mat-icon>
              <h3 class="section-title m-0">Vigencia y Suplencias por Perfil</h3>
            </div>
            <p class="section-description text-muted small mt-1 mb-0">
              Defina si cada perfil asignado tiene vigencia permanente o es una suplencia temporal con fecha límite.
            </p>
          </div>

          <div class="roles-config-list d-flex flex-column gap-3">
            <div *ngFor="let rc of rolesConfig()" class="role-config-card p-3 rounded-3" [class.temporal-active]="rc.isTemporal">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" [ngClass]="rc.code.toLowerCase()">{{ rc.name }}</span>
                  <span class="status-type-label small" [class.text-warning]="rc.isTemporal" [class.text-success]="!rc.isTemporal">
                    {{ rc.isTemporal ? '⏳ Suplencia Temporal' : '🟢 Permanente' }}
                  </span>
                </div>
                <mat-slide-toggle 
                  *ngIf="rc.code.toUpperCase() !== 'INVESTIGADOR'"
                  [checked]="rc.isTemporal" 
                  (change)="toggleRoleTemporal(rc.code, $event.checked)"
                  color="accent">
                </mat-slide-toggle>
              </div>

              <!-- CAMPOS TEMPORALES DESPLEGABLES CON FUNCIONES DE FECHA -->
              <div *ngIf="rc.isTemporal && rc.code.toUpperCase() !== 'INVESTIGADOR'" class="temporal-fields mt-3 pt-3 border-top animate-fade-in">
                <!-- PRESETS RÁPIDOS DE FECHA -->
                <div class="date-presets-bar mb-3">
                  <span class="presets-label small fw-bold text-muted me-2">Funciones de Fecha:</span>
                  <div class="preset-chips-group d-inline-flex flex-wrap gap-1">
                    <button type="button" class="preset-btn" (click)="applyDatePreset(rc.code, '15d')">+15 días</button>
                    <button type="button" class="preset-btn" (click)="applyDatePreset(rc.code, '1m')">+1 mes</button>
                    <button type="button" class="preset-btn" (click)="applyDatePreset(rc.code, '3m')">+3 meses</button>
                    <button type="button" class="preset-btn" (click)="applyDatePreset(rc.code, '6m')">+6 meses</button>
                    <button type="button" class="preset-btn" (click)="applyDatePreset(rc.code, 'end_year')">Fin de Año</button>
                  </div>
                </div>

                <div class="row g-2">
                  <div class="col-md-6 field-container mb-0">
                    <label class="field-label small">Fecha Límite</label>
                    <mat-form-field appearance="outline" class="custom-field w-100">
                      <input matInput type="date" [min]="todayDateString" [value]="rc.validUntil" (input)="updateRoleValidUntil(rc.code, $any($event.target).value)">
                      <mat-icon matSuffix class="text-muted">event</mat-icon>
                      <mat-hint *ngIf="rc.validUntil" class="text-primary fw-bold">
                        {{ getDaysRemainingText(rc.validUntil) }}
                      </mat-hint>
                    </mat-form-field>
                  </div>
                  <div class="col-md-6 field-container mb-0">
                    <label class="field-label small">Motivo Oficial</label>
                    <mat-form-field appearance="outline" class="custom-field w-100">
                      <input matInput [value]="rc.reason" (input)="updateRoleReason(rc.code, $any($event.target).value)" placeholder="Ej: Subrogación por licencia médica">
                      <mat-icon matSuffix class="text-muted">description</mat-icon>
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="field-container">
          <label class="field-label">Perfil Académico / Cargo</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="perfil" placeholder="Ej: Docente Investigador">
            <mat-icon matSuffix class="text-muted">work_outline</mat-icon>
            <mat-error>Campo requerido</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container d-flex align-items-center justify-content-between py-2" *ngIf="userToEdit()">
          <label class="field-label m-0">Estado de la cuenta</label>
          <div class="d-flex align-items-center gap-2">
            <span [class.text-primary]="userForm.get('activo')?.value" [class.text-muted]="!userForm.get('activo')?.value" class="small fw-bold">
              {{ userForm.get('activo')?.value ? 'ACTIVA' : 'REVOCADA' }}
            </span>
            <mat-slide-toggle formControlName="activo" color="primary"></mat-slide-toggle>
          </div>
        </div>

        <div class="actions-stack mt-4">
          <button mat-flat-button class="submit-btn" type="submit" [disabled]="userForm.invalid || isLoading()">
            <mat-spinner *ngIf="isLoading()" diameter="20" class="me-2"></mat-spinner>
            <span>{{ userToEdit() ? 'Guardar Cambios' : 'Confirmar Registro' }}</span>
          </button>
          <button mat-button class="cancel-btn" type="button" (click)="onCancel()">
            Descartar cambios
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .high-end-card {
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
      position: sticky;
      top: 2rem;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2.5rem;

      .header-icon {
        width: 48px; height: 48px;
        background: rgba(0, 51, 102, 0.05);
        color: vars.$color-primary;
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 24px; width: 24px; height: 24px; }
      }

      h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
      p { margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 500; }
    }

    .info-banner {
      display: flex;
      gap: 12px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 16px;
      border-radius: 16px;
      color: #0369a1;
      mat-icon { color: #0ea5e9; }
      .info-content {
        strong { display: block; font-size: 0.85rem; margin-bottom: 2px; }
        p { margin: 0; font-size: 0.75rem; line-height: 1.4; color: #075985; }
      }
    }

    .field-container {
      margin-bottom: 1.5rem;
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
        box-shadow: 0 0 0 2px vars.$color-primary;
      }
    }

    .actions-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .submit-btn {
      height: 52px;
      background-color: vars.$color-primary !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 51, 102, 0.2); }
    }

    .roles-config-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.25rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .role-config-card {
      background: white;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.25s ease;

      &.temporal-active {
        border-color: #f59e0b;
        background: #fffdf5;
      }
    }

    .date-presets-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }

    .preset-chips-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .preset-btn {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
        color: #0f172a;
        transform: translateY(-1px);
      }

      &:active {
        transform: scale(0.96);
      }
    }

    .investigador-sod-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      font-weight: 500;
      .sod-icon {
        color: #2563eb;
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    .small-icon { font-size: 1.25rem; width: 1.25rem; height: 1.25rem; }
    .status-type-label { font-weight: 600; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UserRegistrationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogUseCase = inject(GetSecurityCatalogUseCase);

  readonly todayDateString = new Date().toISOString().split('T')[0];

  userToEdit = input<UserAdmin | null>(null);
  forcedRole = input<string | null>(null);
  isLoading = signal<boolean>(false);

  save = output<UserAdmin>();
  cancel = output<void>();

  readonly availableRoles = signal<{ code: string; label: string }[]>([
    { code: 'ADMIN_TI', label: 'Administrador TI' },
    { code: 'SECRETARIA', label: 'Secretaría' },
    { code: 'PRESIDENTE', label: 'Presidente/a' },
    { code: 'EVALUADOR', label: 'Evaluador' },
    { code: 'INVESTIGADOR', label: 'Investigador' }
  ]);

  readonly rolesConfig = signal<{
    code: string;
    name: string;
    isTemporal: boolean;
    validUntil: string;
    reason: string;
  }[]>([]);

  readonly isInvestigadorSelected = computed(() => 
    this.rolesConfig().some(c => c.code.toUpperCase() === 'INVESTIGADOR')
  );

  readonly isInvestigadorLocked = computed(() => {
    if (this.forcedRole() === 'INVESTIGADOR') return true;
    const user = this.userToEdit();
    if (user) {
      return (
        user.rol === 'INVESTIGADOR' ||
        (user.userRoles && user.userRoles.some(r => r.code.toUpperCase() === 'INVESTIGADOR')) ||
        (user.roles && user.roles.includes('INVESTIGADOR'))
      );
    }
    return this.rolesConfig().some(c => c.code.toUpperCase() === 'INVESTIGADOR');
  });

  userForm: FormGroup = this.fb.group({
    cedula: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    nombre: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    roles: [[], [Validators.required, Validators.minLength(1)]],
    perfil: ['', [Validators.required]],
    activo: [true]
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const user = this.userToEdit();
      const forced = this.forcedRole();
      const isLocked = (forced === 'INVESTIGADOR') || (user && (
        user.rol === 'INVESTIGADOR' ||
        (user.userRoles && user.userRoles.some(r => r.code.toUpperCase() === 'INVESTIGADOR')) ||
        (user.roles && user.roles.includes('INVESTIGADOR'))
      ));

      if (user) {
        const userRolesList = isLocked
          ? ['INVESTIGADOR']
          : ((user.userRoles && user.userRoles.length > 0)
              ? user.userRoles.map(ur => ur.code)
              : (user.roles && user.roles.length > 0 ? user.roles : (user.rol ? [user.rol] : [])));

        this.userForm.patchValue({
          cedula: user.cedula || '',
          nombre: user.nombre,
          email: user.email,
          roles: userRolesList,
          perfil: user.perfil || (isLocked ? 'Investigador' : ''),
          activo: user.activo !== false
        });

        // Inicializar configuración granular a partir de userRoles del usuario
        const initialConfigs = userRolesList.map((roleCode: string) => {
          const existing = user.userRoles?.find(ur => ur.code.toUpperCase() === roleCode.toUpperCase());
          const validUntil = existing?.validUntil ? existing.validUntil.split('T')[0] : '';
          return {
            code: roleCode,
            name: this.getRoleLabel(roleCode),
            isTemporal: Boolean(existing?.validUntil),
            validUntil,
            reason: existing?.reason || ''
          };
        });
        this.rolesConfig.set(initialConfigs);

      } else if (forced === 'INVESTIGADOR') {
        this.userForm.reset({
          roles: ['INVESTIGADOR'],
          perfil: 'Investigador',
          activo: true
        });
        this.rolesConfig.set([{
          code: 'INVESTIGADOR',
          name: 'Investigador',
          isTemporal: false,
          validUntil: '',
          reason: ''
        }]);
      } else {
        this.userForm.reset({ roles: [], activo: true });
        this.rolesConfig.set([]);
      }

      if (isLocked) {
        this.userForm.get('roles')?.disable({ emitEvent: false });
      } else {
        this.userForm.get('roles')?.enable({ emitEvent: false });
      }
    });

    // Sincronizar rolesConfig dinámicamente aplicando la Regla de Exclusividad de Investigador (SoD)
    this.userForm.get('roles')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedCodes: string[]) => {
      if (!selectedCodes || selectedCodes.length === 0) {
        this.rolesConfig.set([]);
        return;
      }

      // Regla SoD: Un Investigador no puede poseer roles administrativos o de evaluación simultáneamente
      const hasInvestigador = selectedCodes.includes('INVESTIGADOR');
      const prevCodes = this.rolesConfig().map(c => c.code.toUpperCase());
      const hadInvestigador = prevCodes.includes('INVESTIGADOR');

      let normalizedCodes = selectedCodes;
      if (hasInvestigador && selectedCodes.length > 1) {
        if (!hadInvestigador) {
          // El usuario acaba de seleccionar INVESTIGADOR -> desmarcar roles de comité
          normalizedCodes = ['INVESTIGADOR'];
        } else {
          // El usuario tenía INVESTIGADOR y seleccionó un rol de comité -> desmarcar INVESTIGADOR
          normalizedCodes = selectedCodes.filter(c => c !== 'INVESTIGADOR');
        }
        this.userForm.get('roles')?.setValue(normalizedCodes, { emitEvent: false });
      }

      const current = this.rolesConfig();
      const updated = normalizedCodes.map((code) => {
        const existing = current.find(c => c.code.toUpperCase() === code.toUpperCase());
        if (existing) return existing;
        return {
          code,
          name: this.getRoleLabel(code),
          isTemporal: false,
          validUntil: '',
          reason: ''
        };
      });
      this.rolesConfig.set(updated);
    });
  }

  getRoleLabel(code: string): string {
    if (!code) return '';
    const found = this.availableRoles().find(r => r.code.toUpperCase() === code.toUpperCase());
    return found ? found.label : code;
  }

  toggleRoleTemporal(roleCode: string, isTemporal: boolean) {
    this.rolesConfig.update(list => list.map(item => {
      if (item.code.toUpperCase() === roleCode.toUpperCase()) {
        let validUntil = item.validUntil;
        if (isTemporal && !validUntil) {
          const defaultTarget = new Date();
          defaultTarget.setMonth(defaultTarget.getMonth() + 1);
          validUntil = this.formatDateToLocalString(defaultTarget);
        }
        return { ...item, isTemporal, validUntil };
      }
      return item;
    }));
  }

  updateRoleValidUntil(roleCode: string, validUntil: string) {
    this.rolesConfig.update(list => list.map(item => {
      if (item.code.toUpperCase() === roleCode.toUpperCase()) {
        return { ...item, validUntil };
      }
      return item;
    }));
  }

  updateRoleReason(roleCode: string, reason: string) {
    this.rolesConfig.update(list => list.map(item => {
      if (item.code.toUpperCase() === roleCode.toUpperCase()) {
        return { ...item, reason };
      }
      return item;
    }));
  }

  applyDatePreset(roleCode: string, preset: '15d' | '1m' | '3m' | '6m' | 'end_year'): void {
    const target = new Date();
    switch (preset) {
      case '15d':
        target.setDate(target.getDate() + 15);
        break;
      case '1m':
        target.setMonth(target.getMonth() + 1);
        break;
      case '3m':
        target.setMonth(target.getMonth() + 3);
        break;
      case '6m':
        target.setMonth(target.getMonth() + 6);
        break;
      case 'end_year':
        target.setFullYear(target.getFullYear(), 11, 31);
        break;
    }
    const dateStr = this.formatDateToLocalString(target);
    this.updateRoleValidUntil(roleCode, dateStr);
  }

  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDaysRemainingText(validUntilStr?: string): string {
    if (!validUntilStr) return '';
    try {
      const target = new Date(validUntilStr + 'T23:59:59');
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      if (isNaN(diffMs)) return '';
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Expirado';
      if (diffDays === 0) return 'Expira hoy';
      if (diffDays === 1) return 'Expira mañana';
      return `Vigente durante ${diffDays} días`;
    } catch {
      return '';
    }
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.catalogUseCase.execute().subscribe({
      next: (catalog) => {
        const activeRoles = catalog.roles
          .filter(r => r.isActive !== false)
          .map(r => ({ code: r.code, label: r.name }));
        if (activeRoles.length > 0) {
          this.availableRoles.set(activeRoles);
          // Actualizar nombres amigables en rolesConfig
          this.rolesConfig.update(list => list.map(item => ({
            ...item,
            name: this.getRoleLabel(item.code)
          })));
        }
      },
      error: (err: unknown) => {
        console.warn('[UserRegistrationFormComponent] No se pudieron cargar los roles de la API, usando roles por defecto', err);
      }
    });
  }

  onCancel() {
    this.userForm.reset();
    this.rolesConfig.set([]);
    this.cancel.emit();
  }

  submit() {
    const isLocked = this.isInvestigadorLocked();
    if (this.userForm.valid || isLocked) {
      const formVal = this.userForm.getRawValue();
      const rolesList = isLocked ? ['INVESTIGADOR'] : (formVal.roles && formVal.roles.length > 0 ? formVal.roles : ['INVESTIGADOR']);
      const userRoles = isLocked
        ? [{ code: 'INVESTIGADOR', name: 'Investigador', validUntil: null, reason: null, isExpired: false }]
        : this.rolesConfig().map(rc => ({
            code: rc.code,
            name: rc.name,
            validUntil: rc.isTemporal && rc.validUntil ? rc.validUntil : null,
            reason: rc.isTemporal ? (rc.reason || null) : null,
            isExpired: false
          }));

      this.save.emit({
        ...this.userToEdit(),
        ...formVal,
        roles: rolesList,
        rol: rolesList[0] || 'INVESTIGADOR',
        userRoles
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}

