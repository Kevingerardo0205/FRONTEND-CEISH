# F00 · Base del rediseño — tareas

Rama: `feat/f00-base` (desde `dev`, después del merge de `chore/format-prettier`).
Cada tarea: un commit pequeño, `npm test` en verde, `npm run lint` sin advertencias nuevas.

| # | Capa | Tarea | Archivos | Terminado cuando… |
|---|---|---|---|---|
| T01 | — | ✓ Hecho 28/10: estructura confirmada con el inventario; armazón en features/shell. Pendiente: ADMIN_TI/PRESIDENTA | specs/F00-base/plan.md | El plan apunta a carpetas que existen |
| T01b | — | Quitar del menú y de las rutas lo que queda fuera de alcance (security, amendments, radar de plazos), sin borrar el código todavía | app.routes.ts, features/dashboard/routes.ts | Esas rutas no aparecen y redirigen al inicio |
| T02 | shared | Tokens de diseño como variables CSS | src/styles/_tokens.scss, styles.scss | Colores y radios salen de variables; nada nuevo con hex sueltos |
| T03 | domain | Stage VO (6 etapas) + pruebas | src/domain/value-objects/stage.vo.ts + spec | 100 % de cobertura; un código inválido da error controlado |
| T04 | domain | Role VO (roles fijos) y MenuItem | src/domain/value-objects/role.vo.ts, src/domain/entities/menu-item.entity.ts + spec | 100 % de cobertura |
| T05 | infra + app | menu.config.ts (Secretaría, 5 entradas) + GetMenuForRoleUseCase | features/shell/{application,infrastructure}/* + spec | La prueba confirma 5 entradas en orden para SECRETARIA |
| T06 | app | ActiveRoleFacade (rol activo, cambio de rol, localStorage seguro) | features/shell/application/* + spec | Cubre varios roles y un localStorage que falla |
| T07 | infra | roleGuard con rol activo (adaptar role.guard actual) | src/infrastructure/guards/role.guard.ts + spec | Redirige al inicio y avisa; las pruebas antiguas siguen en verde |
| T08 | presentation | StageBar | src/shared/ui/stage-bar/* + spec | Criterio 2 de spec-ui |
| T09 | presentation | PageHeader, ButtonGroup, Tabs, FilterBar | src/shared/ui/* + specs | Una acción principal; filtros recordados por vista |
| T10 | presentation | DataTable, StatusChip, estados vacío/cargando/error | src/shared/ui/* + specs | Criterio 6 de spec-ui |
| T11 | presentation | UndoToast (servicio + componente), Dialog, InlinePanel | src/shared/ui/*, infrastructure/services/notification.service.ts + specs | Criterio 5; foco atrapado y Esc en Dialog |
| T12 | infra | Port PendingCountPort + adapter mock (+ HTTP marcado FALTA) | features/shell/infrastructure/* + spec | El contador del menú sale del mock |
| T13 | presentation | AppShell (menú lateral + barra superior + selector de rol) y nuevo app.routes.ts con lazy loading, guards por rol y redirects desde /dashboard/... | features/shell/presentation/app-shell/*, app.routes.ts + spec | Criterios 1, 3 y 4 de spec-ui |
| T14 | — | Retirar DashboardPage (layout), sidebar, menu-ui.config.ts y permissions.directive.ts (con sus pruebas) | — | No quedan imports del sidebar viejo; build y pruebas en verde |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin @angular) | eslint no-restricted-imports o spec | Romper la regla hace fallar el lint o la prueba |
| T16 | — | Revisión final: build prod, pruebas, lint, visto bueno contra el canvas | — | Capturas del AppShell y StageBar comparadas con el diseño |
