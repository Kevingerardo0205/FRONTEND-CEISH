import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { Role, RoleCode } from '@domain/value-objects/role.vo';

const STORAGE_KEY = 'ceish.activeRole';
const ROLE_CODES: readonly string[] = Role.all().map((r) => r.code);

/**
 * Rol activo de la sesión (spec-ui F00 §2). Solo considera los roles fijos del VO;
 * los demás códigos del backend (ADMIN_TI, PRESIDENTA…) se ignoran hasta confirmarlos.
 */
@Injectable({ providedIn: 'root' })
export class ActiveRoleFacade {
  private authFacade = inject(AuthFacade);
  private selectedRole = signal<RoleCode | null>(this.readStoredRole());

  readonly availableRoles = computed<RoleCode[]>(() => {
    this.authFacade.currentUser();
    return this.authFacade
      .getActiveRoles()
      .filter((code): code is RoleCode => ROLE_CODES.includes(code));
  });

  readonly activeRole = computed<RoleCode | null>(() => {
    const available = this.availableRoles();
    const selected = this.selectedRole();
    if (selected && available.includes(selected)) return selected;
    return available[0] ?? null;
  });

  /** Cambia el rol activo. Devuelve false si el usuario no tiene ese rol. */
  switchRole(role: RoleCode): boolean {
    if (!this.availableRoles().includes(role)) return false;
    this.selectedRole.set(role);
    this.storeRole(role);
    // TODO T13: navegar al inicio del rol elegido.
    return true;
  }

  private readStoredRole(): RoleCode | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && ROLE_CODES.includes(stored) ? (stored as RoleCode) : null;
    } catch {
      return null;
    }
  }

  private storeRole(role: RoleCode): void {
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Sin almacenamiento disponible: el rol activo sigue vigente en memoria.
    }
  }
}
