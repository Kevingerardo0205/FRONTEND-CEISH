export type UserRole = 'ADMIN' | 'SECRETARIA' | 'EVALUADOR' | 'INVESTIGADOR' | 'PRESIDENTE' | 'PRESIDENTA' | 'ADMIN_TI';

export interface Module {
  code: string;
  name: string;
  icon: string;
  order: number;
}

export interface Permission {
  code: string;
  module: Module;
}

export interface User {
  id?: string;
  nombre: string;
  email: string;
  rol: string; 
  perfil?: string;
  activo: boolean;
  emailVerificado: boolean;
  permissions?: string[]; // Códigos planos para compatibilidad con Guards/Directivas
  fullPermissions?: Permission[]; // Objetos completos para el Menú Dinámico
  fechaCreacion?: Date;
  ultimoAcceso?: Date;
}

export interface UserDTO {
  nombre: string;
  email: string;
  rol: UserRole;
  perfil: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  permissions?: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}
