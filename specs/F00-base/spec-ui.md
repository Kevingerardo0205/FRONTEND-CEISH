# F00 · Base del rediseño — spec-ui

**Versión:** 0.3 · **Fecha:** 10/11/2026 · **Rama:** `docs/f10-menu-por-rol`
**Cubre:** spec-001 RF-EST.1, RF-EST.2, RF-EST.3 y HU-001 (roles fijos) · spec-003 RF-ALR.f (solo la entrada del menú)
**Actualización 31/10/2026:** F00b se limita al módulo de la SECRETARIA (decisiones D1, D3, D4, D6 y D7).
**Actualización 10/11/2026 (v0.3):** el menú lateral de los 4 roles se define en F10 (`specs/F10-menu-por-rol/`). D1, §2, §4 y §10 remiten a F10.

---

## 1. Alcance

Todo lo que comparten las pantallas del rediseño:
- tokens de diseño;
- el armazón de la aplicación (menú lateral y barra superior);
- la barra de 6 etapas;
- los componentes compartidos;
- las rutas y los guards por rol.

**No incluye** el contenido de ninguna sección: eso va en F01 a F08.

## 2. Roles (fijos)

Fuente: spec-001 HU-001. Los roles **no se editan** desde el sistema. Una persona puede tener más de uno.

| Rol | Entra a |
|---|---|
| SECRETARIA (incluye administración) | Todo el menú de la Secretaría |
| PRESIDENTE | Menú en F10 (spec-ui §3): Sesiones del pleno · Reportes |
| EVALUADOR (+ perfil) | Menú en F10 (spec-ui §3): Mis evaluaciones |
| INVESTIGADOR | Menú en F10 (spec-ui §3): Mis protocolos · Nuevo protocolo |

**Varios roles a la vez:** cuando la persona tiene más de un rol, el avatar muestra un **selector de rol activo**. El menú y las rutas corresponden al rol elegido. — Confirmado (spec-001 v3.5.3, HU-001 resuelto por backend TSK-001.1c, 31/10/2026).

**Selector de rol activo:**
- Solo aparece si la persona tiene más de un rol.
- Al cambiar de rol, se recarga el menú y se navega al inicio de ese rol. **Nota (10/11/2026):** hoy solo el menú del AppShell cambia con el rol activo; el de `DashboardPage` se arma con los permisos de todos los roles y no cambia. Se corrige en F10 (T10-2).
- Mientras existan los dos layouts (D1), el selector vive en el avatar del AppShell y también en el menú de avatar de `DashboardPage`, para que quien cambie a PRESIDENTE, EVALUADOR o INVESTIGADOR pueda volver a SECRETARIA (T13c, 02/11/2026).
- El rol inicial sigue la regla de `plan.md` §2 (application — rol activo): el último elegido si sigue siendo válido; si no, el de mayor prioridad (SECRETARIA > PRESIDENTE > EVALUADOR > INVESTIGADOR).
- Implementado. Caso real confirmado por el usuario (03/11/2026): la Presidenta tiene PRESIDENTE + EVALUADOR (preside y también evalúa protocolos). Pendiente de validar con ella y con la Secretaría: si prefiere cambiar de rol con el selector o ver todo junto, con qué rol entra primero, y si hay otras personas del comité con dos roles. Se define al diseñar la sección de Presidencia.

### Alcance de F00b (31/10/2026)

- **D1 — AppShell solo para SECRETARIA.** El `AppShell` (menú lateral y barra superior) se monta únicamente para el rol activo `SECRETARIA`. `PRESIDENTE`, `EVALUADOR` e `INVESTIGADOR` siguen con `DashboardPage` y su menú actual, sin cambios, hasta que se defina su sección. **Actualización 10/11/2026:** el layout sigue así, pero su menú pasa a la configuración por rol activo de F10 (D8 de F10, T10-2); el layout único es T10-5.
- **D3 — Inicio por rol.** `SECRETARIA` entra a `/pendientes` dentro del AppShell (hasta F01, la pantalla actual de la Secretaría de forma temporal). `PRESIDENTE`, `EVALUADOR` e `INVESTIGADOR` entran a `/dashboard/home`, como hoy. Al cambiar de rol activo, cada uno va a su inicio. Se implementa en T13c y T13d.

### Inicio por rol activo (T13d, 03/11/2026)

- **D12 — Sin acceso, vuelve al inicio del rol activo.** `RoleGuard`, `AuthGuard`, `VerificadoGuard` y el 403 de `error.interceptor` mandan a `ROLE_HOME[rol activo]`. Sin rol activo (sesión sin un rol reconocido): `/auth/login` con el aviso "Su cuenta no tiene un rol vigente."
- **D13 — Login y ruta raíz.** El login lleva a `ROLE_HOME[rol activo]`. Las rutas `''` y `**`: con sesión, `ROLE_HOME[rol activo]`; sin sesión, `/auth/login`.
- **D14 — Layout actual con el rol activo.** En `DashboardPage`, la etiqueta del avatar y el asistente usan el rol activo (etiqueta del VO `Role`). `DashboardHomePage` elige su contenido con el rol activo, no con `user.rol`. El retiro sigue en T14.
- **D15 — El rol activo existe en la primera navegación.** Al recargar y justo después del login, los guards ven el rol activo correcto. Se confirmó que llegaba tarde y se corrigió en el puerto de roles y en el facade (T13d-0).

## 3. Tokens de diseño

| Token | Valor | Uso |
|---|---|---|
| `--c-primary` | `#3F51B5` | Acción principal, botón activo |
| `--c-primary-dark` | `#303F9F` | Hover, texto sobre fondo claro |
| `--c-primary-soft` | `#E8EAF6` | Fondo del elemento activo del menú y de chips informativos |
| `--c-brand` | `#0F2A4A` | Logo, avatar |
| `--c-bg` | `#F8FAFC` | Fondo de la página |
| `--c-surface` | `#FFFFFF` | Tarjetas, tablas |
| `--c-border` | `#E2E8F0` | Bordes |
| `--c-text` | `#0F172A` | Títulos |
| `--c-text-2` | `#475569` | Texto secundario |
| Tonos de estado | verde `#DCFCE7/#166534` · ámbar `#FEF3C7/#92400E` · rojo `#FEE2E2/#991B1B` · azul `#E8EAF6/#303F9F` · gris `#F1F5F9/#334155` | `StatusChip` |
| Tipografía | Roboto (contenido) · Outfit (menú) | |
| Radios | 10 px (controles) · 16 px (tarjetas) | |
| Alto mínimo | 44 px en botones de acción · 40 px en filtros y botones de grupo | Accesibilidad |

## 4. Armazón (AppShell)

- **Menú lateral de la Secretaría** (5 entradas): Mis pendientes (con contador) · Protocolos · Convocatorias · Reportes · Configuración. Abajo: Cerrar sesión.
- **Barra superior:** búsqueda global de protocolos (código o título), notificaciones y avatar con el selector de rol.
- El elemento activo del menú se resalta con `--c-primary-soft`.
- El menú sale de una **configuración por rol**. No va escrito en el HTML.
- **D1 (31/10/2026):** este armazón aplica solo al rol activo `SECRETARIA`. Los otros tres roles conservan `DashboardPage` y su menú actual hasta su sección.
- **F10 (10/11/2026):** las opciones de los 4 roles, la regla "ninguna opción lleva a una página que no existe", los íconos decorativos y "Cerrar sesión" en gris están en `specs/F10-menu-por-rol/spec-ui.md`. La Secretaría conserva estas 5 entradas (D1 de F10).
- **D7 (31/10/2026):** la búsqueda global se oculta hasta que exista el endpoint; la campana lleva a `notifications/center`, y el contador de no leídas solo se muestra cuando ya exista una fuente. Se implementa en T13b.

## 5. Componentes compartidos

| Componente | Qué hace | Reglas |
|---|---|---|
| `StageBar` | Barra de 6 etapas: Recepción → Asignación → Evaluación (incluye riesgo) → Resolución → Seguimiento → Renovación | Recibe la etapa actual tal como la devuelve el backend (RF-EST.2). Marca ✓ las anteriores. **No calcula la etapa.** |
| `PageHeader` | Título, subtítulo y **una sola acción principal** con su texto de ayuda | La acción se deshabilita mostrando el motivo (por ejemplo, "Falta revisar 1 documento"). |
| `ButtonGroup` | Fila de botones rellenos para cambiar de vista dentro de un módulo (etapas, secciones de Configuración, reportes) | Sin contadores. Un solo botón activo. |
| `Tabs` | Pestañas subrayadas | **Solo dentro del espacio de un protocolo.** |
| `FilterBar` | Búsqueda + filtros propios de la vista | Recuerda los filtros de cada vista al cambiar de botón. |
| `DataTable` | Tabla con encabezado gris, filas clicables y columna de estado | Estados vacío, cargando y error incluidos. Desplazamiento horizontal en pantallas angostas. |
| `StatusChip` | Etiqueta de estado con 5 tonos | El color nunca va solo: siempre lleva texto. |
| `UndoToast` | Aviso de éxito con **Deshacer** | Reemplaza los diálogos "¿Está seguro?" en acciones reversibles. |
| `Dialog` | Ventana flotante (por ejemplo, Tomar lista, Invitar usuario) | Foco atrapado, se cierra con Esc y tiene un botón principal. |
| `InlinePanel` | Panel que se abre dentro de una tarjeta (por ejemplo, Corregir decisión) | |
| `EmptyState` / `ErrorState` / `LoadingState` | Estados de carga | Mensaje en lenguaje del comité, no técnico. |

## 6. Reglas de interacción

1. **Una acción principal por pantalla.** Las demás acciones van como botones secundarios o enlaces.
2. **Deshacer en lugar de confirmar** para lo reversible. Para lo irreversible (enviar un correo oficial, firmar) se usa un `Dialog` de confirmación que explica la consecuencia.
3. Lenguaje del comité: "Validar", "Asignar", "Emitir". Nunca códigos internos.
4. Los colores de estado siempre van acompañados de texto.
5. Todo es usable con teclado. El foco es visible.

## 7. Rutas

| Ruta | Pantalla | Sección |
|---|---|---|
| `/pendientes` | Mis pendientes (inicio de la Secretaría) | F01 |
| `/protocolos` · `/protocolos?etapa=…` | Protocolos con botones por etapa | F01 |
| `/protocolos/:id/{recepcion\|evaluacion\|resolucion\|seguimiento\|renovacion\|recorrido}` | Espacio del protocolo. En `evaluacion` van dos vistas: "Evaluadores y dictámenes" y "Riesgo" | F02–F07 |
| `/convocatorias` · `/convocatorias/:id/sesion` | Convocatorias y sesión del pleno | F04 |
| `/reportes` | Reportes | F08 |
| `/configuracion/plazos` · `/configuracion/usuarios` | Configuración | F08 |

- Cada sección se carga de forma diferida (lazy).
- Un guard por rol protege cada ruta.
- Si alguien sin permiso entra a una ruta, vuelve a su inicio con un aviso.

**Rutas de F00b (T13d, 03/11/2026):**

- **D9 — `/dashboard/...` dentro del AppShell para la Secretaría.** Así, los enlaces a `/dashboard/...` de las pantallas de la Secretaría no la sacan del AppShell. Estructura desde T13d-3 (03/11/2026), un solo AppShell:
  - En `app.routes.ts`, un único padre `''` con `AppShellComponent`, `canMatch` por rol activo `SECRETARIA` y `AuthGuard`. Sus hijos son las rutas nuevas (D10) y `dashboard`, que carga `DASHBOARD_CHILDREN` con los redirects de D11. Al ir de `/pendientes` a `/dashboard/...` y volver, la instancia del AppShell es la misma.
  - Después, un padre `''` sin layout con las mismas rutas nuevas: con otro rol activo, su `RoleGuard` da el aviso y lleva al inicio (criterio 4).
  - Después, `dashboard` con `DashboardPage` y `AuthGuard`, para los otros roles.
- **D10 — Rutas nuevas, solo SECRETARIA.** Van bajo el AppShell, son lazy y llevan `RoleGuard` (`data.roles: ['SECRETARIA']`) más los permisos de la ruta de origen:
  - `/pendientes` → `DashboardSecretariaPage`;
  - `/protocolos` → `ProtocolValidationListPage` (temporal hasta F01);
  - `/convocatorias` → `CallsManagementPage` (`RESOLUCION_CONVOCATORIAS`);
  - `/reportes` → `StatsDashboardPage`;
  - `/configuracion` → `/configuracion/usuarios` → `UserManagementPage` (`USUARIOS_VER`). Plazos es F08.

  PRESIDENTE sigue entrando a convocatorias y reportes por `/dashboard/...`.
- **D11 — `/dashboard/home`, `/dashboard` y `/dashboard/` → `/pendientes`.** Solo con el rol activo `SECRETARIA`, y conservando los query params (`?tab=peers`). Con otros roles no cambia. En F00b no hay otros redirects sin condición.

**Roles por ruta (31/10/2026):**

- **D6:** las rutas de la Secretaría llevan `data.roles` + `RoleGuard`, además del permiso que ya tengan.
- **D4:** `audit/logs` y `audit/trail/:id` → `SECRETARIA`, `PRESIDENTE`; `notifications/templates` → `SECRETARIA`; la administración del asistente IA → `SECRETARIA`; `admin/users` y `admin/templates` → `SECRETARIA`; reportes y resoluciones → `SECRETARIA`, `PRESIDENTE`. Se retira `ADMIN_ALL` del padre de `audit` (no está en la matriz de HU-001 y cerraba la sección para todos).
- **D5:** `protocols/list`, `protocols/validation/list` y `protocols/reception/new` → `SECRETARIA`.
- Los roles de las rutas de investigador y de evaluación no cambian en F00b, salvo retirar los códigos que no existen (`ADMIN`, `ADMIN_TI`, `PRESIDENTA`). Quién entra a esas rutas queda como duda abierta en `plan.md` §8. El detalle ruta por ruta está en `plan.md` §11.

## 8. Endpoints que usa F00

| Endpoint | Para qué | Estado |
|---|---|---|
| Sesión actual (usuario + roles) | Menú, guards, selector de rol | Existe (auth) — verificar que devuelva **varios** roles |
| `GET /secretaria/pendientes` | Contador del menú (cantidad de filas de pendientes) | **FALTA** (spec-003 v1.5.1, RF-ALR.f) — mientras tanto, mock (6) |
| Etapa en la respuesta de cada protocolo | `StageBar` | **FALTA** (spec-001 RF-EST.2) — mientras tanto, mapeo temporal en el adapter |

## 9. Criterios de aceptación

1. Con rol SECRETARIA, el menú muestra exactamente 5 entradas en el orden indicado, y la ruta activa queda resaltada.
2. `StageBar` con `etapa = EVALUACION` muestra Recepción y Asignación con ✓, Evaluación como actual (con sus indicadores de riesgo y dictámenes) y el resto pendiente.
3. Un usuario con 2 roles ve el selector de rol activo; al cambiar de rol cambian el menú y la ruta de inicio.
4. Una ruta de Secretaría abierta con el rol INVESTIGADOR redirige a su inicio y muestra un aviso.
5. `UndoToast`: al pulsar Deshacer se llama a la acción inversa y el aviso desaparece.
6. `DataTable` muestra los estados vacío, cargando y error sin romper el diseño.
7. Ningún archivo de `presentation` importa `HttpClient` ni un adapter (lo comprueba una regla de lint o una prueba de arquitectura).
8. Selector de rol: un usuario con un solo rol no ve el selector. Un usuario con SECRETARIA y EVALUADOR, sin elección guardada, entra como SECRETARIA; si antes eligió EVALUADOR, entra como EVALUADOR. Al cambiar a SECRETARIA ve el menú de Secretaría y queda en `/pendientes`.

## 10. Pendientes

- Selector de rol activo para usuarios con varios roles: **confirmado** (spec-001 v3.5.3, HU-001 resuelto, 31/10/2026; ver §2).
- **ADMIN_TI y PRESIDENTA: resuelto (31/10/2026).** `ADMIN_TI` fue absorbido por `SECRETARIA` y retirado del backend; `PRESIDENTA` no existe. Solo hay 4 roles (ver §2). Las cadenas sueltas se retiran de las rutas en T13a.
- Menús de Presidencia, Evaluador e Investigador: se mantienen como están hoy (`DashboardPage` y su menú actual) hasta que se definan en sus secciones. F00b solo cubre el AppShell de la Secretaría (D1). **Resuelto (10/11/2026):** se definen en F10 (`specs/F10-menu-por-rol/`).
