# F00 · Base del rediseño — plan

**Estilo:** capas + Clean Architecture (ADR-001) · **Angular 20:** componentes standalone, signals, `ChangeDetectionStrategy.OnPush`
**Ojo:** las rutas de carpetas están basadas en la estructura conocida (`src/features/...`, `src/core`, `src/shared`). **Verificarlas con el inventario de solo lectura antes de empezar.**

---

## 1. Dónde va cada cosa (por capa)

```text
src/
├── core/                                   ← singleton, una sola vez en la app
│   ├── auth/                               (reutilizar: sesión, interceptores, guards existentes)
│   ├── layout/app-shell/                   ← NUEVO: AppShell (menú lateral + barra superior)
│   └── navigation/
│       ├── domain/menu-item.entity.ts      ← NUEVO
│       ├── domain/role.vo.ts               ← NUEVO: SECRETARIA | PRESIDENTE | EVALUADOR | INVESTIGADOR (fijos)
│       ├── application/get-menu-for-role.use-case.ts   ← NUEVO: rol → lista de entradas
│       ├── application/active-role.facade.ts           ← NUEVO: rol activo (signal) + cambio de rol
│       └── infrastructure/menu.config.ts   ← NUEVO: configuración del menú por rol (datos, no HTML)
├── shared/
│   ├── domain/
│   │   ├── stage.vo.ts                     ← NUEVO: las 7 etapas con su orden y su etiqueta
│   │   └── status-tone.vo.ts               ← NUEVO: verde | ambar | rojo | azul | gris
│   ├── ui/                                 ← NUEVO: componentes de presentación sin lógica de negocio
│   │   ├── stage-bar/ · page-header/ · button-group/ · tabs/ · filter-bar/
│   │   ├── data-table/ · status-chip/ · undo-toast/ · dialog/ · inline-panel/
│   │   └── states/ (empty, error, loading)
│   └── styles/_tokens.scss                 ← NUEVO: variables CSS de la §3 de spec-ui
└── features/<seccion>/{domain,application,infrastructure,presentation}   ← F01–F08
```

## 2. Capa por capa

### domain
- `Stage` (VO): los 7 valores, `order` (1–7) y `label`.
  - `Stage.fromBackend(code)` acepta solo los 7 códigos. Un código desconocido lanza un error controlado.
  - **No** deduce la etapa a partir del estado: eso lo hace el backend (RF-EST).
- `Role` (VO): los 4 roles fijos. No existe un modelo de "permiso editable".
- `MenuItem`: `{ id, label, route, roles: Role[], badge?: 'pendientes' }`.

### application
- `GetMenuForRoleUseCase(role) → MenuItem[]`: filtra la configuración por rol.
- `ActiveRoleFacade`:
  - expone `activeRole` (signal) y `availableRoles`;
  - `switchRole(role)` navega al inicio de ese rol;
  - guarda la última elección (localStorage, con try/catch).
- `GetPendingCountUseCase`: depende del port `PendingCountPort`.

### infrastructure
- `menu.config.ts`: el menú de la Secretaría con 5 entradas (los demás roles se agregan en su sección).
- `PendingCountHttpAdapter` → `GET /secretaria/pendientes` (**FALTA en el backend**). Mientras tanto, `PendingCountMockAdapter` detrás del mismo port.
- Adapter de protocolo: si el backend todavía no devuelve `etapa`, se usa un **mapeo temporal estado→etapa** en el mapper, marcado `// TODO RF-EST.2` y cubierto por pruebas. Se elimina cuando el backend lo exponga.

### presentation
- `AppShellComponent`:
  - usa `GetMenuForRoleUseCase` y `ActiveRoleFacade`;
  - el `router-outlet` va dentro.
- Componentes de `shared/ui` con entradas y salidas tipadas (`input()`, `output()`). Sin servicios inyectados, salvo `UndoToastService` en core.
- **Rutas** (`app.routes.ts`):
  - cada sección con `loadChildren` y los `providers` que registran port → adapter;
  - un `roleGuard(roles)` funcional.

## 3. Qué se reutiliza, reemplaza o retira (a confirmar con el inventario)

| Actual | Acción | Motivo |
|---|---|---|
| Interceptores HTTP, `authFacade`, `RoleGuard`, `VerificadoGuard` | **Reutilizar** | Ya funcionan y tienen pruebas. Ajustar `RoleGuard` a varios roles + rol activo. |
| `sidebar.component.ts` (dashboard) | **Reemplazar** por `AppShell` | Menú nuevo de 5 entradas, configurado por rol. |
| Layout o shell actual del dashboard | **Reemplazar** | |
| Diálogos de roles temporales (extender, suspender rol) | **No tocar en F00**. Se decide en F08 según el pendiente de las suplencias. | |
| Componentes Material sueltos (tablas, chips) | Envolverlos o reemplazarlos con `shared/ui` | Un solo estilo. |

## 4. Pruebas

| Capa | Qué se prueba |
|---|---|
| domain | `Stage.fromBackend` (7 códigos y uno inválido), orden y etiquetas; `Role` |
| application | `GetMenuForRoleUseCase` (Secretaría = 5 entradas en orden); `ActiveRoleFacade` (cambio de rol y localStorage que falla) |
| infrastructure | Mapper temporal estado→etapa; adapter de pendientes (mock y HTTP con `HttpTestingController`) |
| presentation | `StageBar` (✓, actual, pendiente); `AppShell` (menú por rol, ruta activa); `UndoToast`; `DataTable` (vacío, cargando, error); `roleGuard` (redirige y avisa) |
| arquitectura | Prueba o regla de lint: `presentation/**` no importa `HttpClient` ni `infrastructure/**`; `domain/**` no importa `@angular/*` |

## 5. Calidad

- Antes de empezar: merge de `chore/format-prettier` a `dev`.
- En `lint`, `--max-warnings` = número actual (76) y se baja en cada PR. Los archivos nuevos no agregan advertencias.
- Formularios reactivos: `disabled` se define en el `FormControl`, no con el atributo del HTML.
- Las librerías de PDF (`jspdf`, `html2canvas`) siguen cargándose de forma diferida.

## 6. Riesgos

- El backend todavía no expone `etapa` ni `/secretaria/pendientes` → se usan mocks detrás de los ports, sin bloquear el avance.
- El cambio de `RoleGuard` a varios roles puede afectar rutas actuales → se cubre con las pruebas existentes de `role.guard.spec`.
