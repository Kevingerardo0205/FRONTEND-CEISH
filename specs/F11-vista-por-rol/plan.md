# F11 · Qué ve cada rol de un protocolo — plan

**Versión:** 0.1 · **Fecha:** 20/11/2026 · Spec: `spec-ui.md` v0.1.

## EP2 · La PRESIDENTE ve Recepción en solo lectura

**domain** (`src/features/protocols/domain/workspace-tab-roles.ts`)
- `WORKSPACE_TAB_ROLES.validation`: SECRETARIA, PRESIDENTE e INVESTIGADOR. El `RoleGuard` de `protocols/routes.ts` y las pestañas del espacio (`protocol-workspace.component.ts`) ya leen esa fila; no cambian.
- Se reutiliza `WORKSPACE_ACTION_ROLES.VALIDATE_ALL` (SECRETARIA) para decidir quién valida, sin una tabla nueva.

**application / infrastructure:** sin cambios. Los casos de uso y los adaptadores son los mismos.

**presentation** (`protocol-validation-detail.page.ts`, sin duplicar la pantalla)
- `canValidate`: rol activo en `VALIDATE_ALL`. Las ramas de la Secretaría pasan de `!isInvestigador()` a `canValidate()`; las de lectura que hoy son del investigador pasan a `!canValidate()` (páginas, chip de estado, observación de cada requisito, observaciones de la Secretaría).
- `isReadOnlyMode`: verdadero también sin las vistas de validar ni de subsanar.
- Constancia, «Finalizar» y aviso legal: solo con `canValidate()` (la constancia del investigador sigue como hoy).
- `onValidateItem`, `onChangePageCount` y `onFinalize` salen de inmediato sin `canValidate()`.
- Cuadro de observaciones generales: `[disabled]="isFinalized()"` (V9).
- Sin `.scss` nuevo, sin colores nuevos.

**Pruebas**
- `protocol-validation-detail.page.spec.ts`: PRESIDENTE en revisión y con el protocolo validado (sin controles, con la lectura, abre el documento, los métodos no llaman al backend); SECRETARIA con el protocolo validado (cuadro deshabilitado).
- `src/app/workspace-routes.spec.ts`, `src/features/route-roles.spec.ts` y `protocol-workspace.component.spec.ts`: la fila nueva de `validation`.

**Se retira:** nada.
