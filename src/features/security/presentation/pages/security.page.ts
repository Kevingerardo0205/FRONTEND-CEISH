import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleMatrixComponent } from '../components/role-matrix/role-matrix.component';
import { 
  GetSecurityCatalogUseCase, 
  GetRolePermissionsUseCase, 
  UpdateRolePermissionsUseCase 
} from '../../application/security.use-cases';
import { SecurityModule, SecurityPermission, SecurityRole } from '@domain/entities/security.entity';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [CommonModule, RoleMatrixComponent],
  template: `
    <div class="dashboard-admin-container animate-fade-in" style="padding: 24px;">
      
      <header class="main-header" style="margin-bottom: 24px;">
        <div class="header-info">
          <div class="breadcrumb-chip" style="display: inline-block; padding: 4px 12px; background: rgba(0,51,102,0.1); color: #003366; border-radius: 16px; font-size: 0.8rem; font-weight: 700; margin-bottom: 8px;">
            Administración / Seguridad
          </div>
          <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #1e293b;">Roles y Permisos</h1>
          <p style="margin: 4px 0 0 0; color: #64748b;">Gestión centralizada de accesos y privilegios del sistema</p>
        </div>
      </header>

      @if (loadingCatalog()) {
        <div class="loading-state" style="display: flex; justify-content: center; align-items: center; padding: 4rem; color: #64748b;">
          Cargando catálogo de seguridad...
        </div>
      } @else if (error()) {
        <div class="error-state" style="background: #fef2f2; color: #b91c1c; padding: 1.5rem; border-radius: 12px; text-align: center;">
          {{ error() }}
        </div>
      } @else {
        <app-role-matrix
          [roles]="roles()"
          [modules]="modules()"
          [permissions]="permissions()"
          [selectedRolePermissions]="selectedRolePermissions()"
          [isLoadingPermissions]="loadingPermissions()"
          (roleSelect)="onRoleSelected($event)"
          (savePermissions)="onSavePermissions($event)"
        />
      }
    </div>
  `
})
export class SecurityPage implements OnInit {
  private getCatalogUseCase = inject(GetSecurityCatalogUseCase);
  private getRolePermissionsUseCase = inject(GetRolePermissionsUseCase);
  private updateRoleUseCase = inject(UpdateRolePermissionsUseCase);
  private snackBar = inject(MatSnackBar);

  roles = signal<SecurityRole[]>([]);
  modules = signal<SecurityModule[]>([]);
  permissions = signal<SecurityPermission[]>([]);
  
  selectedRolePermissions = signal<SecurityPermission[]>([]);
  
  loadingCatalog = signal<boolean>(true);
  loadingPermissions = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadCatalog();
  }

  loadCatalog() {
    this.loadingCatalog.set(true);
    this.error.set(null);

    this.getCatalogUseCase.execute().subscribe({
      next: (data) => {
        this.roles.set(data.roles);
        this.modules.set(data.modules);
        this.permissions.set(data.allPermissions);
        this.loadingCatalog.set(false);
      },
      error: (err) => {
        console.error('Error cargando catálogo', err);
        this.error.set('No se pudo cargar la información base de seguridad.');
        this.loadingCatalog.set(false);
      }
    });
  }

  onRoleSelected(roleId: number) {
    this.loadingPermissions.set(true);
    this.getRolePermissionsUseCase.execute(roleId).subscribe({
      next: (perms) => {
        this.selectedRolePermissions.set(perms);
        this.loadingPermissions.set(false);
      },
      error: (err) => {
        console.error('Error cargando permisos del rol', err);
        this.snackBar.open('❌ No se pudieron obtener los permisos del rol', 'Cerrar', { duration: 3000 });
        this.loadingPermissions.set(false);
      }
    });
  }

  onSavePermissions(event: { roleId: number, permissionIds: number[] }) {
    this.updateRoleUseCase.execute(event.roleId, event.permissionIds).subscribe({
      next: () => {
        this.snackBar.open('✅ Privilegios actualizados correctamente', 'Cerrar', { 
          duration: 4000,
          panelClass: ['success-snackbar']
        });
        // Actualizar la lista local de permisos para el rol seleccionado
        this.onRoleSelected(event.roleId);
      },
      error: (err) => {
        console.error('Error actualizando permisos', err);
        this.snackBar.open('❌ Error al guardar los privilegios', 'Entendido', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
