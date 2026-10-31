import { RoleCode } from '../value-objects/role.vo';

/** Entrada del menú lateral, configurada por rol (spec-ui F00 §4). */
export interface MenuItem {
  id: string;
  label: string;
  route: string;
  roles: RoleCode[];
  badge?: 'pendientes';
}
