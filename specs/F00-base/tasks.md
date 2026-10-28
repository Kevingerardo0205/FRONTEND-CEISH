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
| T07 | infra | roleGuard con rol activo (adaptar role.guard actual) | src/infrastructure/guards/role.guard.ts + spec | Redirige al inicio y avisa; las pruebas antiguas siguen en verde | Bloqueado: pendiente de HU-001 (ADMIN_TI, PRESIDENTA) |
| T08 | presentation | StageBar | src/shared/ui/stage-bar/* + spec | Criterio 2 de spec-ui | Hecho (c07697d) |
| T09 | presentation | PageHeader, ButtonGroup, Tabs, FilterBar | src/shared/ui/* + specs | Una acción principal; filtros recordados por vista | Hecho (4509807) |
| T10 | presentation | DataTable, StatusChip, estados vacío/cargando/error | src/shared/ui/* + specs | Criterio 6 de spec-ui | Hecho (c1ab158) |
| T11 | presentation | UndoToast (servicio + componente), Dialog, InlinePanel | src/shared/ui/*, infrastructure/services/notification.service.ts + specs | Criterio 5; foco atrapado y Esc en Dialog | Hecho (a88fb24) |
| T12 | infra | Port PendingCountPort + adapter mock (+ HTTP marcado FALTA) | features/shell/infrastructure/* + spec | El contador del menú sale del mock | Hecho (1df1f71) |
| T13 | presentation | AppShell (menú lateral + barra superior + selector de rol) y nuevo app.routes.ts con lazy loading, guards por rol y redirects desde /dashboard/... | features/shell/presentation/app-shell/*, app.routes.ts + spec | Criterios 1, 3, 4 y 8 de spec-ui | Pendiente |
| T14 | — | Retirar DashboardPage (layout), sidebar, menu-ui.config.ts, permissions.directive.ts y dashboard-routing.module.ts (archivo de rutas muerto), con sus pruebas | — | No quedan imports del sidebar viejo; build y pruebas en verde | Pendiente |
| T14b | presentation | StatusChip toma texto y tono de ProtocolUI | src/shared/ui/status-chip/*, src/shared/utils/protocol-ui.util.ts + specs | Sin mapeo de estados duplicado (plan §9) | Pendiente (PR F00a) |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin @angular), con la única excepción de plan §2 | eslint no-restricted-imports o spec | Romper la regla hace fallar el lint o la prueba | Pendiente |
| T16 | — | Revisión final: build prod, pruebas, lint, visto bueno contra el canvas | — | Capturas del AppShell y StageBar comparadas con el diseño | Pendiente |

## Calidad

- En `cf5ef01` (ajustes de revisión T01b–T03): el script `lint` quedó con `--max-warnings 76`, se ocultó el botón "Solicitar Enmienda" de `detalle-protocolo.page.ts` y se agregó la fuente Outfit en `index.html`.
- Línea base actual: **577 pruebas**.
