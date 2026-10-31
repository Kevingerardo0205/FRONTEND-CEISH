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
| T07 | infra | roleGuard con rol activo (adaptar role.guard actual) | src/infrastructure/guards/role.guard.ts + spec | Redirige al inicio y avisa; las pruebas antiguas siguen en verde | Hecho (2afc6ff; prueba (g) en 8c5ad4f; pendiente de PR de F00b junto con T13) |
| T08 | presentation | StageBar | src/shared/ui/stage-bar/* + spec | Criterio 2 de spec-ui | Hecho (c07697d) |
| T09 | presentation | PageHeader, ButtonGroup, Tabs, FilterBar | src/shared/ui/* + specs | Una acción principal; filtros recordados por vista | Hecho (4509807) |
| T10 | presentation | DataTable, StatusChip, estados vacío/cargando/error | src/shared/ui/* + specs | Criterio 6 de spec-ui | Hecho (c1ab158) |
| T11 | presentation | UndoToast (servicio + componente), Dialog, InlinePanel | src/shared/ui/*, infrastructure/services/notification.service.ts + specs | Criterio 5; foco atrapado y Esc en Dialog | Hecho (a88fb24) |
| T12 | infra | Port PendingCountPort + adapter mock (+ HTTP marcado FALTA) | features/shell/infrastructure/* + spec | El contador del menú sale del mock | Hecho (1df1f71) |
| T13 | presentation | AppShell (menú lateral + barra superior + selector de rol) y nuevo app.routes.ts con lazy loading, guards por rol y redirects desde /dashboard/... | features/shell/presentation/app-shell/*, app.routes.ts + spec | Criterios 1, 3, 4 y 8 de spec-ui | Pendiente |
| T14 | — | Retirar DashboardPage (layout), sidebar, menu-ui.config.ts, permissions.directive.ts y dashboard-routing.module.ts (archivo de rutas muerto), con sus pruebas | — | No quedan imports del sidebar viejo; build y pruebas en verde | Pendiente |
| T14b | docs | Regla de uso de StatusChip con ProtocolUI (no había duplicado) | specs/F00-base/plan.md (§8, §9, §10) | Regla escrita en plan §9; ningún mapeo estado→texto ni estado→tono fuera de ProtocolUI | Hecho (6bae87e) |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin @angular), con la única excepción de plan §2 | eslint no-restricted-imports o spec | Romper la regla hace fallar el lint o la prueba | Hecho (1eb90e8) |
| T16 | — | Revisión final: build prod, pruebas, lint, visto bueno contra el canvas | — | Capturas del AppShell y StageBar comparadas con el diseño | Pendiente |

## Calidad

- En `cf5ef01` (ajustes de revisión T01b–T03): el script `lint` quedó con `--max-warnings 76`, se ocultó el botón "Solicitar Enmienda" de `detalle-protocolo.page.ts` y se agregó la fuente Outfit en `index.html`.
- Línea base actual: **584 pruebas** (+5 de T07: role.guard.spec pasa de 4 a 9 pruebas; antes 579).

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
