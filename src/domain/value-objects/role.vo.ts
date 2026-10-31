export type RoleCode = 'SECRETARIA' | 'PRESIDENTE' | 'EVALUADOR' | 'INVESTIGADOR';

/** Error controlado cuando el backend envía un código de rol desconocido. */
export class InvalidRoleError extends Error {
  constructor(readonly received: unknown) {
    super(`Rol desconocido: ${String(received)}`);
    this.name = 'InvalidRoleError';
  }
}

/**
 * Rol fijo del sistema (spec-001 HU-001, v3.5.3). Los roles no se editan desde la aplicación.
 * Solo existen 4 roles: SECRETARIA, PRESIDENTE, EVALUADOR e INVESTIGADOR.
 * ADMIN_TI fue retirado (TSK-001.1c, PR #63 del backend). PRESIDENTA no existe.
 */
export class Role {
  private static readonly ROLES: readonly Role[] = [
    new Role('SECRETARIA'),
    new Role('PRESIDENTE'),
    new Role('EVALUADOR'),
    new Role('INVESTIGADOR'),
  ];

  private constructor(readonly code: RoleCode) {}

  static fromBackend(code: unknown): Role {
    const role = Role.ROLES.find((r) => r.code === code);
    if (!role) throw new InvalidRoleError(code);
    return role;
  }

  static all(): readonly Role[] {
    return Role.ROLES;
  }
}
