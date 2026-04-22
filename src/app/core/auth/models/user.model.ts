export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
