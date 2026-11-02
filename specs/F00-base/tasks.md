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
| T13b | presentation | Providers de shell (`MenuConfigPort` y `SHELL_PROVIDERS`, hoy sin registrar) + AppShell de la Secretaría con menú lateral de 5 entradas y barra superior | features/shell/shell.providers.ts, src/app/app.config.ts, features/shell/presentation/app-shell/* + spec | Criterio 1 de spec-ui | Hecho (d87b76b; corrección 41a8571: búsqueda oculta, `SessionUserPort`, `MenuConfigPort` solo en app.config.ts, contador sin mock en la app real; 618 pruebas; mutaciones A–H detectadas) |
| T13c | presentation | Selector de rol con navegación al inicio de cada rol | features/shell/presentation/app-shell/* (selector) + spec | Criterios 3 y 8 de spec-ui | Hecho (7ee153a; 627 pruebas; mutaciones M1–M6 detectadas; `ROLE_HOME` en features/shell/domain/role-home.ts; selector también en DashboardPage) |
| T13d | presentation + app | Rutas nuevas bajo el AppShell (`/pendientes`, `/protocolos`, `/convocatorias`, `/reportes`, `/configuracion`) con lazy loading, redirects desde `/dashboard/...` donde haya equivalente y `RoleGuard` que redirige al inicio del rol activo | src/app/app.routes.ts, features/shell/presentation/app-shell/* + spec | Criterio 4 de spec-ui | Pendiente |
| T14 | — | Retirar solo lo que quede sin uso tras F00b (DashboardPage, sidebar, menu-ui.config.ts, permissions.directive.ts y dashboard-routing.module.ts, con sus pruebas, cuando ningún rol los use) | — | No quedan imports de código retirado; build y pruebas en verde. `DashboardPage`, el `sidebar` y `menu-ui.config.ts` siguen vivos para PRESIDENTE, EVALUADOR e INVESTIGADOR | Pendiente |
| T14b | docs | Regla de uso de StatusChip con ProtocolUI (no había duplicado) | specs/F00-base/plan.md (§8, §9, §10) | Regla escrita en plan §9; ningún mapeo estado→texto ni estado→tono fuera de ProtocolUI | Hecho (6bae87e) |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin @angular), con la única excepción de plan §2 | eslint no-restricted-imports o spec | Romper la regla hace fallar el lint o la prueba | Hecho (1eb90e8) |
| T16 | — | Revisión final: build prod, pruebas, lint, visto bueno contra el canvas | — | Capturas del AppShell y StageBar comparadas con el diseño | Pendiente |

## Calidad

- En `cf5ef01` (ajustes de revisión T01b–T03): el script `lint` quedó con `--max-warnings 76`, se ocultó el botón "Solicitar Enmienda" de `detalle-protocolo.page.ts` y se agregó la fuente Outfit en `index.html`.
- Línea base actual: **627 pruebas** (T13c: +9; 6 en `RoleSelectorComponent`, 2 en `dashboard.page.spec` y 1 en el Role VO, por el nombre legible). Antes de T13c eran 618 (corrección de T13b: +4; `shell.providers.spec` pasa de 2 a 4 y `AuthSessionUserAdapter` agrega 2). Antes de la corrección eran 614, con **21** pruebas en `AppShellComponent` (no 16, como decía la fila anterior); antes de T13b, 590; antes de T13a, 584.

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

### Auditoría de mutaciones T13b (corregida 02/11/2026) — AppShellComponent + proveedores del shell · 618 pruebas totales

La tabla de `a673afe` no correspondía al código de `d87b76b` y se reemplaza:
- Citaba pruebas que no existen (por ejemplo, "el primer elemento debe ser 'Mis pendientes' con ruta '/dashboard/secretaria'"). `MENU_ITEMS` no cambió en `d87b76b` y la prueba real usa `/pendientes`.
- Citaba código que no existe (`menuConfig.getMenu`, `rawPendingCount`).
- Los conteos ("612 passed") no salían de una corrida.
- **M6 (búsqueda):** `d87b76b` nunca tuvo un `<input class="search-box">` ni estilos de búsqueda. La prueba sí lo habría detectado, porque su selector incluía `.search-box`. La corrección agrega `[role="search"]` al selector.

Mutaciones medidas con `npx ng test --watch=false --browsers=ChromeHeadless --include 'src/features/shell/**/*.spec.ts'` (56 pruebas del shell). Cada una se revirtió editando y se comprobó que el hash de `git diff` volvía al de partida.

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| A orden del menú | `execute(role).reverse()` en `menuItems` | muestra exactamente 5 entradas en el orden especificado para SECRETARIA; muestra el menú de Secretaría si el rol activo es SECRETARIA | 2 failed, 54 passed |
| B menú sin rol activo | `execute('SECRETARIA')` en lugar de `execute(role)` | no muestra el menú de Secretaría si el rol activo es INVESTIGADOR; no muestra el menú de Secretaría a un usuario con varios roles si el rol activo es EVALUADOR | 2 failed, 54 passed |
| C sin `aria-current` | Quitar `[attr.aria-current]` del enlace | marca la entrada activa con aria-current="page" al navegar a su ruta | 1 failed, 55 passed |
| D volver a poner la búsqueda | `<input class="search-box" type="text">` en la barra | no contiene ningún elemento de búsqueda global (D7: oculta hasta que exista el endpoint) | 1 failed, 55 passed |
| D2 búsqueda sin clase | `<div role="search"><input type="text" /></div>` | la misma | 1 failed, 55 passed |
| E mock en la app real | `{ provide: PendingCountPort, useClass: PendingCountMockAdapter }` en `app.config.ts` | con appConfig no hay fuente de pendientes: el contador emite null (sin mock); ningún registro de la app real provee PendingCountPort | 2 failed, 54 passed |
| F `AuthFacade` en el AppShell | `import { AuthFacade } from '@features/auth/facades/auth.facade'` | eslint: `23:1 error '@features/auth/facades/auth.facade' import is restricted from being used by a pattern. Capas: shell no importa otras secciones  no-restricted-imports` | `✖ 77 problems (1 error, 76 warnings)` |
| G sin registro de `MenuConfigPort` | Quitar la línea de `app.config.ts` (único registro) | inyectar AppShellComponent y GetMenuForRoleUseCase con appConfig.providers no lanza NullInjectorError; con appConfig, GetMenuForRoleUseCase da las 5 entradas de SECRETARIA; MenuConfigPort se registra en un solo lugar (app.config.ts, no SHELL_PROVIDERS) | 3 failed, 53 passed |
| H INVESTIGADOR en el respaldo del asistente | `['SECRETARIA', 'EVALUADOR', 'PRESIDENTE', 'INVESTIGADOR']` | la lista de roles de respaldo es la del backend (sin ADMIN_TI ni INVESTIGADOR) | 1 failed, 55 passed |

- `GET /secretaria/pendientes` no existe en el backend: no hay controlador `secretaria` y solo aparece en `specs/003-flujo-mvp/spec.md:198` (RF-ALR.f). Sin `PendingCountPort` registrado, `GetPendingCountUseCase` emite `null` y el contador queda oculto. `PendingCountMockAdapter` solo se usa en pruebas.
- `SessionUserPort` (`features/shell/domain`) y su adapter `AuthSessionUserAdapter` se registran en `app.config.ts`, igual que `SessionRolesPort`. El adapter vive en `auth-session-roles.adapter.ts`, la única excepción de capas que puede leer `@features/auth`, para no tocar `eslint.config.js`, que volvió a quedar igual que en `d87b76b~1`.

### Auditoría de mutaciones T13c (02/11/2026) — RoleSelectorComponent + ROLE_HOME · 627 pruebas totales

Mutaciones medidas con `npx ng test --watch=false --browsers=ChromeHeadless`, sobre `src/features/shell/**/*.spec.ts`, `dashboard.page.spec.ts` y `role.vo.spec.ts` (79 pruebas). Cada una se revirtió editando y se comprobó que el hash de `git diff` volvía al de partida.

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| M1 selector con un solo rol | `visible = roles().length > 0` | criterio 8: con un solo rol no hay selector; DashboardPage: con un solo rol, el menú de avatar no muestra el selector | 2 failed, 77 passed |
| M2 no navegar después de cambiar | Quitar `router.navigateByUrl(ROLE_HOME[code])` | criterio 3: al cambiar de rol cambia el activo y navega al inicio del rol nuevo; criterio 8: SECRETARIA+EVALUADOR con EVALUADOR activo, al cambiar a SECRETARIA queda en /pendientes | 2 failed, 77 passed |
| M3 navegar al inicio del rol anterior | `ROLE_HOME[previous]` con el rol activo antes del cambio | las mismas dos de M2 | 2 failed, 77 passed |
| M4 navegar aunque `switchRole` devuelva false | Navegar fuera del `if` | si switchRole devuelve false, no navega | 1 failed, 78 passed |
| M5 quitar el selector de DashboardPage | Borrar `<app-role-selector>` de `dashboard.page.html` | DashboardPage: el menú de avatar muestra el selector para volver a SECRETARIA; DashboardPage: con un solo rol, el menú de avatar no muestra el selector | 2 failed, 77 passed |
| M6 SECRETARIA → `/dashboard/home` en `ROLE_HOME` | `SECRETARIA: '/dashboard/home'` | criterio 8: SECRETARIA+EVALUADOR con EVALUADOR activo, al cambiar a SECRETARIA queda en /pendientes | 1 failed, 78 passed |

- Criterio 8, parte del rol inicial: ya lo cubren `active-role.facade.spec.ts` ("con varios roles y nada guardado, activa el de mayor prioridad" y "usa el último rol guardado si sigue siendo válido"). No se duplicó.
- "Ve el menú de Secretaría" con el rol activo SECRETARIA lo cubre `app-shell.component.spec.ts` (T13b).
- La navegación al inicio la hace presentation (`RoleSelectorComponent`), no `ActiveRoleFacade`. El TODO T13 del facade se reemplazó por esa nota.
