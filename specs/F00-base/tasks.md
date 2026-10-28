# F00 · Base del rediseño — tareas

Rama: `feat/f00-base` (desde `dev`, después del merge de `chore/format-prettier`).
Cada tarea: un commit pequeño, `npm test` en verde, `npm run lint` sin advertencias nuevas.

| # | Capa | Tarea | Archivos | Terminado cuando… |
|---|---|---|---|---|
| T01 | — | Confirmar estructura real con el inventario y ajustar rutas de `plan.md` | `specs/F00-base/plan.md` | El plan apunta a carpetas que existen |
| T02 | shared | Tokens de diseño como variables CSS | `shared/styles/_tokens.scss`, `styles.scss` | Los colores y radios salen de variables; nada nuevo con hex sueltos |
| T03 | domain | `Stage` VO (7 etapas) + pruebas | `shared/domain/stage.vo.ts` + spec | 100 % de cobertura; un código inválido da error controlado |
| T04 | domain | `Role` VO (4 roles fijos) y `MenuItem` | `core/navigation/domain/*` + spec | 100 % de cobertura |
| T05 | infra + app | `menu.config.ts` (Secretaría, 5 entradas) + `GetMenuForRoleUseCase` | `core/navigation/*` + spec | La prueba confirma 5 entradas en orden para SECRETARIA |
| T06 | app | `ActiveRoleFacade` (rol activo, cambio de rol, localStorage seguro) | `core/navigation/application/*` + spec | Cubre varios roles y un localStorage que falla |
| T07 | core | `roleGuard` funcional con rol activo (adaptar el `RoleGuard` actual) | `core/auth/guards/*` + spec | Redirige al inicio y avisa; las pruebas antiguas siguen en verde |
| T08 | presentation | `StageBar` | `shared/ui/stage-bar/*` + spec | Criterio 2 de spec-ui |
| T09 | presentation | `PageHeader`, `ButtonGroup`, `Tabs`, `FilterBar` | `shared/ui/*` + specs | Una acción principal; filtros recordados por vista |
| T10 | presentation | `DataTable`, `StatusChip`, estados vacío, cargando y error | `shared/ui/*` + specs | Criterio 6 de spec-ui |
| T11 | presentation | `UndoToast` (servicio + componente), `Dialog`, `InlinePanel` | `shared/ui/*`, `core/` + specs | Criterio 5; foco atrapado y Esc en `Dialog` |
| T12 | infra | Port `PendingCountPort` + adapter mock (+ adapter HTTP con FALTA) | `core/navigation/infrastructure/*` + spec | El contador del menú sale del mock |
| T13 | presentation | `AppShell` (menú lateral + barra superior + selector de rol) y nuevo `app.routes.ts` con lazy loading y guards | `core/layout/app-shell/*`, `app.routes.ts` + spec | Criterios 1, 3 y 4 de spec-ui |
| T14 | — | Retirar `sidebar.component.ts` y el layout viejo del dashboard (con sus pruebas) | — | No quedan imports del sidebar viejo; build y pruebas en verde |
| T15 | arquitectura | Regla o prueba de capas (presentation sin HttpClient ni infrastructure; domain sin `@angular`) | `eslint` (`no-restricted-imports`) o spec | Romper la regla hace fallar el lint o la prueba |
| T16 | — | Revisión final: build de producción, pruebas, lint, y visto bueno contra el canvas | — | Capturas del AppShell y la StageBar comparadas con el diseño |
