import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { 
  SecurityModule, 
  SecurityPermission, 
  SecurityRole, 
  CreateRoleDTO, 
  UpdateRoleDTO,
  PermissionDiff,
  RoleComplianceStatus,
  RolePresetsMap
} from '@domain/entities/security.entity';
import { 
  GetSecurityCatalogUseCase, 
  GetRolePermissionsUseCase, 
  UpdateRolePermissionsUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetRolePresetsUseCase,
  GetRoleComplianceUseCase,
  ResetRolePresetUseCase,
  SecurityCatalog
} from './security.use-cases';

export interface ModulePermissionGroup {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  moduleIcon: string;
  permissions: SecurityPermission[];
}

export type ModuleCheckState = 'checked' | 'indeterminate' | 'unchecked';

@Injectable({
  providedIn: 'root'
})
export class RolePermissionsState {
  private readonly getCatalogUseCase = inject(GetSecurityCatalogUseCase);
  private readonly getRolePermissionsUseCase = inject(GetRolePermissionsUseCase);
  private readonly updateRolePermissionsUseCase = inject(UpdateRolePermissionsUseCase);
  private readonly createRoleUseCase = inject(CreateRoleUseCase);
  private readonly updateRoleUseCase = inject(UpdateRoleUseCase);
  private readonly deleteRoleUseCase = inject(DeleteRoleUseCase);
  private readonly getRolePresetsUseCase = inject(GetRolePresetsUseCase);
  private readonly getRoleComplianceUseCase = inject(GetRoleComplianceUseCase);
  private readonly resetRolePresetUseCase = inject(ResetRolePresetUseCase);

  // --- Primary Signals ---
  readonly roles = signal<SecurityRole[]>([]);
  readonly modules = signal<SecurityModule[]>([]);
  readonly permissions = signal<SecurityPermission[]>([]);
  
  readonly selectedRoleId = signal<number | null>(null);
  readonly initialPermissionsSet = signal<Set<number>>(new Set());
  readonly currentPermissionsSet = signal<Set<number>>(new Set());
  
  readonly complianceMap = signal<Map<number, RoleComplianceStatus>>(new Map());
  readonly presets = signal<RolePresetsMap>({});

  readonly searchQuery = signal<string>('');
  readonly loadingCatalog = signal<boolean>(false);
  readonly loadingPermissions = signal<boolean>(false);
  readonly loadingCompliance = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly resettingPreset = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // --- Computed Signals ---
  readonly selectedRole = computed<SecurityRole | null>(() => {
    const id = this.selectedRoleId();
    if (!id) return null;
    return this.roles().find(r => r.id === id) ?? null;
  });

  readonly selectedRoleCompliance = computed<RoleComplianceStatus | null>(() => {
    const id = this.selectedRoleId();
    if (!id) return null;
    return this.complianceMap().get(id) ?? null;
  });

  readonly isDirty = computed<boolean>(() => {
    const initial = this.initialPermissionsSet();
    const current = this.currentPermissionsSet();
    if (initial.size !== current.size) return true;
    for (const id of current) {
      if (!initial.has(id)) return true;
    }
    return false;
  });

  readonly diffSummary = computed<PermissionDiff>(() => {
    const initial = this.initialPermissionsSet();
    const current = this.currentPermissionsSet();
    const added: number[] = [];
    const removed: number[] = [];

    for (const id of current) {
      if (!initial.has(id)) added.push(id);
    }
    for (const id of initial) {
      if (!current.has(id)) removed.push(id);
    }

    return {
      added,
      removed,
      total: added.length + removed.length
    };
  });

  readonly activePermsCount = computed<number>(() => this.currentPermissionsSet().size);

  readonly permissionsByModule = computed<ModulePermissionGroup[]>(() => {
    const allPerms = this.permissions();
    const allMods = this.modules();
    const query = this.searchQuery().trim().toLowerCase();

    const groupsMap = new Map<number, ModulePermissionGroup>();

    // Inicializar módulos base
    allMods.forEach(mod => {
      groupsMap.set(mod.id, {
        moduleId: mod.id,
        moduleCode: mod.code,
        moduleName: mod.name,
        moduleIcon: mod.icon || 'folder',
        permissions: []
      });
    });

    // Agrupar permisos
    allPerms.forEach(perm => {
      // Filtrado por búsqueda en nombre o código del permiso
      if (query) {
        const matchesPerm = 
          perm.name.toLowerCase().includes(query) || 
          perm.code.toLowerCase().includes(query) ||
          (perm.module?.name.toLowerCase().includes(query) ?? false);
        if (!matchesPerm) return;
      }

      const modId = perm.moduleId || perm.module?.id;
      if (modId && groupsMap.has(modId)) {
        groupsMap.get(modId)!.permissions.push(perm);
      } else if (perm.module) {
        if (!groupsMap.has(perm.module.id)) {
          groupsMap.set(perm.module.id, {
            moduleId: perm.module.id,
            moduleCode: perm.module.code,
            moduleName: perm.module.name,
            moduleIcon: perm.module.icon || 'folder',
            permissions: []
          });
        }
        groupsMap.get(perm.module.id)!.permissions.push(perm);
      } else {
        if (!groupsMap.has(0)) {
          groupsMap.set(0, {
            moduleId: 0,
            moduleCode: 'GLOBAL',
            moduleName: 'Globales y Generales',
            moduleIcon: 'public',
            permissions: []
          });
        }
        groupsMap.get(0)!.permissions.push(perm);
      }
    });

    // Retornar solo módulos con permisos coincidentes
    return Array.from(groupsMap.values()).filter(g => g.permissions.length > 0);
  });

  // --- Methods ---

  loadCatalog(): Observable<SecurityCatalog> {
    this.loadingCatalog.set(true);
    this.error.set(null);

    return this.getCatalogUseCase.execute().pipe(
      tap({
        next: (data) => {
          this.roles.set(data.roles);
          this.modules.set(data.modules);
          this.permissions.set(data.allPermissions);
          this.loadingCatalog.set(false);

          // Cargar cumplimiento para todos los roles
          this.loadAllRolesCompliance(data.roles);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error cargando catálogo:', err);
          this.error.set('No se pudo cargar la información base de seguridad.');
          this.loadingCatalog.set(false);
        }
      })
    );
  }

  loadPresets(): Observable<RolePresetsMap> {
    return this.getRolePresetsUseCase.execute().pipe(
      tap({
        next: (presetMap) => this.presets.set(presetMap),
        error: (err) => console.warn('[RolePermissionsState] No se pudieron cargar los presets:', err)
      })
    );
  }

  loadRoleCompliance(roleId: number): Observable<RoleComplianceStatus> {
    this.loadingCompliance.set(true);
    return this.getRoleComplianceUseCase.execute(roleId).pipe(
      tap({
        next: (status) => {
          const mapCopy = new Map(this.complianceMap());
          mapCopy.set(roleId, status);
          this.complianceMap.set(mapCopy);
          this.loadingCompliance.set(false);
        },
        error: (err) => {
          console.warn(`[RolePermissionsState] Error cargando compliance para rol ${roleId}:`, err);
          this.loadingCompliance.set(false);
        }
      })
    );
  }

  loadAllRolesCompliance(rolesList?: SecurityRole[]): void {
    const list = rolesList || this.roles();
    list.forEach(r => {
      this.getRoleComplianceUseCase.execute(r.id).subscribe({
        next: (status) => {
          const mapCopy = new Map(this.complianceMap());
          mapCopy.set(r.id, status);
          this.complianceMap.set(mapCopy);
        },
        error: () => {
          // Fallback silencioso si no aplica
        }
      });
    });
  }

  selectRole(roleId: number): Observable<SecurityPermission[]> {
    this.selectedRoleId.set(roleId);
    this.loadingPermissions.set(true);

    // Cargar cumplimiento del rol seleccionado
    this.loadRoleCompliance(roleId).subscribe();

    return this.getRolePermissionsUseCase.execute(roleId).pipe(
      tap({
        next: (perms) => {
          const permSet = new Set<number>(perms.map(p => p.id));
          this.initialPermissionsSet.set(new Set(permSet));
          this.currentPermissionsSet.set(new Set(permSet));

          // Sincronizar permisos en la entidad del rol en memoria
          this.roles.update(currentRoles => 
            currentRoles.map(r => r.id === roleId ? { ...r, permissions: perms } : r)
          );

          this.loadingPermissions.set(false);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error cargando permisos del rol:', err);
          this.loadingPermissions.set(false);
        }
      })
    );
  }

  togglePermission(permissionId: number, isChecked: boolean): void {
    const updated = new Set(this.currentPermissionsSet());
    if (isChecked) {
      updated.add(permissionId);
    } else {
      updated.delete(permissionId);
    }
    this.currentPermissionsSet.set(updated);
  }

  getModuleCheckState(permissions: SecurityPermission[]): ModuleCheckState {
    if (permissions.length === 0) return 'unchecked';
    const current = this.currentPermissionsSet();
    const selectedInGroup = permissions.filter(p => current.has(p.id)).length;

    if (selectedInGroup === permissions.length) return 'checked';
    if (selectedInGroup > 0) return 'indeterminate';
    return 'unchecked';
  }

  toggleModulePermissions(permissions: SecurityPermission[], isChecked: boolean): void {
    const updated = new Set(this.currentPermissionsSet());
    permissions.forEach(p => {
      if (isChecked) {
        updated.add(p.id);
      } else {
        updated.delete(p.id);
      }
    });
    this.currentPermissionsSet.set(updated);
  }

  toggleAllPermissions(selectAll: boolean): void {
    const updated = new Set(this.currentPermissionsSet());
    this.permissions().forEach(p => {
      if (selectAll) {
        updated.add(p.id);
      } else {
        updated.delete(p.id);
      }
    });
    this.currentPermissionsSet.set(updated);
  }

  resetChanges(): void {
    this.currentPermissionsSet.set(new Set(this.initialPermissionsSet()));
  }

  savePermissions(): Observable<void> {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      throw new Error('No hay ningún rol seleccionado');
    }

    const permissionIds = Array.from(this.currentPermissionsSet());
    this.saving.set(true);

    return this.updateRolePermissionsUseCase.execute(roleId, permissionIds).pipe(
      tap({
        next: () => {
          // Actualizar snapshot de inicio
          this.initialPermissionsSet.set(new Set(this.currentPermissionsSet()));
          
          // Actualizar conteo en la entidad del rol en memoria
          const currentPermissionsList = this.permissions().filter(p => this.currentPermissionsSet().has(p.id));
          this.roles.update(currentRoles =>
            currentRoles.map(r => r.id === roleId ? { ...r, permissions: currentPermissionsList } : r)
          );

          // Refrescar estado de compliance tras modificar permisos
          this.loadRoleCompliance(roleId).subscribe();

          this.saving.set(false);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error guardando permisos:', err);
          this.saving.set(false);
        }
      })
    );
  }

  resetCurrentRoleToPreset(): Observable<SecurityRole> {
    const roleId = this.selectedRoleId();
    if (!roleId) {
      throw new Error('No hay ningún rol seleccionado para restablecer');
    }

    this.resettingPreset.set(true);

    return this.resetRolePresetUseCase.execute(roleId).pipe(
      tap({
        next: (restoredRole) => {
          const perms = restoredRole.permissions || [];
          const permSet = new Set<number>(perms.map(p => p.id));
          
          this.initialPermissionsSet.set(new Set(permSet));
          this.currentPermissionsSet.set(new Set(permSet));

          // Actualizar rol en memoria
          this.roles.update(current =>
            current.map(r => r.id === roleId ? { ...r, permissions: perms } : r)
          );

          // Marcar cumplimiento como STANDARD
          const mapCopy = new Map(this.complianceMap());
          mapCopy.set(roleId, {
            roleId,
            roleCode: restoredRole.code,
            status: 'STANDARD',
            isCompliant: true,
            missingPermissions: [],
            extraPermissions: [],
            currentPermissionCount: perms.length,
            expectedPermissionCount: perms.length
          });
          this.complianceMap.set(mapCopy);

          this.resettingPreset.set(false);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error restableciendo rol a plantilla:', err);
          this.resettingPreset.set(false);
        }
      })
    );
  }

  createRole(data: CreateRoleDTO): Observable<SecurityRole> {
    this.saving.set(true);
    return this.createRoleUseCase.execute(data).pipe(
      tap({
        next: (newRole) => {
          this.roles.update(current => [...current, { ...newRole, permissions: [] }]);
          this.saving.set(false);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error creando rol:', err);
          this.saving.set(false);
        }
      })
    );
  }

  updateRole(id: number, data: UpdateRoleDTO): Observable<SecurityRole> {
    this.saving.set(true);
    return this.updateRoleUseCase.execute(id, data).pipe(
      tap({
        next: (updatedRole) => {
          this.roles.update(current =>
            current.map(r => r.id === id ? { ...r, ...updatedRole } : r)
          );
          this.saving.set(false);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error actualizando rol:', err);
          this.saving.set(false);
        }
      })
    );
  }

  deleteRole(id: number): Observable<void> {
    this.saving.set(true);
    return this.deleteRoleUseCase.execute(id).pipe(
      tap({
        next: () => {
          this.roles.update(current => current.filter(r => r.id !== id));
          if (this.selectedRoleId() === id) {
            this.selectedRoleId.set(null);
            this.initialPermissionsSet.set(new Set());
            this.currentPermissionsSet.set(new Set());
          }
          this.saving.set(false);
        },
        error: (err: unknown) => {
          console.error('[RolePermissionsState] Error eliminando rol:', err);
          this.saving.set(false);
        }
      })
    );
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }
}
