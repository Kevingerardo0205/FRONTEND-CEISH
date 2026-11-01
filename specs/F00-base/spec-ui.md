# F00 · Base del rediseño — spec-ui

**Versión:** 0.2 · **Fecha:** 31/10/2026 · **Rama:** `feat/f00b-shell`
**Cubre:** spec-001 RF-EST.1, RF-EST.2, RF-EST.3 y HU-001 (roles fijos) · spec-003 RF-ALR.f (solo la entrada del menú)
**Actualización 31/10/2026:** F00b se limita al módulo de la SECRETARIA (decisiones D1, D3, D4, D6 y D7).

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
| PRESIDENTE | Se define en su sección (fuera de F00) |
| EVALUADOR (+ perfil) | Se define en su sección (fuera de F00) |
| INVESTIGADOR | Se define en su sección (fuera de F00) |

**Varios roles a la vez:** cuando la persona tiene más de un rol, el avatar muestra un **selector de rol activo**. El menú y las rutas corresponden al rol elegido. — Confirmado (spec-001 v3.5.3, HU-001 resuelto por backend TSK-001.1c, 31/10/2026).

**Selector de rol activo:**
- Solo aparece si la persona tiene más de un rol.
- Al cambiar de rol, se recarga el menú y se navega al inicio de ese rol.
- El rol inicial sigue la regla de `plan.md` §2 (application — rol activo): el último elegido si sigue siendo válido; si no, el de mayor prioridad (SECRETARIA > PRESIDENTE > EVALUADOR > INVESTIGADOR).

### Alcance de F00b (31/10/2026)

- **D1 — AppShell solo para SECRETARIA.** El `AppShell` (menú lateral y barra superior) se monta únicamente para el rol activo `SECRETARIA`. `PRESIDENTE`, `EVALUADOR` e `INVESTIGADOR` siguen con `DashboardPage` y su menú actual, sin cambios, hasta que se defina su sección.
- **D3 — Inicio por rol.** `SECRETARIA` entra a `/pendientes` dentro del AppShell (hasta F01, la pantalla actual de la Secretaría de forma temporal). `PRESIDENTE`, `EVALUADOR` e `INVESTIGADOR` entran a `/dashboard/home`, como hoy. Al cambiar de rol activo, cada uno va a su inicio. Se implementa en T13c y T13d.

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
- Menús de Presidencia, Evaluador e Investigador: se mantienen como están hoy (`DashboardPage` y su menú actual) hasta que se definan en sus secciones. F00b solo cubre el AppShell de la Secretaría (D1).
