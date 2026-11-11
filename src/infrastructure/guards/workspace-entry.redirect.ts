import { inject } from '@angular/core';
import { RedirectFunction, Router } from '@angular/router';
import { firstWorkspaceTab } from '@features/protocols/domain/workspace-tab-roles';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { MENU_ITEMS } from '@features/shell/infrastructure/menu.config';
import { RoleHome } from './role-home.guard';

/** Opción "Mis evaluaciones" de `MENU_ITEMS`: destino de EVALUADOR, que no tiene pestañas en el espacio (F10 D11). */
export const EVALUATOR_MENU_ITEM_ID = 'evaluador-evaluaciones';

/**
 * Ruta sin pestaña `workspace/:id` (F10 D11, S-1c): la primera pestaña que abre el rol activo.
 * EVALUADOR, sin ninguna, va a "Mis evaluaciones" del menú, sin el aviso de "No tiene acceso"
 * (no a `ROLE_HOME`, que para EVALUADOR es `/dashboard/home`). Sin rol activo: `RoleHome`.
 */
export const redirectToFirstWorkspaceTab: RedirectFunction = () => {
  const role = inject(ActiveRoleFacade).activeRole();
  const tab = firstWorkspaceTab(role);
  if (tab) return tab;

  const evaluatorItem = MENU_ITEMS.find((item) => item.id === EVALUATOR_MENU_ITEM_ID);
  if (role && evaluatorItem?.roles.includes(role)) {
    return inject(Router).parseUrl(evaluatorItem.route);
  }
  return inject(RoleHome).urlTree();
};
