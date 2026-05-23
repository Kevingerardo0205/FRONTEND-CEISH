import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SecurityModule, SecurityPermission, SecurityRole } from '@domain/entities/security.entity';

interface ModuleGroup {
  moduleName: string;
  moduleIcon: string;
  permissions: SecurityPermission[];
}

@Component({
  selector: 'app-role-matrix',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="matrix-container animate-fade-in">
      <!-- Columna de Roles (Sidebar Izquierdo) -->
      <aside class="roles-sidebar glass-panel">
        <div class="sidebar-header">
          <h3 class="sidebar-title">
            <mat-icon>admin_panel_settings</mat-icon>
            Roles del Sistema
          </h3>
          <p class="sidebar-subtitle">Seleccione un perfil para configurar</p>
        </div>
        
        <div class="roles-list custom-scrollbar">
          @for (role of roles(); track role.id) {
            <button 
              class="role-item-btn" 
              [class.active]="selectedRoleId() === role.id"
              (click)="onRoleSelect(role.id)">
              <div class="role-avatar">{{ role.name.charAt(0) }}</div>
              <div class="role-text-group">
                <span class="role-name">{{ role.name }}</span>
                <span class="role-status">{{ isSelectedRole(role.id) ? activePermsCount() : (role.permissions?.length || 0) }} permisos</span>
              </div>
              @if (isLoadingPermissions() && selectedRoleId() === role.id) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon class="active-indicator">check_circle</mat-icon>
              }
            </button>
          }
        </div>
      </aside>

      <!-- Columna de Permisos (Área Principal) -->
      <main class="permissions-area glass-panel">
        @if (selectedRoleId()) {
          <div class="area-navbar">
            <div class="nav-info">
              <span class="nav-badge">MODO EDICIÓN</span>
              <h2>{{ currentRoleName() }}</h2>
              <p>Configure los privilegios granulares del sistema</p>
            </div>
            <div class="nav-actions">
              <button mat-stroked-button class="discard-btn" (click)="selectedRoleId.set(null)">
                Cancelar
              </button>
              <button mat-flat-button color="primary" class="save-btn-premium" [disabled]="isLoadingPermissions()" (click)="onSave()">
                <mat-icon>verified_user</mat-icon>
                Guardar Cambios
              </button>
            </div>
          </div>

          <div class="modules-scroll-area custom-scrollbar">
            @if (isLoadingPermissions()) {
              <div class="loading-overlay">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Sincronizando permisos...</p>
              </div>
            } @else {
              <div class="modules-masonry">
                @for (group of permissionsByModule(); track group.moduleName) {
                  <div class="module-glass-card">
                    <div class="card-header">
                      <div class="icon-box">
                        <mat-icon>{{ group.moduleIcon }}</mat-icon>
                      </div>
                      <h4>{{ group.moduleName }}</h4>
                      <span class="perm-count-chip">{{ group.permissions.length }}</span>
                    </div>
                    
                    <div class="card-body">
                      @for (perm of group.permissions; track perm.id) {
                        <div class="permission-row" [class.row-active]="isPermissionSelected(perm.id)">
                          <mat-checkbox 
                            [checked]="isPermissionSelected(perm.id)"
                            (change)="togglePermission(perm.id, $event.checked)"
                            color="primary">
                            <div class="perm-label-stack">
                              <span class="perm-title">{{ perm.name }}</span>
                              <span class="perm-key">{{ perm.code }}</span>
                            </div>
                          </mat-checkbox>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="empty-state-premium">
            <div class="glass-orb">
              <mat-icon>fingerprint</mat-icon>
            </div>
            <h3>Gestión de Accesos</h3>
            <p>Seleccione un rol de la lista izquierda para comenzar a auditar y modificar sus capacidades en el sistema.</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .matrix-container {
      display: flex;
      gap: 2rem;
      height: calc(100vh - 180px);
      min-height: 650px;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    /* --- SIDEBAR --- */
    .roles-sidebar { width: 340px; }
    
    .sidebar-header {
      padding: 2rem;
      background: linear-gradient(to bottom, rgba(0,51,102,0.03), transparent);
      border-bottom: 1px solid rgba(0,0,0,0.05);
      
      .sidebar-title { 
        margin: 0; display: flex; align-items: center; gap: 12px; 
        font-size: 1.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;
        mat-icon { color: vars.$color-primary; font-size: 28px; width: 28px; height: 28px; }
      }
      .sidebar-subtitle { margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; font-weight: 500; }
    }

    .roles-list { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 10px; }

    .role-item-btn {
      display: flex; align-items: center; gap: 14px; padding: 14px 18px;
      border: 1px solid transparent; background: transparent; border-radius: 16px;
      cursor: pointer; text-align: left; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative; overflow: hidden;

      &:hover { background: rgba(0,51,102,0.02); border-color: rgba(0,51,102,0.1); transform: translateX(5px); }

      &.active {
        background: white;
        border-color: vars.$color-primary;
        box-shadow: 0 4px 15px rgba(0, 51, 102, 0.08);
        .role-name { color: vars.$color-primary; font-weight: 800; }
        .role-avatar { background: vars.$color-primary; color: white; transform: scale(1.05); }
        .active-indicator { opacity: 1; transform: scale(1); }
      }
    }

    .role-avatar {
      width: 44px; height: 44px; border-radius: 12px; background: #f1f5f9;
      color: #64748b; display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 1.3rem; transition: all 0.3s ease;
    }

    .role-text-group {
      flex: 1;
      .role-name { display: block; font-size: 1rem; font-weight: 600; color: #334155; }
      .role-status { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    }

    .active-indicator { color: vars.$color-primary; font-size: 20px; width: 20px; height: 20px; opacity: 0; transform: scale(0.5); transition: all 0.3s ease; }

    /* --- MAIN AREA --- */
    .permissions-area { flex: 1; }

    .area-navbar {
      padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.5); border-bottom: 1px solid rgba(0,0,0,0.05);
      
      .nav-info {
        h2 { margin: 0; font-size: 1.6rem; font-weight: 900; color: #0f172a; letter-spacing: -0.8px; }
        p { margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b; font-weight: 500; }
        .nav-badge { 
          display: inline-block; font-size: 10px; font-weight: 800; color: vars.$color-primary; 
          background: rgba(0,51,102,0.1); padding: 2px 8px; border-radius: 4px; margin-bottom: 6px;
        }
      }
      
      .nav-actions { display: flex; gap: 12px; }
      .discard-btn { height: 48px; border-radius: 12px; font-weight: 600; color: #64748b; }
      .save-btn-premium {
        height: 48px; border-radius: 12px; padding: 0 24px; font-weight: 800;
        background: vars.$color-primary; color: white;
        box-shadow: 0 10px 20px rgba(0, 51, 102, 0.2);
        mat-icon { margin-right: 8px; font-size: 20px; }
      }
    }

    .modules-scroll-area { flex: 1; overflow-y: auto; padding: 2.5rem; position: relative; }
    .modules-masonry {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 2rem; align-content: start;
    }

    .loading-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.6); backdrop-filter: blur(4px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem; color: #64748b; font-weight: 600;
    }

    .module-glass-card {
      background: white; border: 1px solid #f1f5f9; border-radius: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.3s ease;
      &:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border-color: rgba(0,51,102,0.1); }
    }

    .card-header {
      padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 14px;
      .icon-box {
        width: 36px; height: 36px; border-radius: 10px; background: rgba(0,51,102,0.05);
        color: vars.$color-primary; display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 20px; width: 20px; height: 20px; }
      }
      h4 { margin: 0; flex: 1; font-size: 1.05rem; font-weight: 800; color: #1e293b; }
      .perm-count-chip { font-size: 11px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 20px; }
    }

    .card-body { padding: 0.75rem; display: flex; flex-direction: column; gap: 4px; }

    .permission-row {
      padding: 8px 12px; border-radius: 12px; transition: all 0.2s ease;
      &:hover { background: #f8fafc; }
      &.row-active { background: rgba(0,51,102,0.03); }

      ::ng-deep .mat-mdc-checkbox {
        width: 100%;
        .mdc-form-field { width: 100%; cursor: pointer; }
      }
    }

    .perm-label-stack {
      display: flex; flex-direction: column; padding: 4px 0;
      .perm-title { font-size: 0.95rem; font-weight: 600; color: #334155; line-height: 1.4; }
      .perm-key { font-size: 0.7rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
    }

    /* --- EMPTY STATE --- */
    .empty-state-premium {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem;
      .glass-orb {
        width: 120px; height: 120px; border-radius: 40px; background: linear-gradient(135deg, rgba(0,51,102,0.05) 0%, rgba(0,51,102,0.1) 100%);
        display: flex; align-items: center; justify-content: center; margin-bottom: 2.5rem;
        mat-icon { font-size: 60px; width: 60px; height: 60px; color: vars.$color-primary; opacity: 0.8; }
      }
      h3 { font-size: 1.8rem; font-weight: 900; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.5px; }
      p { color: #64748b; max-width: 420px; font-size: 1rem; line-height: 1.6; font-weight: 500; }
    }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class RoleMatrixComponent {
  roles = input.required<SecurityRole[]>();
  modules = input.required<SecurityModule[]>();
  permissions = input.required<SecurityPermission[]>();
  
  selectedRolePermissions = input<SecurityPermission[]>([]);
  isLoadingPermissions = input<boolean>(false);

  roleSelect = output<number>();
  savePermissions = output<{ roleId: number, permissionIds: number[] }>();

  selectedRoleId = signal<number | null>(null);
  selectedPermissionsSet = signal<Set<number>>(new Set());

  currentRoleName = computed(() => {
    const roleId = this.selectedRoleId();
    if (!roleId) return '';
    return this.roles().find(r => r.id === roleId)?.name || 'Sin nombre';
  });

  activePermsCount = computed(() => this.selectedPermissionsSet().size);

  permissionsByModule = computed(() => {
    const allPerms = this.permissions();
    const allMods = this.modules();
    const groups = new Map<number, ModuleGroup>();

    allMods.forEach(mod => {
      groups.set(mod.id, {
        moduleName: mod.name,
        moduleIcon: mod.icon || 'folder',
        permissions: []
      });
    });

    allPerms.forEach(p => {
      const mid = p.moduleId || (p.module?.id);
      if (mid && groups.has(mid)) {
        groups.get(mid)!.permissions.push(p);
      } else {
        const modFromPerm = p.module;
        if (modFromPerm) {
          if (!groups.has(modFromPerm.id)) {
            groups.set(modFromPerm.id, { moduleName: modFromPerm.name, moduleIcon: modFromPerm.icon || 'folder', permissions: [] });
          }
          groups.get(modFromPerm.id)!.permissions.push(p);
        } else {
          if (!groups.has(0)) groups.set(0, { moduleName: 'Globales', moduleIcon: 'public', permissions: [] });
          groups.get(0)!.permissions.push(p);
        }
      }
    });

    return Array.from(groups.values()).filter(g => g.permissions.length > 0);
  });

  constructor() {
    effect(() => {
      const perms = this.selectedRolePermissions();
      const currentSet = new Set<number>();
      perms.forEach(p => currentSet.add(p.id));
      this.selectedPermissionsSet.set(currentSet);
    });
  }

  onRoleSelect(id: number) {
    this.selectedRoleId.set(id);
    this.roleSelect.emit(id);
  }

  isSelectedRole(id: number): boolean {
    return this.selectedRoleId() === id;
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissionsSet().has(permissionId);
  }

  togglePermission(permissionId: number, isChecked: boolean) {
    const currentSet = new Set(this.selectedPermissionsSet());
    if (isChecked) {
      currentSet.add(permissionId);
    } else {
      currentSet.delete(permissionId);
    }
    this.selectedPermissionsSet.set(currentSet);
  }

  onSave() {
    const roleId = this.selectedRoleId();
    if (roleId) {
      this.savePermissions.emit({
        roleId,
        permissionIds: Array.from(this.selectedPermissionsSet())
      });
    }
  }
}
