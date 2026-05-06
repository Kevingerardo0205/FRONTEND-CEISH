export type UserRole = 'ADMIN' | 'SECRETARIA' | 'EVALUADOR' | 'INVESTIGADOR' | 'PRESIDENTE' | 'PRESIDENTA' | 'ADMIN_TI';

export interface User {
  id?: string;
  nombre: string;
  email: string;
  rol: string; 
  perfil?: string;
  activo: boolean;
  emailVerificado: boolean;
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
}

export interface LoginCredentials {
  email: string;
  password: string;
}
