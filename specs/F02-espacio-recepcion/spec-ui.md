# F02 · Espacio del protocolo + Recepción (validar documentos) — spec-ui

**Versión:** 0.1 · **Fecha:** 06/11/2026 · **Rama:** `feat/f02-spec-recepcion`
**Historial:** 0.1 (06/11/2026) primer borrador desde el canvas y el Paso 0 (backend y frontend en solo lectura)
**Cubre:** spec-001 v3.5.6 RF-04.2, RF-05.1, RF-05.2, RF-06.1, RF-07.1, RF-08.1 (`specs/001-flujo-mvp/spec.md:409-427` del backend)
**Depende de:** F00 (tokens, AppShell, `shared/ui`, `Stage`, rutas por rol activo) y F01 (`contract-readers`, `fecha-ecuador.util`, `Pager`, patrón de fachada con estados por bloque, regla de capas `f01Layers`)
**Canvas:** `canvas/03-validar-recepcion.png` (tablero `ValidarDocumentos.dc.html`). **La imagen todavía no está en el repo** y el tablero no se encontró en disco durante el Paso 0: esta versión se escribió con la descripción de la captura que dio la usuaria (06/11/2026). Se coteja con la imagen cuando se agregue (pregunta P12).

---

## 1. Objetivo y alcance

Dar a la Secretaría el **espacio de un protocolo** dentro del AppShell, con la pestaña **Recepción** como pantalla de trabajo: revisar cada documento del checklist PET 2023, aprobarlo u observarlo, contar sus páginas y, al final, enviar las observaciones al investigador o aprobar la recepción (paso a Asignación).

**Solo rol activo `SECRETARIA`** en F02 (como F01). El investigador y los demás roles siguen usando el espacio actual (`/dashboard/protocols/workspace/:id`), que no se toca.

**Incluye:**
- cabecera del protocolo (migas, chips, título, investigador, fecha de envío, n.º de documentos, etapas, acción principal);
- pestañas `Resumen`, `Documentos · n`, `Recepción`, `Recorrido`, con la pestaña en la URL;
- la pestaña `Recepción` completa (checklist, progreso, páginas, validación por documento, observaciones);
- el cambio del destino `VALIDAR` de Mis pendientes (F01) a la pantalla nueva.

**No incluye:**
- la subida de documentos por el investigador ni la subsanación (RF-04.1, RF-05.1 criterio EARS);
- la aceptación de tiempos (RF-08.2) ni la asignación de evaluadores (F03);
- la constancia PDF como pantalla propia (la emite el backend al aprobar, RF-08.1);
- el retiro de `ProtocolValidationDetailPage` (1319 líneas) y de `ProtocolValidationListPage`: tarea aparte cuando F02 esté en uso (§9).

## 2. Decisiones de esta spec

| # | Decisión | Estado |
|---|---|---|
| E1 | La observación es **texto** (`string`); el "[object Object]" del canvas es un error del mock | Decidida (usuaria, 06/11/2026) |
| E2 | Botón principal según RF-05.2: deshabilitado con `Falta revisar N documento(s)` mientras quede algo sin revisar; `Enviar observaciones` si hay algo observado o sin documento; `Aprobar recepción` si todo está aprobado | `Aprobar recepción` **por confirmar** (P1) |
| E3 | Las dos acciones finales llaman **solo** a `POST /reception/protocol/:id/finalize`; el frontend no decide `isComplete` (no se usa `PATCH …/verify`) | Propuesta (§4 y plan §4) |
| E4 | Antes de la acción final, una confirmación (`Dialog` de `shared/ui`): la acción manda correos y, al aprobar, genera el código CEISH | Propuesta |
| E5 | La pestaña va en la URL como segmento: `/protocolos/:id/{resumen\|documentos\|recepcion\|recorrido}` | Propuesta (P2) |
| E6 | Nada inventado: los textos de relleno del backend (`'TRÁMITE EN PROCESO'`, `'No asignado'`, `'No especificado'`) no se muestran como si fueran datos; `pageCount` ausente no se reemplaza por `1` | Decidida (regla del prompt) |
| E7 | Páginas contadas: campo propio por documento; se envía con la validación. **Bloqueado** hasta que el backend guarde las contadas aparte de las declaradas (TSK-F02-1) | Bloqueado |
| E8 | Recorrido: se muestra solo lo que devuelve el backend; nunca un recorrido simulado | Decidida |

## 3. Pantalla — `/protocolos/:id/recepcion` (canvas `03-validar-recepcion.png`)

Zonas, de arriba abajo (impeccable: una jerarquía clara —qué protocolo, en qué paso está, qué falta— y el color solo para estado):

1. **AppShell** de F00, sin búsqueda global (C4 de F01).
2. **Migas:** `Por validar › {ceishCode}`. `Por validar` es un enlace a la lista de origen (P3). Sin código: `Por validar › Sin código`.
3. **Cabecera** (encima de las pestañas, se ve en las cuatro):
   - Chips (`StatusChip`): `{ceishCode} · v{versión}` (gris), estado (`Por validar`, tono ámbar; ver §5.3) y tipo de estudio (gris).
   - Título (`h1`, recibe el foco al entrar).
   - Línea de datos: `Investigador: {nombre} · Enviado el {dd/MM/yyyy, HH:mm en hora de Ecuador} · {n} documentos` (`1 documento` en singular). Un dato ausente se escribe `Sin investigador principal`, `Fecha no disponible` (no se omite en silencio).
   - Etapas en 6 pasos (`StageBar` de `shared/ui`, `aria-current="step"` en la actual).
   - Acción principal (`PageHeader` con `disabledReason`, F00 §6.1): ver §3.2.
4. **Pestañas** (`Tabs` de `shared/ui`, `role="tablist"`): `Resumen`, `Documentos · {n}`, `Recepción`, `Recorrido`. La activa sale de la URL.
5. **Contenido de la pestaña.**

### 3.1 Pestaña Recepción

1. **Cabecera del bloque:** `Lista de verificación de requisitos (PET 2023)` con tres contadores: `{a} aprobados`, `{o} con observación`, `{s} sin revisar` (texto + tono; nunca solo color).
2. **Progreso:** `Progreso de validación · {r} de {n}` y `{p} %`, con `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="{n}"`. `r` = aprobados + con observación; `n` = requisitos del checklist que se revisan (§5.1).
3. **Tabla** (una fila por requisito del checklist que devuelve el backend, en su orden):

   | Columna | Contenido |
   |---|---|
   | Requisito | `name` y, debajo y más pequeño, `code` |
   | Documento | enlace con el nombre del archivo; abre la vista del documento en otra pestaña (§7). Sin documento: `Sin documento` |
   | N.º de páginas | `Declaradas: {n}` (dato) y un campo numérico `Contadas` (entero ≥ 1). Si no coinciden: aviso `Las páginas no coinciden` con icono y texto, además del color (§5.2) |
   | Validación | dos botones con borde, `Aprobar` y `Observar`, con `aria-pressed` según el estado y alto mínimo 44 px (`--min-h-action`). `aria-label="{Aprobar\|Observar} {name}"` |
   | Observación | texto de la observación guardada; al pulsar `Observar` se abre un campo de texto **obligatorio** con `Guardar observación` y `Cancelar` |

   - La fila observada se resalta con un borde izquierdo de tono rojo **y** el chip `Con observación` (no solo el fondo).
   - Una fila aprobada no se puede editar mientras la recepción esté cerrada (RF-04.2); en revisión, se puede cambiar de Aprobar a Observar y al revés.
4. **Estados del bloque:** §5.5.

### 3.2 Acción principal (cabecera)

| Situación (contadores de §3.1) | Botón | Estado |
|---|---|---|
| `s > 0` (queda algo sin revisar) | `Enviar observaciones` | deshabilitado; motivo visible: `Falta revisar {s} documento(s)` (con 1: `Falta revisar 1 documento`) |
| `s = 0` y (`o > 0` o algún requisito obligatorio sin documento) | `Enviar observaciones` | habilitado |
| `s = 0`, `o = 0` y todos los obligatorios con documento aprobado | `Aprobar recepción` (RF-05.2; **P1**) | habilitado |
| Recepción ya cerrada (`COMPLETO`, `INCOMPLETO`, `ARCHIVADO`) | sin acción principal | — |
| Sin permiso `RECEPCION_VALIDAR` | la acción y los botones de la tabla se muestran deshabilitados con `No tiene permiso para validar documentos.` | — |

Las dos acciones abren una confirmación (E4) que resume qué pasará (`Se enviarán {o} observaciones al investigador. Tendrá {plazo} días para corregirlas.` / `Se aprobará la recepción, se generará el código CEISH y se enviará la constancia al investigador.`). El plazo lo devuelve el backend en la respuesta, no se inventa en la confirmación (P5).

### 3.3 Las otras pestañas (alcance mínimo en F02)

| Pestaña | Contenido | Fuente |
|---|---|---|
| Resumen | Datos del protocolo que ya devuelve el backend: título, tipo de estudio, investigador principal, estado de recepción. Sin campos inventados | `GET /protocols/:id` (§4) |
| Documentos · n | Lista de documentos subidos (nombre, fecha de subida en hora de Ecuador, enlace a la vista). `n` = documentos devueltos | `GET /reception/protocol/:id/documents` |
| Recorrido | Eventos del backend (fecha y hora de Ecuador, responsable, acción). Vacío: `Todavía no hay movimientos registrados.` **Sin recorrido simulado** (E8) | `GET /audit/protocol/:id`, **bloqueado** por TSK-F02-5 (permisos y filtro) |

## 4. Contratos del backend (verificados el 06/11/2026, solo lectura)

Todos bajo `JwtAuthGuard` y con el envoltorio `{ statusCode, message, data }` del `ResponseInterceptor`. Ningún endpoint de esta lista usa `@Roles`: el control es por `@Permissions` (o ninguno, ver la columna). Rutas relativas a `src/modules/` del backend.

| # | Para qué | Método y ruta | `@Permissions` | Evidencia |
|---|---|---|---|---|
| A | Cabecera + checklist con su documento | `GET /reception/protocol/:protocolId/validation-detail` | ninguno en el controlador; el servicio exige `RECEPCION_LISTA`, `EVALUACION_RIESGO` o `EVALUACION_PLENO`, o ser investigador del protocolo (403 si no) | `reception/infrastructure/controllers/reception.controller.ts:48-58`; `reception/application/services/reception.service.ts:55-88` |
| B | Validar un documento (aprobar u observar) | `POST /reception/document/:documentId/validate` | `RECEPCION_VALIDAR` | `reception.controller.ts:157-172`; servicio `reception.service.ts:711-771` |
| C | Cerrar la revisión (enviar observaciones **o** aprobar) | `POST /reception/protocol/:protocolId/finalize` | `RECEPCION_VALIDAR` | `reception.controller.ts:100-105`; servicio `reception.service.ts:200-371` |
| D | Ver un documento | `GET /reception/document/:documentId/download-url` → `{ downloadUrl }` (y `GET …/view`, que redirige o envía el archivo) | **ninguno** (el guard deja pasar sin metadatos: `shared/guards/permissions.guard.ts:32-39`) | `reception.controller.ts:185-251` |
| E | Documentos del protocolo | `GET /reception/protocol/:protocolId/documents` | `RECEPCION_LISTA`, `EVALUACION_RIESGO` o `EVALUACION_PLENO` | `reception.controller.ts:174-183` (`DocumentMapper.toResponseList`) |
| F | Detalle del protocolo (Resumen) | `GET /protocols/:id` | **ninguno** (solo `JwtAuthGuard` de clase) | `protocols/infrastructure/controllers/protocol.controller.ts:43-44` y `:215-232` (`ProtocolMapper.toResponse`, sin `etapa`: `toResponse` en `protocols/application/mappers/protocol.mapper.ts:45-58`; `etapa` solo en `toListResponse`, `:31-43`) |
| G | Requisitos PET según tipo y banderas | `GET /protocols/requirements?tipo&muestras&vulnerable&multicentrico&riesgoMayor&institucionesPublicas` | ninguno | `protocol.controller.ts:188-213` |
| H | Recorrido | `GET /audit/protocol/:id` | **ninguno** (solo `JwtAuthGuard`) | `audit/infrastructure/controllers/audit.controller.ts:19-26`; `audit/application/services/audit.service.ts:83-110` |
| I | Estado de un requisito | `PATCH /reception/protocol/:protocolId/requirement/:reqId` `{ status }` | `RECEPCION_VALIDAR` | `reception.controller.ts:300-313` (F02 no lo usa: B ya sincroniza el requisito) |
| J | Verificar (el cliente decide `isComplete`) | `PATCH /reception/protocol/:protocolId/verify` `{ isComplete, missingItemsList?, reviewType? }` | `RECEPCION_VALIDAR` | `reception.controller.ts:86-98`; DTO `verify-reception.dto.ts`. **F02 no lo usa** (E3) |

### A) `validation-detail` — respuesta

```text
{ header: { id, ceishCode (o 'TRÁMITE EN PROCESO'), title, submissionDate (receptionDate o createdAt),
            investigator (fullName o 'No asignado'), studyType (name o 'No especificado') },
  checklist: [ { id, code, name, status: PENDIENTE|PRESENTADO|APROBADO|RECHAZADO|NO_APLICA|NO_PRESENTADO,
                 pageCount, observations,
                 attachedDocument: { id, fileName, path, isValidated, uploadedAt, pageCount } | null } ],
  globalStatus: { isComplete, status (receptionStatus), version (o 1), hasMissingItems, missingItemsList,
                  submissionDeadline } }
```
Evidencia: `reception.service.ts:138-175`; `RequirementMapper.toResponse` en `protocols/application/mappers/requirement.mapper.ts`; `RequirementStatus` en `protocols/domain/enums/requirement-status.enum.ts`.

Hallazgos que afectan a la UI:
- Los rellenos `'TRÁMITE EN PROCESO'`, `'No asignado'`, `'No especificado'` y `version || 1` (`reception.service.ts:155-165`) se confunden con datos reales (E6, TSK-F02-3).
- El documento se asocia al requisito primero por `requirementId`, luego **por nombre de archivo** y, si nada coincide, **toma el primer documento libre** cuando el requisito está `PRESENTADO` o `APROBADO` (`reception.service.ts:96-136`). Una fila puede mostrar un documento que no es el suyo (TSK-F02-4).
- No trae `etapa` ni un estado legible (como `estadoActual` de F01): TSK-F02-3.

### B) `validate` — cuerpo y efecto

- DTO `ValidateDocumentDto { statusId: number; observations?: string; pageCount?: number }` (`reception/application/dtos/validate-document.dto.ts`). `statusId`: `1 APROBADO`, `2 RECHAZADO`, `3 OBSERVADO`, `4 PENDIENTE` (`reception/domain/enums/document-validation-status.enum.ts`).
- Guarda un registro en el historial de validaciones, marca el documento como validado y **sobrescribe `pageCount` del documento y del requisito** con el valor enviado (`reception.service.ts:724-755`): las páginas declaradas se pierden (TSK-F02-1).
- Cualquier `statusId` distinto de `1` deja el requisito en `RECHAZADO` con `observations || ''` (`:744-755`): **la observación no es obligatoria en el backend** (TSK-F02-2).
- No hay control de concurrencia: dos usuarios pueden validar el mismo documento y gana el último (TSK-F02-6). El protocolo tiene `@VersionColumn` `versionLock` (`protocols/infrastructure/database/protocol.entity.orm.ts:30-31`), que `toResponse` expone, pero ningún endpoint de recepción lo pide.
- Respuesta: `DocumentValidationMapper.toResponse(validation)`.

### C) `finalize` — efecto

- 400 si queda algún documento subido sin validar (`reception.service.ts:212-222`).
- Recalcula los requisitos obligatorios según el tipo y las banderas del protocolo (`:224-236`) y arma la lista de faltantes: `RECHAZADO` → `{nombre} requiere corrección: {observación}`; `PENDIENTE`/`NO_PRESENTADO` o sin fila → `Falta documento obligatorio` (`:240-270`).
- Sin faltantes: recepción `COMPLETO` (statusId 10), genera el código CEISH si no tiene, crea la versión 1, envía la constancia y avisa a la Presidencia; responde `{ status: 'COMPLETO', ceishCode, message }` (`:275-340`).
- Con faltantes: recepción `INCOMPLETO` (11), plazo de subsanación, correo al investigador; responde `{ status: 'INCOMPLETO', message, missingItems, deadline }` (`:341-370`).
- Es decir: **un solo endpoint** cubre "Enviar observaciones" y "Aprobar recepción"; el resultado lo decide el backend, no el botón.
- El año del código sale de `now.getFullYear()` del servidor (`:281`; igual en `verify`, `:667`): si el servidor está en UTC, una aprobación del 31/12 desde las 19:00 de Ecuador tendría el año siguiente (TSK-F02-7).

## 5. Reglas de diseño

**Registro:** producto (impeccable). Tabla densa, una acción por fila, color solo para estado; la acción principal arriba a la derecha, siempre visible.

### 5.1 Contadores y progreso

| Estado del requisito (backend) | Cuenta como | Texto en la fila |
|---|---|---|
| `APROBADO` | aprobado | chip verde `Aprobado` |
| `RECHAZADO` | con observación | chip rojo `Con observación` |
| `NO_APLICA` | no se cuenta en `n` | chip gris `No aplica` |
| `PRESENTADO` o `PENDIENTE` con documento | sin revisar | chip gris `Sin revisar` |
| `NO_PRESENTADO`, o cualquiera sin documento | no se cuenta como "sin revisar"; obliga a `Enviar observaciones` si es obligatorio (P4) | chip ámbar `Sin documento` |
| otro valor | sin revisar, con `console.warn` | chip gris `Estado no reconocido` |

`n` = filas que se revisan (con documento, sin `NO_APLICA`). `p` = `round(r / n × 100)`; con `n = 0`, `0 %` y el vacío de §5.5.

### 5.2 Páginas

- `Declaradas` = `attachedDocument.pageCount` tal como llega; `null` → `Sin dato` (nunca `1`, E6).
- `Contadas` = entero ≥ 1 escrito por la Secretaría; otro valor → `Escriba un número entero mayor que 0.` y no se envía.
- Si `Contadas ≠ Declaradas` (ambas presentes): aviso `Las páginas no coinciden (declaradas {d}, contadas {c})` con icono, texto y tono ámbar; no bloquea la validación (P6).

### 5.3 Estado de la cabecera

- El chip de estado muestra el estado de recepción. Con los códigos de `receptionStatus` que hoy se ven en recepción: `EN_REVISION_SECRETARIA`/`PENDIENTE` → `Por validar` (ámbar), `INCOMPLETO` → `Con observaciones enviadas` (rojo), `COMPLETO` → `Recepción aprobada` (verde), `ARCHIVADO` → `Archivado` (gris). Otro código: `Estado no reconocido` (gris). Lo ideal es que el backend entregue el texto legible (TSK-F02-3); hasta entonces, esta tabla es la única fuente y se valida con la Secretaría (P7).
- Etapa: `StageBar` con la etapa del backend (TSK-F02-3). Sin etapa: la barra no se muestra (no se supone `Recepción`).

### 5.4 Fechas

`submissionDate`, `uploadedAt` y las fechas del recorrido son instantes ISO: `fechaHoraEcuador` (`dd/MM/yyyy, HH:mm`) o `fechaEcuador` (`dd/MM/yyyy`) de `fecha-ecuador.util` (F01 T01-1). Inválida → `Fecha no disponible`.

### 5.5 Estados

| Bloque | Cargando | Vacío | Error | Guardando | Conflicto |
|---|---|---|---|---|---|
| Cabecera | `LoadingState` `Cargando el protocolo…` | — | `ErrorState` `No pudimos cargar el protocolo.` + Reintentar (sin pestañas) | — | — |
| Recepción | `LoadingState` `Cargando la lista de verificación…` | `No hay documentos para revisar. El investigador aún no ha subido archivos.` | `ErrorState` `No pudimos cargar la lista de verificación.` + Reintentar | por fila: botones deshabilitados y `Guardando…` (`aria-live="polite"`); el resto de la tabla sigue usable | 409 del backend (cuando exista, TSK-F02-6): aviso `Otro usuario cambió esta recepción. Recargue para ver los cambios.` + `Recargar`; no se reintenta solo |
| Validar una fila | — | — | aviso en la fila `No se guardó. Intente de nuevo.` + Reintentar; el estado anterior de la fila se conserva | — | — |
| Acción final | — | — | `ErrorState` en la confirmación con el mensaje del backend (por ejemplo el 400 de `finalize`) | botón `Enviando…` deshabilitado | igual que arriba |

Los errores nunca se muestran como "sin documentos".

### 5.6 Accesibilidad (checklist de ui-ux-pro-max; manda el repo cuando choca)

1. Orden de teclado = orden visual: migas → acción principal → pestañas → contadores → tabla (por fila: documento, contadas, Aprobar, Observar, observación).
2. Foco visible de 2 px con `--c-primary`. Al entrar, foco al `h1` (`tabindex="-1"`). Al cambiar de pestaña, foco al panel (`role="tabpanel"`, `aria-labelledby`).
3. `Aprobar`/`Observar` con `aria-pressed` y `aria-label` con el nombre del requisito; 44 px de alto (`--min-h-action`).
4. El campo `Observación` tiene `label` visible, `aria-required="true"`, `aria-invalid` y el error en `aria-describedby`.
5. Aviso de páginas y estado de guardado en `aria-live="polite"`; el error de la acción final en `role="alert"`.
6. La barra de progreso con `role="progressbar"` y valores; el porcentaje también en texto.
7. Color nunca solo: chips con texto, fila observada con borde **y** chip, aviso de páginas con icono **y** texto.
8. Contraste AA con los tonos de F00 (F01 spec-ui §5.6.8).
9. Tabla con `caption` y `th scope="col"`; el enlace del documento dice `(se abre en otra pestaña)`.
10. Pestañas con `role="tablist"`/`tab`, flechas para moverse (`Tabs` de `shared/ui` ya lo hace).

## 6. Interacciones

- **Aprobar:** un clic envía `POST …/validate` con `statusId 1` y las páginas contadas (cuando E7 se desbloquee). La fila pasa a `Guardando…` y luego a `Aprobado`.
- **Observar:** abre el campo de texto; `Guardar observación` exige texto (recortado, ≥ 1 carácter; mínimo definitivo en P8) y envía `statusId` de observación (P9) con `observations`. `Cancelar` vuelve al estado anterior sin llamar al backend.
- **Cambiar de opinión:** pulsar el otro botón de una fila ya revisada vuelve a validar (el backend guarda el historial).
- **Acción final:** confirmación → `POST …/finalize` → se recarga la cabecera y la pestaña; el contador del menú (`PendingCountPort`) se refresca.
- **Pestañas:** cambian el segmento de la URL; recargar o volver atrás reproduce la pestaña.
- **Ver documento:** pide `download-url` y abre la URL validada en otra pestaña (§7).

## 7. Seguridad (angular-security)

1. Sin `innerHTML`, `outerHTML` ni `bypassSecurityTrust*`. Todo con interpolación.
2. Mappers estrictos con `contract-readers`: la observación es `nullableStr` (un objeto lanza `ContractError`, nunca `[object Object]`).
3. `downloadUrl` pasa por `safeHttpUrl` (solo `http:`/`https:`); se abre con `window.open(url, '_blank', 'noopener,noreferrer')` o un `<a target="_blank" rel="noopener noreferrer">`. Hoy el código abre sin `noopener` (`protocol-validation-detail.page.ts:1042`).
4. El texto de la observación se recorta y se limita (P8) antes de enviarlo.
5. Hallazgos del backend que no resuelve el frontend (tareas TSK): `download-url`/`view` sin permiso (cualquier usuario autenticado abre cualquier documento por id), `GET /protocols/:id` y `GET /audit/protocol/:id` sin permiso.

## 8. Criterios de aceptación

1. Con rol SECRETARIA, `/protocolos/:id/recepcion` muestra el espacio del protocolo dentro del AppShell; con INVESTIGADOR vuelve a su inicio con aviso (criterio 4 de F00).
2. La fila `VALIDAR` de Mis pendientes navega a `/protocolos/{protocolId}/recepcion` (P2).
3. Las migas dicen `Por validar › {ceishCode}`; sin código, `Sin código`.
4. La cabecera muestra los chips, el título, `Investigador: … · Enviado el dd/MM/yyyy, HH:mm · n documentos` en hora de Ecuador y la barra de etapas; los rellenos del backend no se muestran como datos.
5. La pestaña activa sale de la URL; `/protocolos/:id` abre la pestaña por defecto (propuesta P2: `recepcion`); un segmento desconocido vuelve a `resumen`.
6. La pestaña Recepción muestra los contadores, `Progreso de validación · r de n` y el porcentaje, y una fila por requisito con nombre y código.
7. `Aprobar` envía `statusId 1`; `Observar` no envía nada hasta escribir la observación; con texto vacío muestra el error y no envía.
8. Una observación que llega como objeto produce `ContractError` y `ErrorState` (nunca `[object Object]`).
9. Páginas: declaradas como dato; contadas como campo entero ≥ 1; si no coinciden, el aviso con texto (no solo color).
10. La fila observada se resalta con borde y chip.
11. Botón principal: deshabilitado con `Falta revisar N documento(s)` mientras `s > 0`; `Enviar observaciones` con algo observado; `Aprobar recepción` con todo aprobado (P1); sin acción con la recepción cerrada.
12. La acción final pide confirmación y llama solo a `POST …/finalize`.
13. Un error al validar una fila no cambia su estado y no afecta a las demás.
14. Un 409 muestra el aviso de conflicto con `Recargar` (cuando el backend lo emita, TSK-F02-6).
15. `Ver documento` abre una URL `http(s)` con `noopener`; otra URL no se abre y se avisa `No se pudo abrir el documento.`.
16. El Recorrido nunca muestra eventos simulados; vacío y error tienen su estado.
17. Ningún archivo de `presentation`/`application` de F02 importa `@angular/common/http` ni `infrastructure` (regla de eslint).
18. Sin hex nuevos, sin `innerHTML` ni `bypassSecurityTrust*`.

## 9. Pendientes

- **Bloqueos de backend:** E7 (páginas contadas, TSK-F02-1) y el Recorrido (TSK-F02-5). Mientras tanto: la columna de páginas muestra solo `Declaradas` y la pestaña Recorrido muestra `ErrorState`/`EmptyState` honestos o se oculta (P10).
- **Código actual que no se reutiliza** (Paso 0, plan §5): `ProtocolValidationDetailPage` (1319 líneas, `ngModel` sobre el objeto de la respuesta, `|| 1` en páginas, `window.open` sin `noopener`); `AuditRepositoryAdapter.getProtocolTrail` devuelve un recorrido **simulado** con `integrityHash` inventado cuando la respuesta viene vacía o falla (`features/audit/infrastructure/adapters/audit-repository.adapter.ts:148`, `:164`, `:160`, `:198-217`).
- **Permisos del frontend que no existen en el backend:** `DOCUMENTOS_VALIDAR` y `RECEPCION_VER` (`src/features/protocols/routes.ts:73`) no están en `Permission` del backend (`shared/enums/permission.enum.ts:11-24`); con `permissionStrategy: 'any'` solo funciona `RECEPCION_VALIDAR`. F02 usa los nombres del backend (`RECEPCION_LISTA`, `RECEPCION_VALIDAR`).
- **Retiro** de `ProtocolValidationDetailPage`, `ProtocolValidationListPage` y la acción `Aprobar Todo` del espacio antiguo (`protocol-workspace.component.ts:555-557`): tarea T02-R1, cuando F02 esté en uso.
- **F01 §9.1 (Protocolos por etapa):** las columnas de Recepción (`Recibido · Requisitos revisados`) y sus filtros (`Por revisar`, `Con observaciones`, `Esperando aceptación de tiempos`) necesitan contadores por protocolo que `GET /protocols` no entrega; siguen pendientes (fuera de F02). El destino del clic en una fila de Recepción (F01 §9.1: `Validar documentos`) será esta pantalla cuando las filas naveguen (D5 de F01 sigue vigente).

### 9.1 Diferencias con el canvas

| # | Canvas | F02 | Motivo | Estado |
|---|---|---|---|---|
| DC1 | Observación como "[object Object]" | Texto | Error del mock (E1) | Decidido |
| DC2 | Una sola acción `Enviar observaciones` | `Enviar observaciones` o `Aprobar recepción` según los contadores | RF-05.2 del backend | Pendiente (P1) |
| DC3 | Páginas contadas editables desde ya | Solo declaradas hasta TSK-F02-1 | El backend sobrescribe las declaradas al guardar | Bloqueado |
| DC4 | (Por cotejar con la imagen) | — | La imagen aún no está en el repo | P12 |

## 10. Preguntas abiertas

| # | Pregunta | Para | Propuesta |
|---|---|---|---|
| P1 | Con todo aprobado, ¿la acción es `Aprobar recepción` (RF-05.2), con confirmación? | Secretaría y Presidenta | Sí, `Aprobar recepción`, con confirmación (E4) |
| P2 | ¿La pantalla vive en `/protocolos/:id/{pestaña}` (nueva, bajo el AppShell) y `VALIDAR` de Mis pendientes cambia a `/protocolos/:id/recepcion`? ¿Pestaña por defecto `resumen` o `recepcion`? | Usuaria (equipo) | Sí; por defecto `recepcion` (la ruta redirige siempre ahí, plan §4; elegir según el estado exigiría cargar antes de redirigir) |
| P3 | ¿A dónde lleva la miga `Por validar`? | Secretaría | `/protocolos?etapa=RECEPCION` (F01) |
| P4 | Un requisito obligatorio sin documento, ¿cuenta como "con observación" (obliga a `Enviar observaciones`) o debe marcarse a mano? | Secretaría | Cuenta solo (como hace `finalize`), con el chip `Sin documento` |
| P5 | ¿El plazo de subsanación (30 días, RF-07.1) se muestra en la confirmación? El backend lo calcula al cerrar y no lo expone antes | Secretaría / backend | Mostrar el plazo de la respuesta después de cerrar; en la confirmación, sin número hasta que el backend lo exponga |
| P6 | Si las páginas no coinciden, ¿se puede aprobar igual, o la diferencia obliga a observar? | Secretaría y Presidenta | Aviso que no bloquea |
| P7 | Textos del chip de estado (§5.3) | Secretaría | Los de §5.3, hasta que el backend entregue el texto (TSK-F02-3) |
| P8 | ¿Mínimo y máximo de la observación? Hoy el frontend exige 5 caracteres (`validate-checklist-item.use-case.ts:31`) y el backend nada | Secretaría / backend | Mínimo 5, máximo 1000, validado en los dos lados (TSK-F02-2) |
| P9 | `Observar` = `statusId 3 OBSERVADO` o `2 RECHAZADO`? El backend trata igual a los dos (`reception.service.ts:744-750`); el frontend actual envía 2 | Backend | `3 OBSERVADO` (coincide con el texto del botón) |
| P10 | Mientras el Recorrido esté bloqueado, ¿se oculta la pestaña o se muestra con un aviso? | Usuaria | Se muestra con `Recorrido no disponible todavía.` (sin datos) |
| P11 | ¿PRESIDENTE también valida en F02? | Presidenta | No en F02 (solo SECRETARIA, como F01) |
| P12 | Cotejo con la imagen `canvas/03-validar-recepcion.png` | Usuaria | Al agregarla, revisar §3 y §9.1 |
