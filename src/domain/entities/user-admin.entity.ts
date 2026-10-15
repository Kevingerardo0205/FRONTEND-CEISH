import { UserRole } from './user.entity';

export interface UserRoleItem {
  id?: number;
  code: string;
  name?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  reason?: string | null;
  isExpired?: boolean;
}

export interface RoleAssignmentPayloadItem {
  roleCode: string;
  validFrom?: string | null;
  validUntil?: string | null;
  reason?: string | null;
}

export interface UserAdmin {
  id?: string;
  nombre: string;
  email: string;
  rol: UserRole;
  userRoles?: UserRoleItem[]; // Fuente única de verdad para roles con vigencia temporal (opcional para mocks)
  roles?: string[]; // Opción auxiliar para compatibilidad
  cedula?: string;
  perfil: string;
  activo: boolean;
}
