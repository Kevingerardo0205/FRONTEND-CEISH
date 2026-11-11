# F10 · Menú lateral por rol activo — tareas

**Ramas:** cada tarea en su propia rama, con su PR a `dev`.

| Tarea | Rama |
|---|---|
| T10-0 | `docs/f10-menu-por-rol` |
| T10-1 | `feat/f10-t10-1-menu-config` |
| T10-2 | `feat/f10-t10-2-sidebar-por-rol` |
| T10-3 | `chore/f10-t10-3-retiro-menu-viejo` |
| T10-4 | `feat/f10-t10-4-iconos-cerrar-sesion` |
| T10-5 | Se define con T14 de F00 |
| S-1 a S-3 | Se definen en su Paso 0 |

Ciclo de cada tarea: README §6 y skill `ciclo-tarea-ceish`. Codex escribe el código con `/codex:rescue --fresh` y el brief de Claude **pasado como archivo** (no pegado en la línea de comandos); Codex no ejecuta git ni `ng test` (solo `tsc` y `npx eslint`) y no toca `specs/`, `package*.json`, `src/environments/` ni `.env*`. Claude revisa el diff con `code-review`, corre las mutaciones (se revierte editando y se comprueba con `cmp`), la verificación doble y hace un commit de código y uno de docs. Push, PR y merge los hace el dueño del repositorio.
**Línea base (10/11/2026, `dev` `663d2cd`):** `TOTAL: 978 SUCCESS`, `tsc` app y spec exit 0; `npx eslint` de los 13 archivos del menú: 0 errores y 3 avisos previos (`auth.facade.ts:14` `Permission` sin usar, `auth.facade.ts:76` aserción no nula, `sidebar.component.ts:43` `any`).
**Verificación de cada tarea, dos veces:** `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -p tsconfig.spec.json --noEmit` · `npx eslint <archivos cambiados>` (sin `--fix`; ningún archivo peor que en `dev`) · `npx ng test --watch=false --browsers=ChromeHeadless` · `npx ng build --configuration production`.

| # | Capa | Tarea | Requisitos | Archivos | Pruebas | Mutaciones | Hecho cuando… | Estado |
|---|---|---|---|---|---|---|---|---|
| T10-0 | docs | spec-ui, plan y tasks de F10; F00 v0.3; fila del README §4 | D1–D8 | CREAR `specs/F10-menu-por-rol/{spec-ui,plan,tasks}.md`; MODIFICAR `specs/F00-base/spec-ui.md` (D1, §2, §4, §10) y `specs/README.md` §4 | — | — | Un commit de docs en `docs/f10-menu-por-rol`; sin prettier sobre `specs/`; CRLF como el resto de `specs/` | Hecho (10/11/2026) |
| T10-1 | infrastructure | `MENU_ITEMS` con los 4 roles, solo rutas que existen | EARS 1, 2 (datos), 4, 5; D1–D4, D7 | MODIFICAR `src/features/shell/infrastructure/menu.config.ts` y `menu.config.spec.ts`; CREAR `src/app/menu-routes.spec.ts` | Labels exactos y en orden por rol (spec-ui §3); un solo rol por entrada; ninguna ruta es `/dashboard/home`; con router y guards reales, cada opción de PRESIDENTE, EVALUADOR e INVESTIGADOR abre su ruta sin aviso; INVESTIGADOR en `/dashboard/resolutions/calls` rebota con aviso | (M1) quitar `Nuevo protocolo`: falla la de orden; (M2) `Sesiones del pleno` a `/reportes`: falla la de navegación; (M3) `roles: ['INVESTIGADOR', 'SECRETARIA']`: falla la de un solo rol | SECRETARIA sin cambios; ningún componente cambia; verificación doble | Pendiente |
| T10-2 | presentation | Sidebar de `DashboardPage` desde `GetMenuForRoleUseCase(rol activo)` | EARS 2, 3, 6, 7; D5, D6, D8 | MODIFICAR `sidebar.component.{ts,html,scss}` (+ spec); `dashboard.page.*` solo si hace falta | Opciones del rol activo; al cambiar de rol cambia sin recargar; `aria-current` en la activa; `nav` con `aria-label`; "Cerrar sesión" gris | Se definen en su Paso 0 (por ejemplo, volver a `authFacade.menuConfig()`, quitar `aria-current`) | Presidenta: con PRESIDENTE ve 2 opciones, con EVALUADOR ve 1 | Pendiente (depende de T10-1) |
| T10-3 | — (retiro) | Retirar el menú viejo | D7 regla b | BORRAR `src/shared/constants/menu-ui.config.ts`; MODIFICAR `auth.facade.ts` (sin `menuConfig`, `SubMenuItem` ni imports del menú) y sus pruebas | Suite completa verde | — | `git grep` sin usos de `menuConfig`, `MODULE_UI_MAP`, `PERMISSION_UI_MAP`, `OUT_OF_SCOPE_MENU_PERMISSIONS` y `toSentenceCase` | Pendiente (depende de T10-2) |
| T10-4 | domain + presentation | Ícono en la configuración y "Cerrar sesión" gris en el AppShell | EARS 7; D5, D6 | MODIFICAR `menu-item.entity.ts` (`icon`), `menu.config.ts`, `app-shell.component.{ts,html,scss}` (+ spec) | Cada opción pinta el ícono de su configuración con `aria-hidden="true"`; sin `getIcon`; "Cerrar sesión" con `--c-text-2` | Se definen en su Paso 0 | Contraste ≥ 4.5:1 medido | Pendiente (depende de T10-1) |
| T10-5 | presentation + rutas | AppShell para todos los roles y retiro de `DashboardPage` | F00 D1 (se retira), T14 de F00 | `app.routes.ts`, `dashboard/routes.ts`, `dashboard.page.*`, `sidebar.*` | Se definen en su Paso 0 | Se definen en su Paso 0 | Ningún rol usa `DashboardPage` | Pendiente (riesgo alto) |

## Seguridad, después del menú (en este orden de prioridad)

Ocultar una opción del menú no es seguridad. Hallazgos del Paso 0 del 10/11/2026; cada una con su Paso 0, que confirma en el backend (solo lectura) qué roles deben entrar.

| # | Qué | Por qué | Estado |
|---|---|---|---|
| S-1 | `RoleGuard` en `/dashboard/protocols/workspace/:id/*` | Hoy solo `AuthGuard` (`protocols/routes.ts:13-57`). Con el hueco del backend en `GET /protocols/:id` (sin control de propiedad, Notas de F09) permite ver protocolos ajenos | Pendiente |
| S-2 | `AuthGuard` por rol activo y retiro del bypass `ADMIN_ALL`; `RoleGuard` en `follow-up`, `renewals` y `evaluations` | `AuthGuard` compara los permisos de todos los roles vigentes y deja pasar todo con `ADMIN_ALL` (`auth.guard.ts:29-35`; también `auth.facade.ts:262`), y el rol ADMIN ya no existe (`role.vo.ts:1`). `follow-up/routes.ts` y `renewals/routes.ts` solo tienen `AuthGuard`; `evaluations/routes.ts` solo permisos (por ejemplo, la Presidenta con EVALUADOR activo abre `consolidation/:id` con un permiso de PRESIDENTE) | Pendiente |
| S-3 | Quitar los números inventados del inicio | `dashboard-home.page.ts:737-775` muestra valores fijos ("Por Firmar" 3, "Mis Evaluaciones" 5, …) como si fueran datos | Pendiente |

## Notas

- **Paso 0 (10/11/2026):** dos menús conviven. SECRETARIA: AppShell con `MENU_ITEMS` por rol activo (`app.routes.ts:104-119`, `app-shell.component.ts:64-67`). Los otros roles: `DashboardPage` con `AuthFacade.menuConfig()`, que une los permisos de todos los roles vigentes (backend `auth.service.ts:191-266`, sin `ORDER BY`). El menú de la captura de la usuaria ("Panel Principal / Dashboard notif / Evaluaciones Éticas / Recepción de Protocolos / Seguimiento") corresponde a los permisos de INVESTIGADOR (`1880000000000-FixedRolesMatrix.ts:156-163` del backend).
- `AuthFacade.getActiveRoles()` (`auth.facade.ts:224-234`) devuelve **todos** los roles vigentes, no el rol activo; `VerificadoGuard` también mira todos (`verificado.guard.ts:25-27`). Revisar el nombre en S-2.
- Restos del rol ADMIN: `case 'ADMIN'` en `dashboard-home.page.ts:629` y `'ADMIN_TI'` en la lista de respaldo de `dashboard.page.ts:103`. Se retiran con `DashboardPage` (T10-5) o en S-2.
