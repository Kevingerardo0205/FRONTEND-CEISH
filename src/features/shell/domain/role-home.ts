import { RoleCode } from '@domain/value-objects/role.vo';

/**
 * Ruta de inicio de cada rol (spec-ui F00 §2, decisión D3 del 31/10/2026).
 * SECRETARIA entra al AppShell; los otros roles siguen con DashboardPage (D1).
 * Único lugar donde se define: F01 y las demás secciones lo cambian aquí.
 */
export const ROLE_HOME: Readonly<Record<RoleCode, string>> = {
  SECRETARIA: '/pendientes',
  PRESIDENTE: '/dashboard/home',
  EVALUADOR: '/dashboard/home',
  INVESTIGADOR: '/dashboard/home',
};
