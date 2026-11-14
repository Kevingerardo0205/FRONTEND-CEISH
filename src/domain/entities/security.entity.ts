import { Module as AuthModule } from './user.entity';

export interface SecurityModule extends AuthModule {
  id: number;
  isActive: boolean;
  deletedAt?: Date | null;
}

export interface SecurityPermission {
  id: number;
  code: string;
  name: string;
  moduleId: number;
  module?: SecurityModule;
  deletedAt?: Date | null;
}

export interface SecurityRole {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  permissions?: SecurityPermission[];
  compliance?: RoleComplianceStatus;
}

export type RoleComplianceType = 'STANDARD' | 'CUSTOM';

export interface RoleComplianceStatus {
  roleId: number;
  roleCode: string;
  status: RoleComplianceType;
  isCompliant: boolean;
  missingPermissions: string[];
  extraPermissions: string[];
  currentPermissionCount: number;
  expectedPermissionCount: number;
}

export type RolePresetsMap = Record<string, string[]>;

export interface CreateModuleDTO {
  code: string;
  name: string;
  icon: string;
  order: number;
  isActive?: boolean;
}

export interface CreatePermissionDTO {
  code: string;
  name: string;
  moduleId: number;
}

export interface UpdateRolePermissionsDTO {
  permissionIds: number[];
}

export interface CreateRoleDTO {
  code: string;
  name: string;
  description: string;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface PermissionDiff {
  added: number[];
  removed: number[];
  total: number;
}
