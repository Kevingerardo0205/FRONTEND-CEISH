import { RoleCode } from '../value-objects/role.vo';

/** Entrada del menú lateral, configurada por rol (spec-ui F00 §4). */
export interface MenuItem {
  id: string;
  label: string;
  route: string;
  roles: RoleCode[];
  /** Nombre del ícono de Material Icons; es decorativo (`aria-hidden="true"`, F10 D5). */
  icon: string;
  badge?: 'pendientes';
}
