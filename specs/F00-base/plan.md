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
│   └── services/notification.service.ts   ← notify() con UndoToast + confirm() con MatDialog
├── shared/              ← ui, pipes, utils, constants
└── styles/
```

## 2. Archivos nuevos de F00

| Archivo | Contenido |
|---|---|
| `src/domain/value-objects/stage.vo.ts` | Las 6 etapas: Recepción, Asignación, Evaluación (incluye riesgo), Resolución, Seguimiento, Renovación |
| `src/domain/value-objects/role.vo.ts` | 4 roles fijos: `SECRETARIA`, `PRESIDENTE`, `EVALUADOR`, `INVESTIGADOR`. Sin `ADMIN_TI` ni `PRESIDENTA` (pendiente HU-001) |
| `src/domain/entities/menu-item.entity.ts` | `{ id, label, route, roles: RoleCode[], badge?: 'pendientes' }` |
| `src/domain/ports/menu-config.port.ts` | Port de la configuración del menú (clase abstracta) |
| `src/features/shell/domain/session-roles.port.ts` | `SessionRolesPort`: roles de la sesión (`roles$`). Clase abstracta para no importar `@angular` en domain |
| `src/features/shell/domain/pending-count.port.ts` | `PendingCountPort`: `count$: Observable<number>` (clase abstracta) |
| `src/features/shell/application/` | `get-menu-for-role.use-case.ts`, `active-role.facade.ts`, `get-pending-count.use-case.ts` (fuente del badge 'pendientes') |
| `src/features/shell/infrastructure/` | `menu.config.ts` (menú de Secretaría, 5 entradas, y `StaticMenuConfigAdapter`); `auth-session-roles.adapter.ts` (`AuthSessionRolesAdapter`, implementa `SessionRolesPort` con `AuthFacade`); `pending-count-mock.adapter.ts` (valor fijo configurable con `PENDING_COUNT_MOCK_VALUE`, 6 por defecto); `pending-count-http.adapter.ts` (`GET /secretaria/pendientes`, cuenta las filas; FALTA en backend, no se registra todavía) |
| `src/features/shell/shell.providers.ts` | `SHELL_PROVIDERS`: `PendingCountPort` → mock. Se registra en las rutas de la sección en T13 |
| `src/infrastructure/api/endpoints.constant.ts` | `ENDPOINTS.SECRETARIA.PENDIENTES` |
| `src/shared/ui/` | `stage-bar`, `page-header`, `button-group`, `tabs`, `filter-bar`, `data-table`, `status-chip`, `states`, `undo-toast` (servicio, componente y host), `dialog`, `inline-panel` |
| `src/app/app.component.ts` | Monta `<app-undo-toast-host />` una sola vez, junto al `router-outlet` |
| `src/styles/_tokens.scss` | Variables CSS de la §3 de spec-ui |

Pendientes de crear: `src/features/shell/presentation/app-shell/` (T13).

### application — rol activo

- Rol por defecto: el último guardado en localStorage (lectura y escritura dentro de try/catch), si sigue siendo válido para el usuario.
- Si no, el de mayor prioridad: `SECRETARIA` > `PRESIDENTE` > `EVALUADOR` > `INVESTIGADOR`.
- Los códigos que el VO no reconoce (`ADMIN_TI`, `PRESIDENTA`…) se ignoran sin lanzar error.

### presentation — notas de los componentes

- `FilterBar` recuerda los filtros por `viewKey` en memoria y no emite `changed` al cambiar de vista: la pantalla lee `state()`. Los filtros se pierden al recargar.
- `StatusTone` vive en `shared/ui/status-chip`, porque es de presentación y no de dominio.
- `DataTable` muestra los estados con esta prioridad: cargando > error > vacío > datos.
- `PageHeader` usa el input `heading` y no `title`.
- `UndoToast`: `UndoToastService.show({ message, undo?, duration?, tone? })`, un aviso a la vez (el nuevo reemplaza al anterior), 5 s por defecto. `tone` (`success` | `error` | `info`) existe para conservar el tipo de `notify()`. La región `role="status"` del host está siempre en el DOM.
- `notification.service`: misma firma pública. `notify()` usa `UndoToast` (4 s, como antes); `confirm()` sigue con `MatDialog` y un TODO para migrar a `Dialog` sección por sección.
- `Dialog` (solo acciones irreversibles) e `InlinePanel`: `open` es un `model()`. Cancelar o Esc cierran; Confirmar solo emite `confirmed` y la pantalla decide cuándo cerrar. `Dialog` usa `cdkTrapFocus` con `autoCapture` (foco atrapado y devuelto al abrir/cerrar).

### Excepciones conocidas a las reglas de capas

- `AuthSessionRolesAdapter` importa `AuthFacade` de `features/auth` (regla 5 del README). Está aislado en infrastructure y se corrige cuando `AuthFacade` pase a `core`.
- T15 debe permitir solo esta excepción.

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

Línea base: **579 pruebas**.

## 7. Calidad

- `lint` con `--max-warnings 76`, que se baja en cada PR. Los archivos nuevos no agregan advertencias.

## 8. Pendientes

- **ADMIN, ADMIN_TI y PRESIDENTA** aparecen en los guards además de los 4 roles. ¿ADMIN y ADMIN_TI siguen existiendo o los absorbe SECRETARIA? ¿PRESIDENTA es alias de PRESIDENTE? Hoy, por ejemplo, `audit/logs` y `notifications/templates` son solo para `ADMIN`. Confirmar y llevarlo a HU-001 del backend.
- **Consecuencia:** un usuario que solo tenga `ADMIN`, `ADMIN_TI` o `PRESIDENTA` no tiene rol activo. Esto bloquea T07 y T13.
- **Selector de rol activo** para quien tiene varios roles: queda con la regla de §2 (application — rol activo). Propuesta por confirmar.

**Decisión tomada:** el armazón va en `features/shell`.

### PR de F00

| PR | Rama | Tareas | Estado |
|---|---|---|---|
| F00a | `feat/f00-base` | T01–T06b, T08–T12, T14b, T15 | 🔲 Pendiente |
| F00b | `feat/f00b-shell` (desde `dev`, después del merge de F00a) | T07, T13, T14, T16 | 🔲 Bloqueado (HU-001: ADMIN, ADMIN_TI, PRESIDENTA) |

**Propuesta fuera de F00:** un PR `chore/gitattributes` con `* text=auto eol=lf` (hoy no hay `.gitattributes` y cada máquina depende de su `core.autocrlf`).

## 9. Mapa de equivalencias

Búsqueda hecha el 28/10/2026 con `grep -rn` sobre `src/`, excluyendo el código nuevo (`src/shared/ui`, `src/features/shell`).
Clasificación: **(a)** no había nada equivalente · **(b)** existe y el nuevo lo reemplaza · **(c)** existe y debió reutilizarse.

| Pieza nueva | Equivalente actual (ruta) | Clasificación | Acción |
|---|---|---|---|
| `Dialog` | `shared/components/confirm-dialog` (vía `NotificationService.confirm()` y `user-management.page.ts`) | (b) | Migrar sección por sección (TODO en `notification.service`); retirar `ConfirmDialogComponent` cuando no tenga usos (T14d, propuesta) |
| `Dialog` | `shared/components/conflict-dialog` (`resolution-generator.page.ts`), `shared/components/session-expired-dialog` (`error.interceptor.ts`) | (a) | Propósito distinto (avisos del sistema). Se mantienen |
| `Dialog` | 13 diálogos propios con `MatDialog` (`assign-peers-modal`, `modal-reasignacion`, `extend/suspend-role-dialog`, `otp-verification`…) | (a) | Son formularios, no confirmaciones. Se revisan al reemplazar cada pantalla |
| `UndoToast` | `infrastructure/services/notification.service.ts` (`notify()`) | (b) | Ya reemplazado por dentro en T11 (`notify()` → `UndoToastService`) |
| `UndoToast` | `MatSnackBar` directo: 39 archivos, 167 llamadas a `snackBar.open(` | (b) | Se retira al reemplazar cada pantalla (F01–F08); las que sobrevivan, T14c (propuesta) |
| `StatusChip` | `shared/utils/protocol-ui.util.ts` (`ProtocolUI.label/class`, `EstadoUIMap`) + pipes `protocolStatusLabel` / `protocolStatusClass` | **(c)** | `StatusChip` debe tomar el texto de `ProtocolUI.label` y el tono de `ProtocolUI.class` (pending→ámbar, review→azul, approved→verde, rejected→rojo) en vez de un mapeo nuevo. Corrección en prompt aparte (T14b, propuesta) |
| `StatusChip` | `.status-badge` global en `src/styles/styles.scss` (hex sueltos) y clases locales `.status-chip`, `.badge-status` | (b) | Retirar `.status-badge` cuando no tenga usos (T14b, propuesta) |
| `StageBar` | `protocols/presentation/pages/protocol-workspace/protocol-workspace.component.ts` (`progress-scaffold`, 4 pasos con `isStepActive`/`isStepCompleted`) | (b) | Reemplazar en el espacio del protocolo (F02, propuesta) cuando el backend exponga `etapa` |
| `StageBar` | Timelines de historial: `detalle-protocolo.page.ts`, `audit/protocol-trail.page.ts`; `mat-stepper` en formularios (`register`, `nuevo-protocolo`, `protocol-form`, `adverse-event-form`) | (a) | Propósito distinto (historial y asistentes de formulario) |
| `DataTable` | `mat-table` en 14 archivos (`workflow-table`, `peer-risk-pending-table`, `protocols/components/protocol-list.page.ts`, `protocol-reception-new`, `evaluation-list`, `user-table`…) y `<table>` en 19 | (b) | Cada lista se reemplaza en su sección (F01–F08). `DataTable` no tiene orden ni paginación; 2 archivos usan `mat-paginator` |
| `FilterBar` | Búsquedas propias en `dashboard-secretaria` (`SecretariatDashboardService.searchQuery`), `protocol-reception-new`, `user-management`, `calls-management`, `template-management`, `evaluator-load` | (b) | Se reemplazan con cada pantalla |
| `PageHeader` | Encabezados propios (`page-header`, `ops-header`, `header-section`…) en 31 archivos | (b) | Se reemplazan con cada pantalla |
| `ButtonGroup` | `view-selector` / `selector-btn` en `dashboard-secretaria.page.ts` | (b) | F01 |
| `Tabs` | `mat-tab-group` / `MatTabsModule` en 7 archivos (`protocol-workspace`, `protocol-detail-tab`, `protocol-validation-list`, `detalle-protocolo`, `subsanacion`, `notifications-center`, `protocols/components/protocol-detail.page.ts`) | (b) | Dentro del protocolo, F02–F07; fuera del protocolo pasan a `ButtonGroup` |
| `InlinePanel` | `mat-expansion-panel` en `audit-logs`, `sidebar`, `subsanacion` | (a) | Acordeones, propósito distinto |
| `Stage` VO | `domain/enums/protocol-status.enum.ts`, `domain/catalogs/estado.catalog.ts` + `estado.alias.ts` (estados, no etapas) | (a) | No existía el concepto de etapa. Los pasos de `protocol-workspace` se retiran con `StageBar` (F02) |
| `Role` VO | Cadenas de rol sueltas en `data.roles` de las rutas (`ADMIN`, `ADMIN_TI`, `PRESIDENTA`…), `verificado.guard.ts` (`adminRoles`), `dashboard-home.page.ts` (`userRole` por `user.rol`) | (a) | No había un tipo central. Las cadenas se migran en T07 (bloqueado) y T13 |
| `menu.config` + `GetMenuForRoleUseCase` | `AuthFacade.menuConfig()` + `shared/constants/menu-ui.config.ts` + `dashboard/presentation/components/sidebar` | (b) | T13 conecta el nuevo, T14 retira el viejo |
| `ActiveRoleFacade` | `AuthFacade.getActiveRoles()` (roles vigentes, sin selección) | (a) | No existía un rol elegido. Se reutiliza `getActiveRoles()` vía `AuthSessionRolesAdapter` |
| `ActiveRoleFacade` | `dashboard-home.page.ts`: `userRole` usa solo el rol primario (`user.rol`) | (b) | Se retira con `DashboardPage` (T14) |
| `role.guard` (T07) | `infrastructure/guards/role.guard.ts` | (b) | T07 lo adapta (bloqueado por HU-001) |
| — | `shared/directives/permissions.directive.ts` (`appHasPermission`): 0 usos | (b) | T14 |
| `PendingCountPort` | `SecretariatDashboardService.metrics` (`pendingReception`, `observed`, `overdue`, `slaRisk` calculados en el frontend) | (b) | Se retira con `dashboard-secretaria` en F01 (Mis pendientes) |
| `PendingCountPort` | `notifications-center.page.ts` (`matBadge` de no leídas) | (a) | Propósito distinto |
| `_tokens.scss` | `src/styles/_variables.scss` (variables Sass con hex) | (b) | Conviven; lo nuevo usa tokens y lo viejo se migra al reemplazar pantallas |

## 10. Duplicados temporales

| Qué convive | Por qué | Tarea que lo retira | PR |
|---|---|---|---|
| Menú viejo (`AuthFacade.menuConfig()` + `menu-ui.config.ts` + `sidebar`) y `menu.config` nuevo | `AppShell` todavía no existe | T13 (conecta) + T14 (retira) | PR F00 (`feat/f00-base`) |
| Filtro `OUT_OF_SCOPE_MENU_PERMISSIONS` en `AuthFacade.menuConfig()` (T01b) | Ocultar seguridad y enmiendas mientras vive el menú viejo | T14 | PR F00 |
| `role.guard` con cadenas de rol y `Role` VO | T07 bloqueado por HU-001 | T07 | PR F00 (si se desbloquea) |
| `permissions.directive.ts` sin usos | Código muerto | T14 | PR F00 |
| `dashboard/presentation/dashboard-routing.module.ts` sin referencias | Código muerto (las rutas vivas están en `dashboard/routes.ts`) | **T14 (propuesta: agregarlo a T14)** | PR F00 |
| `ConfirmDialogComponent` (`NotificationService.confirm()`) y `Dialog` | La firma de `confirm()` se mantiene para no romper pantallas | **T14d (propuesta):** retirar `ConfirmDialogComponent` cuando `confirm()` no tenga llamadas | PR de la última sección que lo use |
| `MatSnackBar` directo (167 llamadas) y `UndoToast` | Las pantallas viejas lo usan directo | Cada sección F01–F08; **T14c (propuesta)** para las que no se reemplazan (auth, perfil…) | PR de cada sección |
| `ProtocolUI` + `.status-badge` y `StatusChip` | `StatusChip` no reutiliza `ProtocolUI` (clase (c)) | **T14b (propuesta):** tono derivado de `ProtocolUI.class`, y retirar `.status-badge` sin usos | PR F00 o F01 |
| `progress-scaffold` de `protocol-workspace` y `StageBar` | El backend no expone `etapa` (RF-EST.2) | **F02 (propuesta)** | PR F02 |
| `SecretariatDashboardService.metrics` y `PendingCountPort` | El KPI está oculto (T01b) pero el servicio sigue calculando | F01 (Mis pendientes) | PR F01 |
| Listas con `mat-table`, buscadores y encabezados propios, y `DataTable`, `FilterBar`, `PageHeader` | Las pantallas se reemplazan una sección a la vez | Cada sección F01–F08 (README §3 regla 5) | PR de cada sección |
| Código de `features/security`, `features/amendments`, `deadlines-radar`, `kpi-panel`, `audit-feed` | Rutas redirigidas en T01b; el código se borra después | **F08 (propuesta de tarea en F08-configuracion-y-reportes)** | PR F08 |
| `_variables.scss` y `_tokens.scss` | Migración gradual de estilos | Cada sección, al reemplazar sus pantallas | PR de cada sección |

## 11. Pantallas actuales a verificar en cada PR

Fuente: `app.routes.ts`, `dashboard/routes.ts` y los `routes.ts` de cada feature. Todo cuelga de `/dashboard` (`DashboardPage`, `AuthGuard`).
Las rutas con `data.permissions` dependen de los permisos que el backend asigne al rol; aquí se ubican por el rol que normalmente los tiene.

**Secretaría**
- `/dashboard/home` (`DashboardSecretariaPage` cuando `user.rol === 'SECRETARIA'`), `/dashboard/profile`
- `/dashboard/admin/users` (permiso `USUARIOS_VER`), `/dashboard/admin/templates` (`CONFIG_PLANTILLAS`)
- `/dashboard/protocols/list`, `/dashboard/protocols/workspace/:id/{info|validation|evaluation|follow-up}`, `/dashboard/protocols/validation/list`, `/dashboard/protocols/reception/new`
- `/dashboard/evaluations/assignment`, `/dashboard/evaluations/reassignment/:protocolId`, `/dashboard/evaluations/reassign/:id`, `/dashboard/evaluations/consolidation/:id`, `/dashboard/evaluations/subsanaciones`
- `/dashboard/resolutions/calls`, `/dashboard/resolutions/generator` (roles `SECRETARIA`, `PRESIDENTE`, `ADMIN_TI`)
- `/dashboard/follow-up/adverse-events`, `/dashboard/follow-up/adverse-events/new`, `/dashboard/renewals/request`
- `/dashboard/reports/{stats|msp|custom}` (roles `SECRETARIA`, `PRESIDENTE`, `ADMIN_TI`)
- `/dashboard/audit/trail/:id`, `/dashboard/notifications/center`
- `/dashboard/investigador/*` (las rutas del investigador también admiten `SECRETARIA`)

**Evaluador**
- `/dashboard/home`, `/dashboard/profile`, `/dashboard/notifications/center`
- `/dashboard/evaluations/list`, `/dashboard/evaluations/evaluate/:id`, `/dashboard/evaluations/evaluate-risk/:id`
- `/dashboard/protocols/workspace/:id/evaluation`

**Presidente**
- `/dashboard/home`, `/dashboard/profile`, `/dashboard/notifications/center`
- `/dashboard/resolutions/calls`, `/dashboard/resolutions/generator`
- `/dashboard/reports/{stats|msp|custom}`, `/dashboard/audit/trail/:id`
- `/dashboard/admin/ai-assistant` (roles `ADMIN_TI`, `PRESIDENTE`)

**Investigador**
- `/dashboard/home`, `/dashboard/profile`, `/dashboard/notifications/center`
- `/dashboard/investigador/{nuevo-protocolo|mis-protocolos|protocolo/:id/editar|protocolo-legacy/:id|evento-adverso/:id|renovacion/:id}`
- `/dashboard/investigador/protocolo/:id` → redirige a `/dashboard/protocols/workspace/:id/info`

**Fuera de los 4 roles** (se verifican igual): `/dashboard/audit/logs` y `/dashboard/notifications/templates` (rol `ADMIN`); `/auth/{login|register|confirm-email|setup-account|forgot-password|reset-password}`.

**Redirigidas en T01b** (deben llevar a `/dashboard/home`): `/dashboard/admin/security`, `/dashboard/amendments`, `/dashboard/investigador/enmienda/:id`.
