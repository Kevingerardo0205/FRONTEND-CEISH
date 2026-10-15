import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SecurityRole, CreateRoleDTO, UpdateRoleDTO } from '@domain/entities/security.entity';
import { RolePermissionsState } from '../../application/role-permissions.state';
import { RoleMatrixComponent } from '../components/role-matrix/role-matrix.component';
import { RoleFormDialogComponent, RoleDialogData } from '../components/role-dialog/role-form-dialog.component';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RoleMatrixComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="security-page-layout animate-fade-in">
      
      <!-- Encabezado Principal de la Página -->
      <header class="page-top-header">
        <div class="header-titles">
          <div class="badge-chip">
            <mat-icon class="badge-icon">admin_panel_settings</mat-icon>
            <span>ADMINISTRACIÓN & PRIVILEGIOS</span>
          </div>
          <h1>Gestión de Roles y Permisos</h1>
          <p class="subtitle">
            Configure la matriz de privilegios y accesos para cada perfil del sistema CEISH ESPOCH.
          </p>
        </div>

        <div class="header-actions">
          <button 
            mat-flat-button 
            class="btn-new-role" 
            (click)="openCreateRoleDialog()">
            <mat-icon>add_moderator</mat-icon>
            Nuevo Rol
          </button>
        </div>
      </header>

      <!-- Contenido Principal / Matriz de Seguridad -->
      @if (state.loadingCatalog()) {
        <div class="catalog-loading-panel">
          <mat-spinner diameter="48"></mat-spinner>
          <div class="loading-texts">
            <h3>Cargando ecosistema de seguridad</h3>
            <p>Obteniendo roles, módulos y catálogo de privilegios...</p>
          </div>
        </div>
      } @else if (state.error()) {
        <div class="catalog-error-panel">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <div class="error-content">
            <h3>Error al cargar los catálogos</h3>
            <p>{{ state.error() }}</p>
            <button mat-flat-button color="warn" (click)="retryCatalog()">
              Reintentar Carga
            </button>
          </div>
        </div>
      } @else {
        <app-role-matrix
          (roleSelect)="onRoleSelected($event)"
          (createRole)="openCreateRoleDialog()"
          (editRole)="openEditRoleDialog($event)"
          (deleteRole)="onDeleteRoleRequested($event)"
          (savePermissions)="onSavePermissions()"
          (resetPreset)="onResetRolePreset()"
        />
      }
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .security-page-layout {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-top-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 0.5rem;

      .header-titles {
        .badge-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(0, 51, 102, 0.08);
          color: #003366;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 8px;

          .badge-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        h1 {
          margin: 0;
          font-size: 1.9rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.7px;
        }

        .subtitle {
          margin: 4px 0 0 0;
          font-size: 0.95rem;
          color: #64748b;
        }
      }

      .header-actions {
        .btn-new-role {
          background: #003366;
          color: white;
          border-radius: 12px;
          height: 42px;
          padding: 0 20px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);

          mat-icon {
            margin-right: 6px;
            font-size: 20px;
          }
        }
      }
    }

    .catalog-loading-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8rem 2rem;
      background: white;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      gap: 1.5rem;

      .loading-texts {
        text-align: center;
        h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        p { margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b; }
      }
    }

    .catalog-error-panel {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 20px;

      .error-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #dc2626;
      }

      .error-content {
        h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #991b1b; }
        p { margin: 4px 0 1rem 0; color: #b91c1c; font-size: 0.95rem; }
      }
    }
  `]
})
export class SecurityPage implements OnInit {
  readonly state = inject(RolePermissionsState);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.state.loadCatalog().subscribe({
      next: (catalog) => {
        // Auto-seleccionar el primer rol si existe
        if (catalog.roles.length > 0 && !this.state.selectedRoleId()) {
          this.state.selectRole(catalog.roles[0].id).subscribe();
        }
      }
    });
  }

  retryCatalog(): void {
    this.state.loadCatalog().subscribe();
  }

  onRoleSelected(roleId: number): void {
    if (this.state.selectedRoleId() === roleId) return;

    if (this.state.isDirty()) {
      const confirmDiscard = window.confirm(
        'Tiene cambios pendientes en los permisos del rol actual. ¿Desea descartarlos y cambiar de rol?'
      );
      if (!confirmDiscard) return;
    }

    this.state.selectRole(roleId).subscribe({
      error: () => {
        this.snackBar.open('❌ No se pudieron cargar los permisos del rol', 'Cerrar', {
          duration: 3500
        });
      }
    });
  }

  onSavePermissions(): void {
    const roleName = this.state.selectedRole()?.name || 'el rol';
    const diff = this.state.diffSummary();

    this.state.savePermissions().subscribe({
      next: () => {
        this.snackBar.open(
          `✅ Permisos de "${roleName}" guardados exitosamente (+${diff.added.length} / -${diff.removed.length})`,
          'Cerrar',
          { duration: 4000 }
        );
      },
      error: () => {
        this.snackBar.open('❌ Error al actualizar los privilegios del rol', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  onResetRolePreset(): void {
    const role = this.state.selectedRole();
    if (!role) return;

    const confirmReset = window.confirm(
      `¿Desea restablecer todos los permisos del rol "${role.name}" (${role.code}) a la plantilla reglamentada oficial del CEISH?\n\nEsta acción descartará cualquier modificación personalizada y devolverá el rol a estado estándar.`
    );
    if (!confirmReset) return;

    this.state.resetCurrentRoleToPreset().subscribe({
      next: (restoredRole) => {
        this.snackBar.open(
          `✅ Rol "${restoredRole.name}" restablecido a la plantilla normativa oficial del CEISH`,
          'Cerrar',
          { duration: 4000 }
        );
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err.error?.message || 'Error al restablecer el rol a la plantilla oficial';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4500 });
      }
    });
  }

  openCreateRoleDialog(): void {
    const dialogRef = this.dialog.open(RoleFormDialogComponent, {
      width: '520px',
      data: { mode: 'create' } as RoleDialogData
    });

    dialogRef.afterClosed().subscribe((result: CreateRoleDTO | undefined) => {
      if (!result) return;

      this.state.createRole(result).subscribe({
        next: (createdRole) => {
          this.snackBar.open(`✅ Rol "${createdRole.name}" creado con éxito`, 'Cerrar', {
            duration: 3500
          });
          this.state.selectRole(createdRole.id).subscribe();
        },
        error: (err: { error?: { message?: string } }) => {
          const msg = err.error?.message || 'Error al crear el rol en el servidor';
          this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  openEditRoleDialog(role: SecurityRole): void {
    const dialogRef = this.dialog.open(RoleFormDialogComponent, {
      width: '520px',
      data: { mode: 'edit', role } as RoleDialogData
    });

    dialogRef.afterClosed().subscribe((result: UpdateRoleDTO | undefined) => {
      if (!result) return;

      this.state.updateRole(role.id, result).subscribe({
        next: (updatedRole) => {
          this.snackBar.open(`✅ Rol "${updatedRole.name}" actualizado`, 'Cerrar', {
            duration: 3500
          });
        },
        error: (err: { error?: { message?: string } }) => {
          const msg = err.error?.message || 'Error al actualizar el rol';
          this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  onDeleteRoleRequested(role: SecurityRole): void {
    const confirmDelete = window.confirm(
      `¿Está seguro de que desea desactivar el rol "${role.name}" (${role.code})?\n\nLos usuarios vinculados a este rol perderán sus accesos asociados.`
    );
    if (!confirmDelete) return;

    this.state.deleteRole(role.id).subscribe({
      next: () => {
        this.snackBar.open(`✅ Rol "${role.name}" desactivado del sistema`, 'Cerrar', {
          duration: 3500
        });
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err.error?.message || 'No se pudo desactivar el rol';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 5000 });
      }
    });
  }
}

