# F01 · Mis pendientes y Protocolos — spec-ui

**Versión:** 0.1 · **Fecha:** 05/11/2026 · **Rama:** `docs/f01-pendientes-protocolos`
**Cubre:** spec-003 v1.5.3 RF-ALR.f (RF-ALR.f.1 a f.7) · spec-001 v3.5.6 RF-EST.1, RF-EST.2 (parcial) y RF-EST.3 (contrato de `GET /protocols`, TSK-001.4)
**Depende de:** F00 (tokens, AppShell, `shared/ui`, `Stage`, rutas por rol activo)
**Canvas:** `canvas/01-mis-pendientes.png` y `canvas/02-protocolos.png` (tablero "Pantallas Secretaría — CEISH-ESPOCH", 28/10/2026), con las decisiones C1–C7 del 05/11/2026.

---

## 1. Objetivo y alcance

Dar a la Secretaría dos pantallas reales dentro del AppShell:

- **Mis pendientes** (`/pendientes`, inicio del rol): qué tiene que hacer hoy, con la próxima reunión del pleno arriba.
- **Protocolos** (`/protocolos?etapa=…`): buscar y consultar todos los protocolos, filtrados por etapa y año, con paginación.

**Solo rol activo `SECRETARIA`.** PRESIDENTE no entra a estas rutas en F01, aunque los endpoints B y C lo admitan.

**No incluye:**
- las pantallas de cada etapa (F02–F07). Las acciones llevan a las pantallas que ya existen (§3.1);
- la búsqueda global de la barra superior (D7 de F00 sigue vigente);
- el menú lateral responsive (C8 no aprobado, ver §9);
- la retirada de `DashboardSecretariaPage` (la sigue usando `DashboardHomePage`, ver plan §8).

**Tarea previa obligatoria (T01-0):** la bandeja "Estratificación de Riesgo" deja de depender de `/pendientes?tab=peers` y pasa a una ruta propia temporal. Hasta que T01-0 esté cerrada, `/pendientes` no se reemplaza (plan §4).

## 2. Decisiones del canvas (05/11/2026)

| # | Decisión | Estado |
|---|---|---|
| C1 | "Próxima reunión" va **arriba**, como tarjeta, no como franja al pie | Aprobada |
| C2 | Protocolos: un solo control de etapa, los **botones** (con `?etapa=` en la URL). Se quita el selector "Etapa" | Aprobada |
| C3 | Fechas en `dd/MM/yyyy`; la reunión en `dd/MM/yyyy, HH:mm`; siempre en hora de Ecuador | Aprobada |
| C4 | Sin búsqueda global en la barra superior, en las dos pantallas (D7) | Aprobada |
| C5 | Sin "›" en las filas y sin la nota "Clic en una fila…" | Aprobada |
| C6 | Solo acciones reales: VALIDAR, ASIGNAR y REASIGNAR. Se quitan Ver control, Enviar y Emitir | Aprobada |
| C7 | Sin "Buenos días". Encabezado "Tiene {totales.todos} pendientes"; la fecha sale de `fechaReferencia` partiendo el texto | Aprobada |
| C8 | Menú lateral responsive | **No aprobada**: el menú sigue fijo (§9) |

## 3. Pantallas

### 3.1 Mis pendientes — `/pendientes` (canvas `01-mis-pendientes.png`)

Zonas, de arriba abajo, con C1–C7 aplicadas:

1. **AppShell** (sin cambios de F00): menú lateral de 5 entradas con el contador de "Mis pendientes" (= `totales.todos`), campana y avatar. **Sin búsqueda global** (C4).
2. **Encabezado** (`PageHeader`, sin acción principal):
   - Título: `Tiene {totales.todos} pendientes` (C7). Con 1: `Tiene 1 pendiente`. Con 0: `No tiene pendientes`.
   - Subtítulo: `Al {dd/MM/yyyy de fechaReferencia} · Empiece por los vencidos.` La fecha se arma partiendo el texto `YYYY-MM-DD` (§5.4).
   - Mientras cargan los totales, el título es `Mis pendientes`.
3. **Tarjeta "Próxima reunión"** (C1, contrato B), arriba de los filtros:
   - Línea 1: `Convocatoria N.º {numeroConvocatoria} · {Ordinaria|Extraordinaria}`.
   - Línea 2: `{fechaReunion en dd/MM/yyyy, HH:mm}`.
   - Línea 3, solo si `lugar` no es null: `{lugar.nombre}`; si `lugar.esVirtual` y `enlaceReunion` es válido, un enlace `Unirse a la reunión` (§7).
   - Línea 4: `{protocolosATratar} protocolos a tratar` (con 1: `1 protocolo a tratar`).
   - **Sin línea de informes**: `informesATratar` es siempre null y null significa "no disponible", no "cero" (RF-ALR.f.7).
   - Sin enlace "Ver convocatoria": `/convocatorias/:id` no existe hasta F04 (Duda D3).
4. **Filtros** (`ButtonGroup`, `aria-pressed`): `Todos · {todos}`, `Vencidos · {vencidos}`, `Hoy · {hoy}`, `Esta semana · {semana}`. Los conteos salen de `totales` y no dependen del filtro (RF-ALR.f.3). Hoy y Esta semana se muestran con su conteo real (hoy siempre 0, ver §9). El grupo de conteos vive en una región `aria-live="polite"`.
5. **Tabla de pendientes** (contrato A), columnas:

   | Columna | Contenido |
   |---|---|
   | Plazo | `StatusChip` según `estadoPlazo` (§5.2) |
   | Protocolo | `ceishCode` (texto pequeño, arriba) y `title` (abajo) |
   | Estado actual | `estadoActual` tal cual llega (texto legible, RF-ALR.f.1) |
   | Etapa | chip neutro con la etiqueta de `Stage` (§5.3) |
   | Acción | botón con borde, texto `accionTexto` (§3.1.1) |

   Orden: el del backend (VENCIDO, HOY, SEMANA, PROXIMO, SIN_PLAZO; luego `fechaPlazo` y `ceishCode`, RF-ALR.f.3). La UI no reordena.
   **Sin** fondo rosado en las filas vencidas: la urgencia la da la columna Plazo (color + texto).

#### 3.1.1 Acciones y destino (verificado en el código, 05/11/2026)

Todas van como botones del mismo tipo (con borde), con `aria-label="{accionTexto} {ceishCode}"` (sin `ceishCode`, solo `accionTexto`).

| `accion` | `accionTexto` (RF-ALR.f.1) | Destino | Evidencia |
|---|---|---|---|
| `VALIDAR` | Validar documentos | `/dashboard/protocols/workspace/{protocolId}/validation` | `protocols/routes.ts:23-36` (`workspace/:id` → hijo `validation` → `ProtocolValidationDetailPage`); mismo enlace en `protocol-validation-list.page.ts:151` |
| `ASIGNAR` | Asignar evaluadores | `/dashboard/evaluations/assignment` → bandeja "Estratificación de Riesgo" (ruta de T01-0) | `evaluations/routes.ts:15-22` (`AssignmentPage`); `assignment.page.ts:29` redirige hoy a la bandeja. Abre la bandeja, no el protocolo (Duda D1) |
| `REASIGNAR` | Reasignar evaluador | `/dashboard/evaluations/reassignment/{protocolId}` | `evaluations/routes.ts:24-31` (`ReassignmentPage`); lee `protocolId` en `reassignment.page.ts:83` |

Las tres rutas cuelgan de `/dashboard/...`, que para la Secretaría se carga dentro del mismo AppShell (`dashboard/routes.ts:51-57` y `111-115`, `app.routes.ts:100-104`).

**Regla:** si llega una `accion` fuera de estas tres, la fila se muestra sin botón (no se inventa un destino) y se registra con `console.warn`.

### 3.2 Protocolos — `/protocolos?etapa=…&page=…` (canvas `02-protocolos.png`)

1. **AppShell** sin búsqueda global (C4). La barra superior no repite el título de la página.
2. **Encabezado** (`PageHeader`): título `Protocolos`, sin subtítulo y sin acción principal.
3. **Botones de etapa** (`ButtonGroup`, C2): `Todos`, `Recepción`, `Asignación`, `Evaluación`, `Resolución`, `Seguimiento`, `Renovación` (etiquetas de `Stage.all()`). Sin contadores (F00 §5). El botón activo sale de `?etapa=` (`Todos` = sin parámetro). Un `?etapa=` desconocido se trata como `Todos` y se quita de la URL.
4. **Filtros** (`FilterBar`, `viewKey = 'protocolos'`):
   - `Buscar`: "Código, título o investigador". Busca en código, título, investigador principal y coinvestigadores (RF-EST.3, TSK-001.4; dato verificado). Debounce de 300 ms. Máximo 100 caracteres (`maxlength`).
   - `Año`: `Todos` (por defecto, sin `year`) y los años de 2000 al año en curso, del más reciente al más antiguo.
   - **Sin selector "Etapa"** (C2).
5. **Tabla** (contrato C), columnas:

   | Columna | Contenido |
   |---|---|
   | Protocolo | `ceishCode` (o `Sin código`) y `title` |
   | Investigador principal | `principalInvestigator.fullName` (o `Sin investigador principal`) |
   | Etapa | chip neutro con la etiqueta de `Stage` (§5.3) |

   **Sin columna Estado** (§9, Duda D4). **Sin "›"** y sin la nota "Clic en una fila…" (C5): en F01 las filas no navegan (Duda D5).
6. **Paginación:** 20 por página. Texto `Mostrando {a}–{b} de {total}`. Botones `Anterior` y `Siguiente` de al menos 44 px de alto, deshabilitados en los extremos. `page` va en la URL; al cambiar la etapa, la búsqueda o el año se vuelve a la página 1.

## 4. Contratos del backend

Todos responden con el envoltorio `{ statusCode, message, data }`. Los adapters quitan el envoltorio como `meeting-api.adapter.ts:99-107` y los mappers validan los tipos campo por campo (§7).

### A) `GET /api/secretaria/pendientes?filtro=todos|vencidos|hoy|semana` — RF-ALR.f.5

- Acceso: `SECRETARIA` con `DASHBOARD_VENCIMIENTOS` (RF-ALR.f.4). PRESIDENTE: 403. Filtro inválido: 400.
- `data`: `{ fechaReferencia: "YYYY-MM-DD", totales: { todos, vencidos, hoy, semana }, items: [ { protocolId, ceishCode, title, estadoActual, etapa, etapaOrden, fechaPlazo: ISO | null, estadoPlazo: VENCIDO|HOY|SEMANA|PROXIMO|SIN_PLAZO, accion: VALIDAR|ASIGNAR|REASIGNAR, accionTexto } ] }`.
- `estadoActual` llega como texto legible ("Recepción por validar", "Recepción completa · sin evaluadores", "En evaluación · dictamen vencido"; RF-ALR.f.1).
- `totales` no depende del filtro (RF-ALR.f.3).

### B) `GET /api/evaluations/meetings/next` — RF-ALR.f.7

- Acceso: `SECRETARIA` y `PRESIDENTE` con `RESOLUCION_CONVOCATORIAS`.
- `data`: `null` (no hay reunión) o `{ id, numeroConvocatoria, tipoSesion: ORDINARIA|EXTRAORDINARIA, fechaReunion: ISO, lugar: { nombre, esVirtual, enlaceReunion } | null, protocolosATratar, informesATratar: null }`.

### C) `GET /api/protocols?search&year&etapa&page&limit` — RF-EST.3 (TSK-001.4)

- Acceso: `SECRETARIA` y `PRESIDENTE` con `PROTOCOLOS_LISTAR`.
- `search` ≤ 100 caracteres; `year` 2000–2100; `etapa` uno de los 6 códigos; `limit` 1–100 (si no, 400).
- Respuesta: `{ data: [ { …campos existentes, etapa, etapaOrden, principalInvestigator: { id, fullName } | null } ], total, page, limit, totalPages }`. Orden `updatedAt` DESC.
- `ceishCode` puede ser null (`codigo_ceish` es nullable en el backend).

## 5. Reglas de diseño

**Registro:** producto (impeccable). La interfaz desaparece en la tarea: patrones conocidos, densidad de tabla, color solo para estado.

### 5.1 Tokens

- Colores, radios y alturas salen **solo** de `src/styles/_tokens.scss` (`--c-*`, `--tone-*`, `--radius-*`, `--min-h-*`). No se agrega ningún hex a mano.
- Tipografía de F00: Roboto en el contenido, Outfit en el menú.
- La unificación con los "Colores Institucionales ESPOCH" de `_variables.scss:3-6` queda pendiente (§9).

### 5.2 Plazo (`estadoPlazo`)

El color nunca va solo: siempre lleva texto (F00 §6.4).

| `estadoPlazo` | Tono `StatusChip` | Texto |
|---|---|---|
| `VENCIDO` | `rojo` | `Venció {dd/MM/yyyy}` |
| `HOY` | `ambar` | `Vence hoy` |
| `SEMANA` | `azul` | `Vence {dd/MM/yyyy}` |
| `PROXIMO` | `gris` | `Vence {dd/MM/yyyy}` |
| `SIN_PLAZO` | `gris` | `Sin plazo` |

- La fecha es `fechaPlazo` en hora de Ecuador (§5.4).
- `fechaPlazo` null con un `estadoPlazo` distinto de `SIN_PLAZO`: el texto es `Sin plazo` (no se inventa la fecha).

### 5.3 Etapa

- Chip con tono `gris` y la etiqueta de `Stage.fromBackend(etapa).label` (`stage.vo.ts:18-23`). El color se reserva para la urgencia.
- Una etapa desconocida (o null) muestra `Etapa no reconocida` y **no rompe la fila** (el mapper no lanza error por la etapa: la deja en null).

### 5.4 Fechas (hora de Ecuador)

- `fechaReferencia` (`YYYY-MM-DD`): se parte el texto y se arma `dd/MM/yyyy`. **No** pasa por `new Date()` (se interpretaría como UTC y en Ecuador mostraría el día anterior).
- `fechaPlazo`: `dd/MM/yyyy` en `America/Guayaquil`.
- `fechaReunion`: `dd/MM/yyyy, HH:mm` (24 h) en `America/Guayaquil`.
- Una fecha inválida muestra `Fecha no disponible`.

### 5.5 Estados por bloque

Cada bloque carga, falla y se vacía por su cuenta. Prioridad: cargando > error > vacío > datos (como `DataTable`). Si falla la reunión, la tabla sigue funcionando, y al revés.

| Bloque | Cargando | Vacío | Error |
|---|---|---|---|
| Tarjeta Próxima reunión | `LoadingState` `Cargando la próxima reunión…` | `data = null`: `EmptyState` `No hay una reunión programada.` | `ErrorState` `No pudimos cargar la próxima reunión.` + Reintentar |
| Totales y filtros | Botones deshabilitados, sin conteo | — (los conteos pueden ser 0) | Botones sin conteo; el error se muestra en la tabla (misma petición) |
| Tabla de pendientes | `LoadingState` `Cargando pendientes…` | Todos = 0: `No tiene pendientes. Los protocolos nuevos aparecerán aquí.` · Vencidos = 0: `No hay pendientes vencidos.` · Hoy = 0: `No hay pendientes para hoy.` · Esta semana = 0: `No hay pendientes para esta semana.` (con un botón `Ver todos` en los tres últimos) | `ErrorState` `No pudimos cargar sus pendientes.` + Reintentar |
| Tabla de protocolos | `LoadingState` `Cargando protocolos…` | Sin filtros: `Todavía no hay protocolos registrados.` · Con filtros: `Ningún protocolo coincide con la búsqueda.` + botón `Limpiar filtros` | `ErrorState` `No pudimos cargar los protocolos.` + Reintentar |

Los errores nunca se muestran como "sin resultados".

### 5.6 Foco, teclado y contraste (checklist de accesibilidad)

1. Todo se usa con teclado en el orden visual: filtros → tabla → paginación.
2. Foco visible de 2 px con `--c-primary` (como `app-shell.component.scss:127-129`).
3. Al entrar a cada pantalla, el foco va al `h1` (`tabindex="-1"`).
4. Los botones de filtro y de etapa usan `aria-pressed` (`ButtonGroup`).
5. Los conteos de los filtros y el texto `Mostrando a–b de N` están en regiones `aria-live="polite"`.
6. Cada botón de acción tiene `aria-label="{accionTexto} {ceishCode}"`.
7. El enlace de la reunión dice que abre otra pestaña: `aria-label="Unirse a la reunión (se abre en otra pestaña)"`.
8. Contraste AA (≥ 4,5:1 en texto normal). Pares medidos el 05/11/2026: `--c-text-2` sobre blanco 7,58:1 y sobre `--c-bg` 7,24:1; blanco sobre `--c-primary` 6,87:1; tonos de `StatusChip` entre 6,37:1 (ámbar) y 9,45:1 (gris). **No se usan** textos de color sobre blanco como el naranja o el gris claro del canvas (unos 3,2:1 y 2,6:1).
9. Alto mínimo: 44 px en botones de acción y en Anterior/Siguiente; 40 px en filtros y botones de etapa (`--min-h-filter`, decisión de F00; manda el repo sobre los 44 px de ui-ux-pro-max).
10. Las tablas llevan `caption` (oculto a la vista o visible) y `th scope="col"`.
11. `index.html` declara `lang="es"`.

## 6. Interacciones

- **Mis pendientes:** al pulsar un filtro se pide `GET /secretaria/pendientes?filtro=…`. El filtro no va en la URL en F01 (Duda D7). La acción de cada fila navega a su destino (§3.1.1).
- **Protocolos:** etapa, búsqueda, año y página van en la URL (`etapa`, `search`, `year`, `page`). Recargar o volver atrás reproduce la misma vista. Cambiar etapa, búsqueda o año pone `page=1`.
- **Contador del menú:** `totales.todos` de `GET /secretaria/pendientes` (sin mock).

## 7. Seguridad

1. Nada de `innerHTML`, `outerHTML` ni `bypassSecurityTrust*` en F01. Todo dato del backend se muestra con interpolación `{{ }}`.
2. Los mappers validan el tipo de cada campo (como `meeting.mapper.ts:164-175`, `str()` y `nullableStr()`). Un campo de texto que no es string ni null es un error de contrato, no un `[object Object]` en pantalla.
3. `enlaceReunion` se valida **en el mapper**: `new URL(valor)` dentro de `try`; solo se acepta si `protocol` es `http:` o `https:`. Si no, queda `null` y la tarjeta muestra `Enlace no disponible`.
4. El enlace se renderiza `<a [href]="enlace" target="_blank" rel="noopener noreferrer">`.
5. Los parámetros de la URL (`etapa`, `year`, `page`, `search`) se validan antes de enviarlos: etapa contra `Stage.all()`, `year` entero 2000–2100, `page` entero ≥ 1, `search` recortado y ≤ 100 caracteres. Un valor inválido se descarta.

## 8. Criterios de aceptación

1. Con rol SECRETARIA, `/pendientes` muestra Mis pendientes y `/protocolos` muestra Protocolos, dentro del AppShell.
2. Con rol INVESTIGADOR, abrir `/pendientes` o `/protocolos` lleva a su inicio con aviso (criterio 4 de F00, sin cambios).
3. `ROLE_HOME.SECRETARIA` sigue siendo `/pendientes`, y `/dashboard/home?x=1` con SECRETARIA llega a `/pendientes?x=1` (`redirectKeepingQuery`).
4. La bandeja "Estratificación de Riesgo" se abre desde su ruta propia y desde `/dashboard/evaluations/assignment`; asignar pares la recarga.
5. El encabezado dice `Tiene N pendientes` con N = `totales.todos`, y la fecha es `fechaReferencia` en `dd/MM/yyyy` (con `2026-11-04` muestra `04/11/2026` en cualquier zona horaria del navegador).
6. Los cuatro filtros muestran sus conteos de `totales`, con `aria-pressed` en el activo; al pulsar uno se pide ese `filtro` y los conteos no cambian.
7. Cada `estadoPlazo` muestra el tono y el texto de §5.2; `fechaPlazo` `2026-10-21T04:59:59.999Z` se muestra `20/10/2026`.
8. Cada fila muestra el botón de su `accion` con `aria-label="{accionTexto} {ceishCode}"` y navega al destino de §3.1.1. Una `accion` desconocida no muestra botón.
9. Una etapa desconocida muestra `Etapa no reconocida` y el resto de la fila se ve completo.
10. Tarjeta: con datos muestra convocatoria, tipo, `dd/MM/yyyy, HH:mm`, lugar y protocolos a tratar, **sin** línea de informes; con `data = null` muestra `No hay una reunión programada.`; con error muestra `ErrorState` con Reintentar y la tabla de pendientes se ve igual.
11. `enlaceReunion` `https://…` se muestra con `target="_blank"` y `rel="noopener noreferrer"`; `javascript:…` o un texto no URL queda `null` y se muestra `Enlace no disponible`.
12. Protocolos: `?etapa=EVALUACION` marca el botón Evaluación y pide `etapa=EVALUACION&page=1&limit=20`; `?etapa=XYZ` se trata como Todos.
13. La búsqueda espera 300 ms sin teclear antes de pedir; cambiar búsqueda, año o etapa vuelve a `page=1`.
14. La paginación muestra `Mostrando 21–40 de 57` en la página 2, y Anterior/Siguiente se deshabilitan en los extremos.
15. Sin resultados con filtros: `Ningún protocolo coincide con la búsqueda.` y `Limpiar filtros` deja la vista en Todos, sin búsqueda ni año, página 1.
16. Un error de `GET /protocols` muestra `ErrorState` (no "sin resultados").
17. El contador del menú muestra `totales.todos`; si la petición falla, no se muestra.
18. Ningún archivo de `presentation` o `application` de F01 importa `@angular/common/http` ni `infrastructure` (regla de eslint).
19. Ningún archivo de F01 usa `innerHTML` ni `bypassSecurityTrust*`, ni agrega colores hex.

## 9. Pendientes

- **C8 no aprobado:** el menú lateral sigue fijo (260 px, `app-shell.component.scss:9-10`, sin `@media`). En pantallas angostas las tablas se desplazan en horizontal (F00 §5). Sin tarea en F01.
- **Hoy y Esta semana siempre dan 0** con las filas actuales: solo REASIGNAR tiene plazo y siempre está vencido (RF-ALR.f.2). Se muestran con su 0 real. Pendiente de validar con la Secretaría (spec-003, pregunta 6).
- **Informes en la tarjeta:** `informesATratar` es null hasta RF-15 (spec-003 RF-ALR.f.7). No hay línea de informes.
- **Columna Estado en Protocolos:** no se muestra en F01. El contrato C trae `receptionStatus` (código de recepción) y `statusId` (estado del protocolo, null en Recepción y Asignación). El código tiene etiquetas por código (`protocol-ui.util.ts:11-24`, `ProtocolUI.label`), pero:
  - `receptionStatus` puede traer `PENDIENTE_SUBSANACION`, `EVALUACION_SUBSANACIONES` o `ARCHIVADO`, que no están en `EstadoCatalog` (`estado.catalog.ts:7-24`); `ProtocolUI.label` devolvería el código crudo (`protocol-ui.util.ts:28-30`);
  - mostrar una sola etiqueta exige elegir entre `statusId` y `receptionStatus`, que es una regla de negocio que no está en el backend.
  Ver Duda D4.
- **Colores ESPOCH:** unificar `_variables.scss` (`#003366`) con los tokens de F00 (`--c-primary #3f51b5`).
- **Deuda sin tarea en F01:** los 18 `window.open(res.downloadUrl, '_blank')` sin validar la URL ni `noopener`; `BaseApiService.handleError` (`base-api.service.ts:41-53`) asume errores de Axios; `ErrorInterceptor` convierte el error en `new Error(message)` y pierde el código de estado (`error.interceptor.ts:153-155`).
- **Bug "[object Object]" del tablero "Validar documentos":** ese tablero no está en `canvas/`, así que no se verificó en imagen. En el código, `protocol-validation-detail.page.ts:359` interpola `item.observations`. F01 lo evita con mappers que validan tipos; la pantalla de validación es de F02.

## 10. Dudas

| # | Duda | Opción recomendada |
|---|---|---|
| D1 | ASIGNAR ("Asignar evaluadores") lleva a la bandeja "Estratificación de Riesgo", no al protocolo. ¿Es la pantalla correcta para esa fila? La condición de la fila b (RF-ALR.f.1: recepción completa, sin riesgo confirmado, sin asignación activa) coincide con los protocolos que esa bandeja lista, pero no se verificó con datos | Mantener la bandeja en F01; confirmar con la Secretaría; el acceso directo por protocolo es de F03 |
| D2 | ¿Cuál es la ruta definitiva de la bandeja? T01-0 la deja en `/estratificacion-riesgo` (temporal, fuera del menú) | Temporal hasta F03 (Asignación) |
| D3 | "Ver convocatoria" en la tarjeta: `/convocatorias/:id` no existe | Sin enlace en F01; F04 lo agrega |
| D4 | Columna Estado en Protocolos (§9) | Pedir al backend un `estadoActual` legible en `GET /protocols`, como en pendientes |
| D5 | ¿Las filas de Protocolos abren algo? Las rutas por etapa son de F02–F07 | Sin navegación en F01. Alternativa: `/dashboard/protocols/workspace/:id/info` si la Secretaría lo pide |
| D6 | `AssignmentPage` también aparece en el menú antiguo por permisos (`menu-ui.config.ts:111-124`). Con T01-0, un rol que no es SECRETARIA que llegue ahí verá el aviso de RoleGuard en lugar de su inicio sin aviso | Aceptarlo: hoy ese rol tampoco ve la bandeja |
| D7 | ¿El filtro de Mis pendientes va en la URL (`?filtro=`)? | No en F01; la vista arranca en Todos |
| D8 | El año por defecto de Protocolos | `Todos` (sin `year`) |
| D9 | La ruta `/protocolos` conserva los permisos de la Validación Documental (`RECEPCION_VALIDAR`, `DOCUMENTOS_VALIDAR`, `RECEPCION_VER`, `app.routes.ts:30-34`), pero `GET /protocols` pide `PROTOCOLOS_LISTAR` (RF-EST.3). Una cuenta sin ese permiso vería un 403 | No cambiar `data` en F01 (decisión: solo cambia `loadComponent`); confirmar que la Secretaría tiene `PROTOCOLOS_LISTAR` y ajustar el permiso de la ruta en una tarea aparte |
