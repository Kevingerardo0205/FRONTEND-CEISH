import { UserRole } from './user.entity';

export interface UserAdmin {
  id?: string;
  nombre: string;
  email: string;
  rol: UserRole;
  roles?: string[]; // Soporte para múltiples roles
  cedula?: string;
  perfil: string;
  activo: boolean;
}
