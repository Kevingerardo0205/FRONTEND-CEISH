# F00 · Base del rediseño — plan

**Estilo:** capas + Clean Architecture (ADR-001) · **Angular 20:** componentes standalone, signals, `ChangeDetectionStrategy.OnPush`
**Estado:** rutas verificadas con el inventario de solo lectura del código (28/10/2026).

---

## 1. Estructura real

```text
src/
├── app/                 ← app.routes.ts, app.config.ts
├── domain/              ← entidades y value objects compartidos
├── features/<seccion>/  ← {domain, application, infrastructure, presentation}
├── infrastructure/
│   ├── adapters/        ← adapters HTTP existentes
│   ├── api/endpoints.constant.ts   ← URLs del backend
│   ├── guards/          ← auth, role, verificado
│   ├── interceptors/    ← jwt, error, audit
│   └── services/notification.service.ts   ← MatSnackBar + confirm con MatDialog
├── shared/              ← ui, pipes, utils, constants
└── styles/
```

## 2. Archivos nuevos de F00

| Archivo | Contenido |
|---|---|
| `src/domain/value-objects/stage.vo.ts` | Las 6 etapas: Recepción, Asignación, Evaluación (incluye riesgo), Resolución, Seguimiento, Renovación |
| `src/domain/value-objects/role.vo.ts` | Roles fijos: `SECRETARIA`, `PRESIDENTE`, `EVALUADOR`, `INVESTIGADOR` |
| `src/domain/entities/menu-item.entity.ts` | `{ id, label, route, roles: Role[], badge?: 'pendientes' }` |
| `src/features/shell/application/` | `get-menu-for-role.use-case.ts`, `active-role.facade.ts` |
| `src/features/shell/infrastructure/` | `menu.config.ts` (menú de Secretaría, 5 entradas); `PendingCountPort` con adapter mock + adapter HTTP |
| `src/features/shell/presentation/app-shell/` | `AppShell` (menú lateral + barra superior + selector de rol) |
| `src/shared/ui/` | `stage-bar`, `page-header`, `button-group`, `tabs`, `filter-bar`, `data-table`, `status-chip`, `undo-toast`, `dialog`, `inline-panel`, `states` |
| `src/styles/_tokens.scss` | Variables CSS de la §3 de spec-ui |

## 3. Cambios clave

- **Menú:** hoy sale de `authFacade.menuConfig()` + `MODULE_UI_MAP` (`/auth/modules`, `/auth/permissions`). Pasa a una configuración local por rol (`menu.config.ts`).
- **Guards:** pasan de `data.permissions` con `permissionStrategy: 'any'` a `data.roles` + rol activo.
- **Avisos:** `notification.service` pasa a `UndoToast` + `Dialog`. La confirmación se reserva para lo irreversible.
- **Etapas:** el backend no expone la etapa. Se usa un mapeo temporal estado→etapa basado en `shared/utils/estado.resolver.ts`, marcado `// TODO RF-EST.2` y cubierto por pruebas.
- **Rutas viejas:** `/dashboard/...` redirige a las rutas nuevas, con el mismo patrón de redirects legacy de `features/protocols/routes.ts`.
- **Espacio del protocolo:** `protocol-workspace` se reutiliza como base en F02–F07.

## 4. Reutilizar / Ajustar / Reemplazar / Retirar

| Acción | Elementos |
|---|---|
| **Reutilizar** | `auth.guard`, `verificado.guard`, interceptores (jwt, error, audit), `endpoints.constant`, adapters, `confirm-dialog`, `session-expired-dialog`, `conflict-dialog`, `file-uploader`, pipes `protocol-status-*`, `estado.resolver` |
| **Ajustar** | `role.guard`: varios roles + rol activo |
| **Reemplazar** | `DashboardPage` (layout) y `sidebar` → `AppShell`; `notification.service` → `UndoToast`/`Dialog`; `permissions.directive` → directiva por rol, o eliminarla |
| **Retirar** | `shared/constants/menu-ui.config.ts` |

## 5. Fuera de alcance

Se quita del menú y de las rutas en F00. El código se borra en F08.

- `features/security` (`role-matrix`, `role-dialog`, `security-api.adapter`, `update-user-roles.use-case`).
- `features/amendments` y la ruta `investigador/enmienda/:id`.
- `dashboard-secretaria`: `deadlines-radar`, `kpi-panel` y `audit-feed`.
- Las suplencias (`extend-temporary-role`, `suspend-temporary-role`) **no se tocan** hasta confirmarlas.

## 6. Pruebas

| Capa | Cobertura mínima | Qué se prueba |
|---|---|---|
| domain | 100 % | `Stage` (6 códigos y uno inválido), orden y etiquetas; `Role`; `MenuItem` |
| application | 90 % | `GetMenuForRoleUseCase` (Secretaría = 5 entradas en orden); `ActiveRoleFacade` (cambio de rol, localStorage que falla) |
| infrastructure | 80 % | Mapeo temporal estado→etapa; adapter de pendientes (mock y HTTP con `HttpTestingController`); `role.guard` |
| presentation | 70 % de los flujos críticos | `StageBar`, `AppShell`, `UndoToast`, `DataTable` (vacío, cargando, error) |
| arquitectura | — | Prueba o regla de capas: `presentation/**` sin `HttpClient` ni `infrastructure/**`; `domain/**` sin `@angular/*` |

Línea base: **447 pruebas**.

## 7. Calidad

- `lint` con `--max-warnings 76`, que se baja en cada PR. Los archivos nuevos no agregan advertencias.

## 8. Pendientes

- **ADMIN_TI y PRESIDENTA** aparecen en los guards además de los 4 roles. ¿ADMIN_TI sigue existiendo o lo absorbe SECRETARIA? ¿PRESIDENTA es alias de PRESIDENTE? Confirmar y llevarlo a HU-001 del backend.
- **Selector de rol activo** para quien tiene varios roles.

**Decisión tomada:** el armazón va en `features/shell`.
