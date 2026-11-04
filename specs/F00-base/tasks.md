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
| T13d | presentation + app | Rutas nuevas bajo el AppShell (`/pendientes`, `/protocolos`, `/convocatorias`, `/reportes`, `/configuracion`) con lazy loading, redirects desde `/dashboard/...` donde haya equivalente y `RoleGuard` que redirige al inicio del rol activo | src/app/app.routes.ts, features/shell/presentation/app-shell/* + spec | Criterio 4 de spec-ui | Hecho (9a738e3 T13d-0, 52aabb3 T13d-1, fe4058b T13d-2, 88e1ff8 T13d-3 un solo AppShell, T13d-4 403 del login y OTP; 699 pruebas; mutaciones M0–M17, N1–N3 y K1–K5 detectadas, ver auditorías T13d, T13d-3 y T13d-4; decisiones D9–D15 en spec-ui §2 y §7) |
| T14 | — | Retirar solo lo que quede sin uso tras F00b (DashboardPage, sidebar, menu-ui.config.ts, permissions.directive.ts y dashboard-routing.module.ts, con sus pruebas, cuando ningún rol los use) | — | No quedan imports de código retirado; build y pruebas en verde. `DashboardPage`, el `sidebar` y `menu-ui.config.ts` siguen vivos para PRESIDENTE, EVALUADOR e INVESTIGADOR. Tras T13d-3: el padre `dashboard` con `DashboardPage` (`DASHBOARD_ROUTES`) se retira cuando ningún rol lo use; el hijo `dashboard` del AppShell (`SECRETARIA_DASHBOARD_ROUTES`), cuando F01–F08 muevan las pantallas de la Secretaría a sus rutas nuevas; el padre de respaldo sin layout de `app.routes.ts`, junto con `DashboardPage`; la rama `SECRETARIA` de `DashboardHomePage`, cuando `/pendientes` tenga su pantalla de F01. También van aquí `SHELL_PROVIDERS` vacío y el cambio de nombre de `auth-session-roles.adapter.ts` | Pendiente |
| T14b | docs | Regla de uso de StatusChip con ProtocolUI (no había duplicado) | specs/F00-base/plan.md (§8, §9, §10) | Regla escrita en plan §9; ningún mapeo estado→texto ni estado→tono fuera de ProtocolUI | Hecho (6bae87e) |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin @angular), con la única excepción de plan §2 | eslint no-restricted-imports o spec | Romper la regla hace fallar el lint o la prueba | Hecho (1eb90e8) |
| T16 | — | Revisión final: build prod, pruebas, lint, visto bueno contra el canvas | — | Capturas del AppShell y StageBar comparadas con el diseño | Pendiente |

## Calidad

- En `cf5ef01` (ajustes de revisión T01b–T03): el script `lint` quedó con `--max-warnings 76`, se ocultó el botón "Solicitar Enmienda" de `detalle-protocolo.page.ts` y se agregó la fuente Outfit en `index.html`.
- Línea base actual: **699 pruebas** (T13d-4: +19; 11 en `auth-errors.spec` (nuevo), 4 en `login.page.spec` (nuevo) y 4 en `error.interceptor.spec`). Antes de T13d-4 eran 680 (T13d-3: +9; 1 en `app.routes.spec`, misma instancia del AppShell, y 8 en `role-home.routes.spec`, estructura sin navegar). Antes de T13d-3 eran 671 (T13d: +44; T13d-0 +2 en `active-role-startup.spec`; T13d-1 +24 en `app.routes.spec`; T13d-2 +18: 5 más en `app.routes.spec`, 4 en `role-home.routes.spec`, 3 en `auth.guard.spec` (nuevo), 3 en `dashboard.page.spec`, 2 en `role.guard.spec` y 1 en `error.interceptor.spec`). Antes de T13d eran 627 (T13c: +9; 6 en `RoleSelectorComponent`, 2 en `dashboard.page.spec` y 1 en el Role VO, por el nombre legible). Antes de T13c eran 618 (corrección de T13b: +4; `shell.providers.spec` pasa de 2 a 4 y `AuthSessionUserAdapter` agrega 2). Antes de la corrección eran 614, con **21** pruebas en `AppShellComponent` (no 16, como decía la fila anterior); antes de T13b, 590; antes de T13a, 584.

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

### Auditoría de mutaciones T13d (03/11/2026) — rutas por rol activo · 671 pruebas totales

Mutaciones medidas con `npx ng test --watch=false --browsers=ChromeHeadless --include=<spec>` sobre el spec de cada fila. Cada una se aplicó y revirtió con un script que guarda el archivo original y compara el hash de `git diff` antes y después ("REVERTIDO: OK" en todas). M0 se midió antes del commit de T13d-0, con la suite completa; M1–M7 antes del commit de T13d-1; M8–M17 antes del de T13d-2.

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| M0 corrección de D15 revertida | `sessionRoles = toSignal(toObservable(computed(() => port.roles())))` en `ActiveRoleFacade`: el comportamiento anterior (los roles llegan con un effect) | Rol activo en la primera navegación (T13d-0): al recargar (usuario ya guardado), el guard de la primera navegación ve el rol activo; después de setAuth() del login, la navegación inmediata ve el rol activo; y 10 de `ActiveRoleFacade`, que leen el rol sin `TestBed.tick()` | 12 failed, 617 passed (suite completa) |
| M1 quitar el `canMatch` | Borrar `canMatch: [activeRoleIs('SECRETARIA')]` del primer padre | D9: EVALUADOR en /dashboard/protocols/workspace/1/info ve DashboardPage; D9: al cambiar de rol con el selector, la navegación al inicio del rol cambia de layout. Después el navegador se cuelga (bucle `/dashboard/home` → `/pendientes` → RoleGuard → `/dashboard/home` para EVALUADOR) | 2 failed; Executed 9 of 24 DISCONNECTED |
| M2 invertir el orden de los padres | `DashboardPage` primero, `AppShellComponent` después | D11: SECRETARIA: /dashboard → /pendientes; D11: SECRETARIA: /dashboard/home?tab=peers → /pendientes?tab=peers; D9: SECRETARIA en /dashboard/protocols/workspace/1/info ve el AppShell | 3 failed, 21 passed |
| M3 redirect de `/dashboard/home` sin condición por rol | El redirect a `/pendientes` también en el padre de `DashboardPage` | D11: PRESIDENTE: /dashboard/home?tab=peers se queda en /dashboard/home; D9: al cambiar de rol con el selector, la navegación al inicio del rol cambia de layout; ROLE_HOME admite a su rol: EVALUADOR, INVESTIGADOR y PRESIDENTE entran a /dashboard/home sin aviso | 5 failed, 19 passed |
| M4 redirect que pierde los query params | `redirectTo: '/pendientes'` (string) en lugar de `redirectKeepingQuery('/pendientes')` | D11: SECRETARIA: /dashboard/home?tab=peers → /pendientes?tab=peers | 1 failed, 23 passed |
| M5 `''` → `/auth/login` aunque haya sesión | Código anterior: `redirectTo: 'auth/login'` | D13: / con SECRETARIA va a /pendientes; / con EVALUADOR va a /dashboard/home | 2 failed, 22 passed |
| M6 `**` → `/auth/login` | Código anterior: `redirectTo: 'auth/login'` | D13: /ruta-que-no-existe con SECRETARIA va a /pendientes; /ruta-que-no-existe con EVALUADOR va a /dashboard/home | 2 failed, 22 passed |
| M7 ruta nueva con `component` | `/reportes` con `component: StatsDashboardPage` (import estático) | D10: cada ruta nueva usa loadComponent y no component | 1 failed, 23 passed |
| M8 RoleGuard vuelve a `/dashboard` | Código anterior de `role.guard.ts` (sin `RoleHome`) | RoleGuard (d), (d2), (d3), (e) y (g); D13: sesión sin rol activo: /pendientes → /auth/login con un solo aviso | 6 failed, 34 passed |
| M9 login fijo a `/dashboard/home` | Código anterior: `router.navigate(['/dashboard/home'])` | D13: login sin rol reconocido → /auth/login con aviso | 1 failed, 28 passed |
| M10 `ROLE_HOME[INVESTIGADOR] = '/pendientes'` | Un inicio que su rol no admite (bucle) | ROLE_HOME contra data.roles de las rutas: ROLE_HOME[INVESTIGADOR] apunta a una ruta que admite INVESTIGADOR (sin bucle). Con `app.routes.spec`, el navegador se cuelga por el bucle (Executed 18 of 30 DISCONNECTED); por eso esa prueba estática vive en su propio spec | 1 failed, 3 passed (`role-home.routes.spec`) |
| M11 DashboardHomePage vuelve a `user.rol` | Código anterior de `userRole` | D11: SECRETARIA+EVALUADOR con EVALUADOR activo se queda en /dashboard/home | 1 failed, 28 passed |
| M13 AuthGuard vuelve a `/dashboard` | Código anterior | AuthGuard: sin el permiso requerido vuelve al inicio del rol activo, no a /dashboard | 1 failed, 2 passed |
| M14 VerificadoGuard vuelve a `/dashboard` | Código anterior | VerificadoGuard: debe bloquear y notificar a un investigador no verificado (no exento) | 1 failed, 6 passed |
| M15 interceptor 403 vuelve a `/dashboard` | Código anterior: `router.navigate(['/dashboard'])` | ErrorInterceptor: D12: un 403 sin verificación pendiente navega al inicio del rol activo, no a /dashboard | 1 failed, 9 passed |
| M16 role-badge con `user.rol` | Código anterior de `userRole` en `DashboardPage` | D14: el role-badge muestra la etiqueta del rol activo, no user.rol; D14: con EVALUADOR activo y asistente solo de SECRETARIA, no se muestra | 2 failed, 3 passed |
| M17 showAssistant con `user.rol` | Código anterior de `showAssistant` | D14: showAssistant decide con el rol activo, no con user.rol | 1 failed, 4 passed |

- No hay M12: el número se saltó al armar la lista.
- M1 y M10 con `app.routes.spec` cuelgan el navegador por un bucle de redirecciones: las pruebas fallan antes del cuelgue (M1), o la prueba estática de `role-home.routes.spec` lo detecta sin navegar (M10).
- M9: con D11, el código anterior (`/dashboard/home` fijo) también lleva a la Secretaría a `/pendientes`, y para los otros roles `ROLE_HOME` ya es `/dashboard/home`. Solo cambia el caso sin rol activo, y esa es la única prueba que lo detecta.
- D15 confirmado: la prueba de T13d-0 falló con el código anterior en los dos casos (recarga y login), porque `toObservable` emite con un effect, después de la primera navegación. Se corrigió en el puerto (`SessionRolesPort.roles(): string[]`, lectura síncrona; el adapter lee el signal de `AuthFacade`) y en el facade (`computed` en lugar de `toSignal`). No hizo falta un resolver ni `APP_INITIALIZER`. El retraso también afectaba al `RoleGuard` de T07 al recargar.
- `dashboard.page.spec.ts` (T13c) fallaba si corría sola, por el locale `es` de la fecha: ahora registra el locale en el propio spec. Lo mostró la primera corrida de M16, que se repitió.
- Pruebas antiguas ajustadas a D12: en `role.guard.spec`, (d), (e), (g) y "notifica una vez" (el destino es `ROLE_HOME`; sin rol activo, un solo aviso: "Su cuenta no tiene un rol vigente."); en `verificado.guard.spec`, el destino es `RoleHome`. `active-role.facade.spec` y `auth-session-roles.adapter.spec` se ajustaron porque el puerto ya no es un Observable.
- Con D9, `/pendientes` (en `app.routes.ts`) y `/dashboard/...` (en `dashboard/routes.ts`) usan dos instancias distintas de `AppShellComponent`: al pasar de una ruta a la otra, el AppShell se vuelve a crear.

### Auditoría de mutaciones T13d-3 (03/11/2026) — un solo AppShell · 680 pruebas totales

Estructura nueva en `app.routes.ts`, en este orden:
1. `''` (`pathMatch: 'full'`) → `redirectToRoleHome`.
2. Padre `''` con `AppShellComponent` (lazy), `canMatch: [activeRoleIs('SECRETARIA')]` y `AuthGuard`. Hijos: `SECRETARIA_ROUTES` + `{ path: 'dashboard', loadChildren: SECRETARIA_DASHBOARD_ROUTES }` (los redirects de D11 + `DASHBOARD_CHILDREN`).
3. Padre de respaldo `''` sin layout, con `children: SECRETARIA_ROUTES` (criterio 4).
4. `dashboard` → `DASHBOARD_ROUTES` (`DashboardPage`, `AuthGuard`), para los otros roles.
5. `**` → `redirectToRoleHome`.

- `''` y `**` no quedan atrapados por el `canMatch`: `''` va antes, y una URL que ningún hijo reconoce sale de los tres padres y llega a `**`.
- **Criterio 4:** con otro rol activo, el `canMatch` del AppShell no coincide. Sin el padre de respaldo, `/pendientes` caía en `**` y llegaba al inicio **sin aviso** (N3). Con el respaldo, el `RoleGuard` de la ruta da el aviso "No tiene acceso a esta sección con el rol activo." y lleva al inicio del rol activo.
- **Pruebas cambiadas:** "D10: cada ruta nueva usa loadComponent y no component" buscaba el padre del AppShell como `children === SECRETARIA_ROUTES`; ahora ese es el padre de respaldo. Busca el padre por su `canMatch` y además comprueba que el hijo `dashboard` es lazy y que el respaldo no tiene layout. No se debilitó ninguna otra; `active-role-startup.spec` no cambió.

Mutaciones medidas con `npx ng test --watch=false --browsers=ChromeHeadless --include=<spec>` y revertidas con el script de hash de `git diff` ("REVERTIDO: OK" en todas).

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| N1 dos AppShell separados | `app.routes.ts` y `dashboard/routes.ts` como en `fe4058b` (T13d-2) | T13d-3: /pendientes ↔ /dashboard/protocols/workspace/1/info conserva la misma instancia del AppShell; D10: cada ruta nueva usa loadComponent y no component | 2 failed, 28 passed (`app.routes.spec`) |
| N2 (= M1) quitar el `canMatch` del padre unificado | Borrar `canMatch: [activeRoleIs('SECRETARIA')]` | Padre único del AppShell: el canMatch del AppShell coincide solo con el rol activo SECRETARIA; … no coincide con PRESIDENTE, EVALUADOR, INVESTIGADOR y sin rol activo. Con `app.routes.spec` el navegador se cuelga en la primera prueba (bucle `/pendientes` ↔ `/dashboard/home`: Executed 0 of 30 DISCONNECTED) | 5 failed, 5 passed (`role-home.routes.spec`, sin las 2 de D11) |
| N3 quitar el padre de respaldo | Borrar `{ path: '', children: SECRETARIA_ROUTES }` | criterio 4: INVESTIGADOR que abre /pendientes vuelve a /dashboard/home con aviso; criterio 4: EVALUADOR que abre /reportes vuelve a /dashboard/home con aviso | 2 failed, 28 passed |
| M2 invertir el orden | `dashboard` (`DashboardPage`) antes que el padre del AppShell | `app.routes.spec`: D11 SECRETARIA /dashboard → /pendientes; D11 SECRETARIA /dashboard/home?tab=peers; D9 SECRETARIA en workspace ve el AppShell; T13d-3 misma instancia. `role-home.routes.spec`: el AppShell va antes que 'dashboard' de DashboardPage y que ** | 4 failed, 26 passed / 1 failed, 9 passed |
| M3 redirect de `/dashboard/home` sin condición | El redirect también en `DASHBOARD_ROUTES` | Redirect de /dashboard/home solo en la rama de la Secretaría: en DashboardPage, home carga DashboardHomePage y no redirige. Con `app.routes.spec` el navegador se cuelga (bucle EVALUADOR `/dashboard/home` → `/pendientes` → RoleGuard: Executed 2 of 30 DISCONNECTED) | 1 failed, 11 passed (`role-home.routes.spec`) |
| M4 redirect que pierde los query params | `redirectTo: '/pendientes'` (string) en `SECRETARIA_DASHBOARD_ROUTES` | D11: SECRETARIA: /dashboard/home?tab=peers → /pendientes?tab=peers | 1 failed, 29 passed |
| M5 `''` → `/auth/login` aunque haya sesión | `redirectTo: 'auth/login'` | D13: / con SECRETARIA va a /pendientes; / con EVALUADOR va a /dashboard/home; sesión sin rol activo: '' → /auth/login con aviso | 3 failed, 27 passed |
| M6 `**` → `/auth/login` | `redirectTo: 'auth/login'` | D13: /ruta-que-no-existe con SECRETARIA va a /pendientes; … con EVALUADOR va a /dashboard/home | 2 failed, 28 passed |

- Las pruebas estructurales de `role-home.routes.spec` (canMatch del AppShell, orden de los padres y D11 solo en la rama de la Secretaría) no navegan: detectan las mutaciones que, navegando, forman un bucle y cuelgan el navegador antes de registrar un fallo.

### Auditoría de mutaciones T13d-4 (04/11/2026) — 403 del login y OTP · 699 pruebas totales

Hallazgo confirmado (Paso 0, prueba "403 de verificación (texto real) abre el OTP, sin navegar ni aviso de rol" con la cadena real interceptor → adapter → use case → `LoginPage`), con el código anterior:
- `open` de `MatDialog` no se llamó: el OTP no se abría.
- Se llamó `navigateByUrl` y el aviso "Su cuenta no tiene un rol vigente.".
- La pantalla mostraba "No tienes permisos para acceder a este recurso.".

Causas, todas ya en el código anterior:
1. El texto real del backend ("Por favor, confirma tu correo electrónico antes de iniciar sesión.") no incluye "verificar" ni "OTP", y además viene en `body.error.message` (`HttpExceptionFilter`), no en `body.message`.
2. El 403 genérico del interceptor navega a `RoleHome` (T13d-2) y relanza un `Error` sin status.
3. **Capa no incluida en el hallazgo:** `BaseApiService.handleError` también envolvía cualquier error en `new Error(error.message)`. Con el interceptor ya corregido, el login seguía sin abrir el OTP; el texto que llegaba era "Http failure response for /api/auth/login: 403 Forbidden". Por la misma razón, un 401 del login (cuenta desactivada o "Invalid credentials") mostraba "Http failure response for /api/auth/login: 401 Unauthorized".

Corrección:
- `features/auth/domain/auth-errors.ts` (nuevo, puro): `isEmailVerificationRequired` (403 con "confirma tu correo", "verificar" u "OTP"), `isAccountLocked` (403 con "locked") y `backendErrorMessage` (lee `body.message` y `body.error.message`). No existía un equivalente; el `nestedErrorMessage` privado del interceptor queda igual.
- `error.interceptor.ts`: en un 403 de las rutas públicas de auth que llama una pantalla (login, register, setup-account, confirm-email, resend-confirmation, forgot-password, reset-password) relanza el `HttpErrorResponse` original, sin navegar ni avisos. `/auth/refresh` es pública pero la llama el interceptor: queda fuera. El 403 de las demás peticiones sigue igual que en T13d-2 y usa la misma función para reconocer la verificación. El retry y el 401 no cambiaron.
- `auth-api.adapter.ts`: `login` llama a `apiClient.post` en lugar de `this.post`, para no pasar por `handleError`. Los demás errores llegan con el mismo mensaje, porque `handleError` solo copiaba `message`.
- `login.page.ts`: abre el OTP solo si `isEmailVerificationRequired`; con `isAccountLocked` muestra "Cuenta bloqueada temporalmente. Intente más tarde."; en otro caso, el mensaje del backend o `err.message`. El reintento tras cerrar el OTP con éxito se mantiene.

Mutaciones medidas con `--include` de `login.page.spec`, `error.interceptor.spec` y `auth-errors.spec`, y revertidas con el script de hash de `git diff` ("REVERTIDO: OK" en todas).

| Mutación | Qué se rompió | Prueba que falla | Tests |
|---|---|---|---|
| K1 volver a navegar en el 403 de `/auth/login` | Quitar el retorno temprano de las rutas públicas de auth | Interceptor: /api/auth/login, /api/auth/register y /api/auth/confirm-email: relanza el HttpErrorResponse original, sin navegar. Login: 403 de verificación (texto real) abre el OTP…; 403 de bloqueo muestra el mensaje de bloqueo…; si el OTP se cierra con éxito, el login se reintenta | 6 failed, 23 passed |
| K2 quitar "confirma tu correo" | Borrar esa condición de `isEmailVerificationRequired` | auth-errors: reconoce el texto real del backend en body.error.message; … en body.message. Login: 403 de verificación (texto real) abre el OTP…; si el OTP se cierra con éxito, el login se reintenta | 4 failed, 25 passed |
| K3 abrir el OTP con cualquier 403 (código anterior) | `isEmailVerificationRequired(err) \|\| err.status === 403` | Login: 403 de bloqueo muestra el mensaje de bloqueo, sin OTP ni navegación | 1 failed, 28 passed |
| K4 relanzar un `Error` genérico | `new Error('No tienes permisos para acceder a este recurso.')` en lugar del `HttpErrorResponse` | Las 3 de rutas públicas del interceptor; login: verificación, bloqueo y reintento | 6 failed, 23 passed |
| K5 login del adapter con `this.post` (código anterior) | Volver a pasar por `BaseApiService.handleError` | Login: 401 de cuenta desactivada muestra su mensaje, sin OTP; 403 de bloqueo…; 403 de verificación…; si el OTP se cierra con éxito… | 4 failed, 25 passed |

- Con K5, los mensajes que mostraba la pantalla eran "Http failure response for /api/auth/login: 403 Forbidden" (bloqueo) y "…: 401 Unauthorized" (cuenta desactivada).
- Cambio visible: el 401 de contraseña incorrecta muestra ahora el texto del backend, "Invalid credentials", en inglés (antes, "Http failure response…"). Traducirlo es parte de la propuesta de plan §8.
