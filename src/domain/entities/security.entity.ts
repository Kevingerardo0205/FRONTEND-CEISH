import { Module as AuthModule, Permission as AuthPermission } from './user.entity';

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
  name: string;
  description?: string;
  permissions?: SecurityPermission[];
}

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
