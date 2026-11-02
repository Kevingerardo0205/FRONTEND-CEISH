# F00 · Base del rediseño — tareas

Rama: `feat/f00-base` (desde `dev`, después del merge de `chore/format-prettier`).
Cada tarea: un commit pequeño, `npm test` en verde, `npm run lint` sin advertencias nuevas.

| # | Capa | Tarea | Archivos | Terminado cuando… | Estado |
|---|---|---|---|---|---|
| T01 | — | Confirmar estructura con el inventario. La sección es features/shell (ya decidido) | specs/F00-base/plan.md | El plan apunta a carpetas que existen | Hecho (9dd63ca) |
| T01b | — | Quitar del menú y de las rutas lo que queda fuera de alcance (security, amendments, radar de plazos), sin borrar el código todavía | features/dashboard/routes.ts, features/investigador/investigador.routes.ts, shared/constants/menu-ui.config.ts, features/auth/facades/auth.facade.ts, dashboard-secretaria.page.* | Esas rutas no aparecen y redirigen al inicio | Hecho (c9d537f) |
| T02 | shared | Tokens de diseño como variables CSS | src/styles/_tokens.scss, styles.scss | Colores y radios salen de variables; nada nuevo con hex sueltos | Hecho (395d84e) |
| T03 | domain | Stage VO (6 etapas) + pruebas | src/domain/value-objects/stage.vo.ts + spec | 100 % de cobertura; un código inválido da error controlado | Hecho (1a567e9) |
| T04 | domain | Role VO (4 roles fijos) y MenuItem | src/domain/value-objects/role.vo.ts, src/domain/entities/menu-item.entity.ts + spec | 100 % de cobertura | Hecho (b0f2570) |
| T05 | infra + app | menu.config.ts (Secretaría, 5 entradas) + GetMenuForRoleUseCase | src/domain/ports/menu-config.port.ts, features/shell/{application,infrastructure}/* + spec | La prueba confirma 5 entradas en orden para SECRETARIA | Hecho (00c957b) |
| T06 | app | ActiveRoleFacade (rol activo, cambio de rol, localStorage seguro) | features/shell/application/* + spec | Cubre varios roles y un localStorage que falla | Hecho (9355ba7) |
| T06b | domain + app + infra | ActiveRoleFacade depende de SessionRolesPort (clase abstracta en domain, para no importar @angular); el adapter AuthSessionRolesAdapter vive en infrastructure | features/shell/domain/session-roles.port.ts, features/shell/application/active-role.facade.ts, features/shell/infrastructure/auth-session-roles.adapter.ts + specs | ActiveRoleFacade no importa AuthFacade; rol por defecto según plan §2 | Hecho (3c3544d) |
| T07 | infra | roleGuard con rol activo (adaptar role.guard actual) | src/infrastructure/guards/role.guard.ts + spec | Redirige al inicio y avisa; las pruebas antiguas siguen en verde | Hecho (2afc6ff; prueba (g) en 8c5ad4f; pendiente de PR de F00b junto con T13a–T13d) |
| T08 | presentation | StageBar | src/shared/ui/stage-bar/* + spec | Criterio 2 de spec-ui | Hecho (c07697d) |
| T09 | presentation | PageHeader, ButtonGroup, Tabs, FilterBar | src/shared/ui/* + specs | Una acción principal; filtros recordados por vista | Hecho (4509807) |
| T10 | presentation | DataTable, StatusChip, estados vacío/cargando/error | src/shared/ui/* + specs | Criterio 6 de spec-ui | Hecho (c1ab158) |
| T11 | presentation | UndoToast (servicio + componente), Dialog, InlinePanel | src/shared/ui/*, infrastructure/services/notification.service.ts + specs | Criterio 5; foco atrapado y Esc en Dialog | Hecho (a88fb24) |
| T12 | infra | Port PendingCountPort + adapter mock (+ HTTP marcado FALTA) | features/shell/infrastructure/* + spec | El contador del menú sale del mock | Hecho (1df1f71) |
| T13a | infra + rutas | Códigos de rol en las rutas según la matriz fija (D2, D4, D5, D6) y `verificado.guard` con los 3 roles del comité | features/{ai-assistant-admin,audit,notifications,reports,resolutions,investigador,protocols,evaluations}/routes.ts, features/dashboard/routes.ts, src/infrastructure/guards/verificado.guard.ts + specs | Ningún `data.roles` usa códigos fuera de `Role.all()`; la tabla ruta→roles de D2/D4/D5 y las pruebas de `verificado.guard` están en verde | Hecho (bfd2dfc; 590 pruebas; mutaciones M1–M5 detectadas) |
| T13b | presentation | Providers de shell (`MenuConfigPort` y `SHELL_PROVIDERS`, hoy sin registrar) + AppShell de la Secretaría con menú lateral de 5 entradas y barra superior | features/shell/shell.providers.ts, src/app/app.config.ts, features/shell/presentation/app-shell/* + spec | Criterio 1 de spec-ui | Hecho (d87b76b; 614 pruebas; mutaciones M1–M6 detectadas; MenuConfigPort registrado en app.config.ts y shell.providers.ts) |
| T13c | presentation | Selector de rol con navegación al inicio de cada rol | features/shell/presentation/app-shell/* (selector) + spec | Criterios 3 y 8 de spec-ui | Pendiente |
| T13d | presentation + app | Rutas nuevas bajo el AppShell (`/pendientes`, `/protocolos`, `/convocatorias`, `/reportes`, `/configuracion`) con lazy loading, redirects desde `/dashboard/...` donde haya equivalente y `RoleGuard` que redirige al inicio del rol activo | src/app/app.routes.ts, features/shell/presentation/app-shell/* + spec | Criterio 4 de spec-ui | Pendiente |
| T14 | — | Retirar solo lo que quede sin uso tras F00b (DashboardPage, sidebar, menu-ui.config.ts, permissions.directive.ts y dashboard-routing.module.ts, con sus pruebas, cuando ningún rol los use) | — | No quedan imports de código retirado; build y pruebas en verde. `DashboardPage`, el `sidebar` y `menu-ui.config.ts` siguen vivos para PRESIDENTE, EVALUADOR e INVESTIGADOR | Pendiente |
| T14b | docs | Regla de uso de StatusChip con ProtocolUI (no había duplicado) | specs/F00-base/plan.md (§8, §9, §10) | Regla escrita en plan §9; ningún mapeo estado→texto ni estado→tono fuera de ProtocolUI | Hecho (6bae87e) |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin @angular), con la única excepción de plan §2 | eslint no-restricted-imports o spec | Romper la regla hace fallar el lint o la prueba | Hecho (1eb90e8) |
| T16 | — | Revisión final: build prod, pruebas, lint, visto bueno contra el canvas | — | Capturas del AppShell y StageBar comparadas con el diseño | Pendiente |

## Calidad

- En `cf5ef01` (ajustes de revisión T01b–T03): el script `lint` quedó con `--max-warnings 76`, se ocultó el botón "Solicitar Enmienda" de `detalle-protocolo.page.ts` y se agregó la fuente Outfit en `index.html`.
- Línea base actual: **614 pruebas** (T13b: +24; 16 en AppShellComponent, 6 en get-pending-count.use-case, 2 en shell.providers). Antes de T13b eran 590 (y antes de T13a eran 584).

### Auditoría de mutaciones (28/10/2026)

- 15 mutaciones a mano (M1–M15) sobre T03–T12.
- 14 detectadas en la primera corrida.
- M9 era una prueba vacía (cargando sin filas), corregida en `3c81c54`.
- M6 se aplicó con una variante que compila (el rol guardado nunca se usa).

### Auditoría de mutaciones T07 (31/10/2026) — role.guard.ts · 584 pruebas totales

M1–M7 se midieron con 8 pruebas en `role.guard.spec.ts`, antes de agregar (g); M8 y M9, con 9.

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| M1 variante equivalente del código anterior | `user.roles.some(...)` en lugar de `hasAnyRole(requiredRoles)`, que además quitaba los roles vencidos | (c) concede acceso cuando el rol activo está en los roles requeridos; (d) depende del rol activo, no de todos los roles del usuario; (f) acepta cadena | 3 failed, 5 passed |
| M2 saltarse comprobación de usuario | Eliminar `if (!user) return …` | (b) redirige a /auth/login si no hay sesión activa | 1 failed, 7 passed |
| M3 devolver `true` siempre | Eliminar lógica de activeRole + notify + redirect | (d), (e), notifica exactamente una vez | 3 failed, 5 passed |
| M4 no notificar al denegar | Quitar `notificationService.notify(…)` | (d), (e), notifica exactamente una vez | 3 failed, 5 passed |
| M5 redirigir a `/auth/login` en vez de `/dashboard` | `createUrlTree(['/auth/login'])` en el deny | (d), (e) createUrlTree(['/dashboard']) | 2 failed, 6 passed |
| M6 no normalizar `data.roles` como arreglo | `rawRoles as string[]` sin `Array.isArray` | no detectable: `String.prototype.includes` coincide exactamente igual que `Array.prototype.includes` para cadenas completas | 0 failed, 8 passed |
| M7 quitar provider `SessionRolesPort` de `app.config.ts` | `{ provide: SessionRolesPort, useClass: AuthSessionRolesAdapter }` eliminado | SessionRolesPort está provisto en appConfig: ActiveRoleFacade se inyecta sin NullInjectorError | 1 failed, 7 passed |
| M8 leer `activeRole()` una sola vez | Se guarda en un campo en el constructor y `canActivate` usa ese campo | (c) concede acceso cuando el rol activo está en los roles requeridos; (f) acepta data.roles como cadena simple además de arreglo; (g) si el rol activo cambia entre dos llamadas, la segunda decide con el rol nuevo | 3 failed, 6 passed |
| M9 dejar pasar sin rol activo | `if (!active) return true` antes de la comparación | (e) deniega si activeRole() devuelve null (usuario sin rol vigente reconocido) | 1 failed, 8 passed |

### Auditoría de mutaciones T13a (31/10/2026) — rutas + verificado.guard.ts · 590 pruebas totales

Las mutaciones de rutas se midieron con `route-roles.spec.ts` (4 pruebas); la de `verificado.guard` con `verificado.guard.spec.ts` (7 pruebas). Todas se revirtieron editando el archivo.

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| M1 volver a poner ADMIN_TI en reports | `roles: ['SECRETARIA', 'PRESIDENTE', 'ADMIN_TI']` en `reports/stats` | no usa códigos de rol fuera de Role.all(); mantiene la tabla ruta → roles de las decisiones D2, D4 y D5 | 2 failed, 2 passed |
| M2 devolver ADMIN_ALL al padre de audit | `data: { permissions: ['ADMIN_ALL'] }` en `dashboard/audit`, sin `data.roles` | mantiene la tabla ruta → roles de las decisiones D2, D4 y D5 | 1 failed, 3 passed |
| M3 quitar SECRETARIA de notifications/templates | `roles: ['PRESIDENTE']` | mantiene la tabla ruta → roles de las decisiones D2, D4 y D5 | 1 failed, 3 passed |
| M4 agregar PRESIDENTA a una ruta de investigador | `roles: ['INVESTIGADOR', 'SECRETARIA', 'PRESIDENTA']` en `investigador/nuevo-protocolo` | no usa códigos de rol fuera de Role.all(); mantiene la tabla ruta → roles de las decisiones D2, D4 y D5 | 2 failed, 2 passed |
| M5 quitar un rol del comité de los exentos de verificado.guard | lista `['SECRETARIA', 'PRESIDENTE']`, sin `EVALUADOR` | debe consultar los 3 roles del comité exentos de verificación; debe bloquear y notificar a un investigador no verificado (no exento) | 2 failed, 5 passed |

### Auditoría de mutaciones T13b (02/11/2026) — AppShellComponent + shell providers · 614 pruebas totales

Las 6 mutaciones (M1–M6) se probaron con `npx ng test --watch=false --browsers=ChromeHeadless` y se revirtieron editando el archivo, verificando `git diff --stat` tras cada reversión.

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| M1 invertir el orden de los elementos del menú | `.map((item) => ...).reverse()` en `menuItems` computado | AppShellComponent Menú lateral (Sidebar) debe renderizar exactamente 5 enlaces de navegación en el orden del spec (§4, Criterio 1); AppShellComponent Menú lateral (Sidebar) el primer elemento debe ser 'Mis pendientes' con ruta '/dashboard/secretaria' | 2 failed, 612 passed |
| M2 calcular el menú con `user.rol` en lugar de `activeRole` | `menuConfig.getMenu(this.authFacade.currentUser()?.rol || 'SECRETARIA')` | AppShellComponent Menú lateral (Sidebar) debe computar el menú a partir del rol activo de ActiveRoleFacade (no del rol estático de AuthFacade); AppShellComponent Menú lateral (Sidebar) debe reactualizar el menú cuando el rol activo cambie; AppShellComponent Menú lateral (Sidebar) no debe mostrar las 5 opciones de secretaría si el rol activo no es SECRETARIA | 3 failed, 611 passed |
| M3 quitar `routerLinkActive` o `aria-current` del enlace activo | Eliminar `[attr.aria-current]="rla.isActive ? 'page' : null"` en `app-shell.component.html` | AppShellComponent Menú lateral (Sidebar) debe marcar el elemento activo con routerLinkActive y aria-current="page" | 1 failed, 613 passed |
| M4 quitar `MenuConfigPort` de `app.config.ts` | Eliminar `{ provide: MenuConfigPort, useClass: StaticMenuConfigAdapter }` de `appConfig` | AppShellComponent Providers en app.config.ts debe registrar MenuConfigPort sin lanzar NullInjectorError | 1 failed, 613 passed |
| M5 mostrar el contador en 0 cuando no hay fuente disponible | `pendingCount = computed(() => this.rawPendingCount() ?? 0)` | AppShellComponent Contador de pendientes (badge) no debe mostrarse si la fuente no está disponible o es null (Regla 7); AppShellComponent Contador de pendientes (badge) no debe mostrar un '0' inventado cuando el valor es null; AppShellComponent Contador de pendientes (badge) debe ocultarse si el observable de pendientes emite error | 3 failed, 611 passed |
| M6 volver a incluir un campo de búsqueda en la barra superior (violando D7) | Agregar `<div class="search-box"><input type="search" ... /></div>` en `app-shell.component.html` | AppShellComponent Barra superior (TopBar) no debe incluir barra de búsqueda global (D7) | 1 failed, 613 passed |

