// src/app/features/auth/domain/entities/user.entity.ts
export type UserRole = 'ADMIN' | 'SECRETARIA' | 'EVALUADOR' | 'INVESTIGADOR' | 'PRESIDENTA';

export interface User {
  id?: string;
  nombre: string;
  email: string;
  rol: UserRole;
  perfil: string;
  activo: boolean;
  fechaCreacion?: Date;
  ultimoAcceso?: Date;
}

export interface UserDTO {
  nombre: string;
  email: string;
  rol: UserRole;
  perfil: string;
}
