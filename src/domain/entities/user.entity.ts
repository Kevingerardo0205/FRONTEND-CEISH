export type UserRole = 'ADMIN' | 'SECRETARIA' | 'EVALUADOR' | 'INVESTIGADOR' | 'PRESIDENTA';

export interface User {
  id?: string;
  nombre: string;
  email: string;
  rol: string; // Changed to string for flexibility from backend
  perfil?: string;
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

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
