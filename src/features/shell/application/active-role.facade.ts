import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Role, RoleCode } from '@domain/value-objects/role.vo';
import { SessionRolesPort } from '../domain/session-roles.port';

const STORAGE_KEY = 'ceish.activeRole';
// Prioridad para el rol por defecto: el orden de Role.all().
const ROLE_PRIORITY: readonly RoleCode[] = Role.all().map((r) => r.code);

function isRoleCode(code: string | null): code is RoleCode {
  return code !== null && (ROLE_PRIORITY as readonly string[]).includes(code);
}

/**
 * Rol activo de la sesión (spec-ui F00 §2).
 * Por defecto: el último guardado si sigue siendo válido; si no, el de mayor prioridad
 * (SECRETARIA > PRESIDENTE > EVALUADOR > INVESTIGADOR).
 */
@Injectable({ providedIn: 'root' })
export class ActiveRoleFacade {
  private sessionRoles = toSignal(inject(SessionRolesPort).roles$, { initialValue: [] });
  private selectedRole = signal<RoleCode | null>(this.readStoredRole());

  // TODO pendiente HU-001: ADMIN_TI, PRESIDENTA y otros códigos que el VO no reconoce
  // se ignoran sin error hasta confirmar si existen como roles propios.
  readonly availableRoles = computed<RoleCode[]>(() => {
    const roles = this.sessionRoles();
    return ROLE_PRIORITY.filter((code) => roles.includes(code));
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
      return isRoleCode(stored) ? stored : null;
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
