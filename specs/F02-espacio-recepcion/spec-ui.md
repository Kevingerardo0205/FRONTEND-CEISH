# F02 · Espacio del protocolo + Recepción (validar documentos) — spec-ui

**Versión:** 0.3 · **Fecha:** 06/11/2026 · **Rama:** `feat/f02-spec-recepcion`
**Historial:**
- 0.1 (06/11/2026) primer borrador desde el canvas y el Paso 0 (backend y frontend en solo lectura).
- 0.2 (06/11/2026) cotejo con las 4 imágenes de `canvas/` (§9.1, DC3–DC7; cierra P12); P9 resuelta con el enum del backend (E17); un segmento de pestaña desconocido vuelve a `recepcion`; citas de `validate` precisadas (`:724-730`, `:736`, `:744-748`, `:750-754`); nuevas preguntas P13 (cómo ver el documento) y P14 (observaciones generales).
- 0.3 (06/11/2026) respuestas de la reunión del 06/11/2026 con la Secretaría y la Presidenta: decisiones E9–E16. P1, P4, P6, P11, P13 y P14 decididas; P5 y P8 **por confirmar**; P3 reescrita en lenguaje simple; P7 sigue abierta. Páginas `Contadas` provisionales en el frontend, sin enviarlas al backend (E10; TSK-F02-1 pasa a mejora). Un requisito sin documento queda `sin revisar` hasta que la Secretaría lo observe (E11; evidencia en §4 I; nueva TSK-F02-12). El documento se abre en otra pestaña (E13; DC4 no adoptado). Observaciones generales: existen en la pantalla anterior pero no llegan al investigador (§4 K); TSK-F02-11 necesaria (E14; DC7 adoptado). Plazo de 30 días en la confirmación (E15, provisional).
**Cubre:** spec-001 v3.5.6 RF-04.2, RF-05.1, RF-05.2, RF-06.1, RF-07.1, RF-08.1 (`specs/001-flujo-mvp/spec.md:409-427` del backend)
**Depende de:** F00 (tokens, AppShell, `shared/ui`, `Stage`, rutas por rol activo) y F01 (`contract-readers`, `fecha-ecuador.util`, `Pager`, patrón de fachada con estados por bloque, regla de capas `f01Layers`)
**Canvas:** `canvas/03-validar-recepcion.png` (tabla de Recepción) y `canvas/0301-…`, `0302-…`, `0303-…` (documento abierto en el canvas: normal, pantalla completa y parte inferior; no adoptado, DC4). El tablero `ValidarDocumentos.dc.html` no se encontró en disco. La 0.1 se escribió con la descripción de la captura; la 0.2 se cotejó con las imágenes (§9.1).

---

## 1. Objetivo y alcance

Dar a la Secretaría el **espacio de un protocolo** dentro del AppShell, con la pestaña **Recepción** como pantalla de trabajo: revisar cada documento del checklist PET 2023, aprobarlo u observarlo, contar sus páginas y, al final, enviar las observaciones al investigador o aprobar la recepción (paso a Asignación).

**Solo rol activo `SECRETARIA`** en F02 (E16). El investigador y los demás roles siguen usando el espacio actual (`/dashboard/protocols/workspace/:id`), que no se toca.

**Incluye:**
- cabecera del protocolo (migas, chips, título, investigador, fecha de envío, n.º de documentos, etapas, acción principal);
- pestañas `Resumen`, `Documentos · n`, `Recepción`, `Recorrido`, con la pestaña en la URL;
- la pestaña `Recepción` completa (checklist, progreso, páginas, validación por documento, observaciones por documento y observaciones generales);
- el cambio del destino `VALIDAR` de Mis pendientes (F01) a la pantalla nueva.

**No incluye:**
- la subida de documentos por el investigador ni la subsanación (RF-04.1, RF-05.1 criterio EARS);
- la aceptación de tiempos (RF-08.2) ni la asignación de evaluadores (F03);
- la constancia PDF como pantalla propia (la emite el backend al aprobar, RF-08.1);
- un visor del documento dentro de la pantalla (E13: se abre en otra pestaña);
- el retiro de `ProtocolValidationDetailPage` (1319 líneas) y de `ProtocolValidationListPage`: tarea aparte cuando F02 esté en uso (§9).

## 2. Decisiones de esta spec

| # | Decisión | Estado |
|---|---|---|
| E1 | La observación es **texto** (`string`); el "[object Object]" del canvas es un error del mock | Decidida (usuaria, 06/11/2026) |
| E2 | Botón principal según RF-05.2: deshabilitado con `Falta revisar N documento(s)` mientras quede algo sin revisar; `Enviar observaciones` si hay algo observado; `Aprobar recepción` si todo está aprobado (§3.2) | Decidida (E9 y E11, 06/11/2026) |
| E3 | Las dos acciones finales llaman **solo** a `POST /reception/protocol/:id/finalize`; el frontend no decide `isComplete` (no se usa `PATCH …/verify`) | Propuesta (§4 y plan §4) |
| E4 | Antes de la acción final, una confirmación (`Dialog` de `shared/ui`): la acción manda correos y, al aprobar, genera el código CEISH | Decidida para `Aprobar recepción` (E9); propuesta para `Enviar observaciones` |
| E5 | La pestaña va en la URL como segmento: `/protocolos/:id/{resumen\|documentos\|recepcion\|recorrido}` | Propuesta (P2) |
| E6 | Nada inventado: los textos de relleno del backend (`'TRÁMITE EN PROCESO'`, `'No asignado'`, `'No especificado'`) no se muestran como si fueran datos; `pageCount` ausente no se reemplaza por `1` | Decidida (regla del prompt) |
| E7 | Páginas contadas guardadas como dato propio, aparte de las declaradas: necesita TSK-F02-1. Con E10 ya **no bloquea**: es una mejora; mientras tanto, la versión provisional de E10 | Mejora (no bloquea, desde la 0.3) |
| E8 | Recorrido: se muestra solo lo que devuelve el backend; nunca un recorrido simulado | Decidida |
| E9 | Con todo aprobado, la acción principal es `Aprobar recepción`, **con confirmación** (E4). Cierra P1 y DC2 | Decidida (Secretaría y Presidenta, 06/11/2026) |
| E10 | Si las páginas declaradas y las contadas no coinciden, la Secretaría **debe observar** el documento. Versión provisional en el frontend, sin esperar a TSK-F02-1: (1) cada fila con documento tiene un campo `Contadas` que **no se envía** al backend (no se manda `pageCount`, porque `validate` sobrescribe las declaradas, `reception.service.ts:736` y `:753`); (2) el frontend compara y, si no coinciden, `Aprobar` queda deshabilitado con el motivo visible `Las páginas no coinciden: observa el documento`, y el texto de la observación se rellena con `Páginas declaradas {d}, contadas {c}` (editable); (3) el aviso lleva icono y texto, no solo color. **Limitación:** lo contado no se guarda como dato aparte, solo dentro del texto de la observación; si no se observó, se pierde al recargar. TSK-F02-1 pasa a mejora (E7). Cierra P6 | Decidida (Secretaría y Presidenta, 06/11/2026) |
| E11 | La Secretaría es quien pone las observaciones. Un requisito sin documento **no** cuenta solo como observación: queda `sin revisar` hasta que ella lo observe con texto (§5.1); en esa fila `Aprobar` está deshabilitado (`No hay documento para aprobar.`). Hoy el backend **no permite** guardar el texto de la observación de un requisito sin documento (§4 I): nueva **TSK-F02-12**. `finalize` no cambia: sigue agregando `Falta documento obligatorio: {nombre}` por su cuenta a todo obligatorio `PENDIENTE`/`NO_PRESENTADO` o sin fila (`reception.service.ts:264-270`). Sustituye la propuesta anterior de P4 (contarlo solo). Cierra P4. **Provisional mientras no exista TSK-F02-12 (por confirmar):** en esa fila `Observar` está deshabilitado con `Todavía no se puede observar un requisito sin documento.`, así que la acción principal queda deshabilitada y esos protocolos se cierran en la pantalla actual, que no se retira (T02-R1) hasta tener TSK-F02-12 | Decidida (Secretaría y Presidenta, 06/11/2026); provisional por confirmar |
| E12 | La observación por documento es **obligatoria** y de "tamaño promedio, para que alcancen todas las observaciones". **Por confirmar:** de 5 a 1000 caracteres por documento y hasta 2000 la general (§3.3); `textarea` de unas 4 líneas visibles con contador de caracteres. Se valida en el frontend; validarlo también en el backend queda en TSK-F02-2 y no bloquea | Por confirmar (P8) |
| E13 | Al hacer clic en el documento se abre **en otra pestaña**, como hoy (el criterio 18 queda igual). Hoy la pantalla anterior pide `download-url` y abre en una pestaña nueva un enlace firmado y temporal de Cloudflare R2 (`https://<bucket>.r2.cloudflarestorage.com/protocols/{id}/requirements/{reqId}/<archivo>.pdf?X-Amz-...`), que el navegador muestra con su lector de PDF (`protocol-validation-detail.page.ts:1038-1049` → `s3-storage.service.ts:39-45`). F02: el enlace se pide **al hacer clic** (caduca), nunca al cargar; misma técnica que la pantalla anterior (`window.open` dentro del `subscribe`, `:1042`) pero con `noopener,noreferrer`; solo `https:` (§7); mientras se pide, `Abriendo…` y deshabilitado; si falla, aviso en la fila (§6). DC4 no adoptado. TSK-F02-8 sigue como tarea de seguridad, sin bloquear. Cierra P13 | Decidida (Secretaría, 06/11/2026, después de la reunión) |
| E14 | Hay **observaciones generales** del protocolo al enviar, además de las de cada documento (canvas `0303`, §3.3). Existen en la pantalla anterior, pero se envían por `PATCH …/verify` y `finalize` las sobrescribe sin mandarlas al investigador (§4 K): **TSK-F02-11 es necesaria** (texto opcional en `finalize`, guardado y usado en el correo). DC7 adoptado. Cierra P14 | Decidida (Secretaría y Presidenta, 06/11/2026) |
| E15 | El plazo de subsanación se muestra **antes de enviar** (la respuesta quedó cortada en "antes de enviar"). Provisional: la confirmación dice `El investigador tendrá 30 días para corregir.` (RF-07.1, `specs/001-flujo-mvp/spec.md:424` del backend; `PLAZO_SUBSANACION_DOCUMENTAL_DIAS = 30`, `src/shared/deadlines/deadline-rules.ts:11-12`), sin fecha calculada en el frontend. La fecha exacta se muestra con la respuesta de `finalize` (`deadline`). TSK-F02-10 queda como mejora que no bloquea | Por confirmar (P5) |
| E16 | Solo la Secretaría valida (rol activo `SECRETARIA`); PRESIDENTE no valida en F02. Cierra P11 | Decidida (Presidenta, 06/11/2026) |
| E17 | `Observar` envía `statusId 3` (`OBSERVADO`); F02 no usa `2 RECHAZADO`. Evidencia: `DocumentValidationStatus { APROBADO = 1, RECHAZADO = 2, OBSERVADO = 3, PENDIENTE = 4 }` (`reception/domain/enums/document-validation-status.enum.ts:1-6`); el servicio solo compara con `APROBADO` y cualquier otro valor deja el requisito en `RECHAZADO` (`reception.service.ts:744-748`), pero el historial guarda el `statusId` tal como llega (`:724-730`), así que `3` deja constancia de que fue una observación. Es el único uso del enum en el backend (`git grep DocumentValidationStatus`: `reception.service.ts:30`, `:744`). El DTO acepta cualquier número (`validate-document.dto.ts:4-5`, solo `@IsNumber`): se agrega a TSK-F02-2. El frontend actual envía `2` (`protocol-validation-detail.page.ts:1133` → `document-api.adapter.ts:25-31`) | Decidida (backend, 06/11/2026; antes P9) |

## 3. Pantalla — `/protocolos/:id/recepcion` (canvas `03-validar-recepcion.png`)

Zonas, de arriba abajo (impeccable: una jerarquía clara —qué protocolo, en qué paso está, qué falta— y el color solo para estado):

1. **AppShell** de F00, sin búsqueda global (C4 de F01).
2. **Migas:** `Por validar › {ceishCode}`. `Por validar` es un enlace a la lista de Protocolos en Recepción, `/protocolos?etapa=RECEPCION` (propuesta, P3). Sin código: `Por validar › Sin código`.
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
   | Documento | botón con aspecto de enlace con el nombre del archivo y `(se abre en otra pestaña)`; al pulsarlo pide el enlace y abre el documento en otra pestaña (E13, §6). Mientras lo pide: `Abriendo…` y deshabilitado. Si falla: aviso en la fila `No se pudo abrir el documento.` + `Reintentar`. Sin documento: `Sin documento` |
   | N.º de páginas | `Declaradas: {n}` (dato) y un campo numérico `Contadas` (entero ≥ 1) que **no se envía** al backend (E10). Si no coinciden: aviso `Las páginas no coinciden (declaradas {d}, contadas {c})` con icono y texto, además del color, y `Aprobar` deshabilitado (§5.2) |
   | Validación | dos botones con borde, `Aprobar` y `Observar`, con `aria-pressed` según el estado y alto mínimo 44 px (`--min-h-action`). `aria-label="{Aprobar\|Observar} {name}"`. `Aprobar` deshabilitado con motivo visible: sin documento (`No hay documento para aprobar.`, E11) o páginas que no coinciden (`Las páginas no coinciden: observa el documento`, E10) |
   | Observación | texto de la observación guardada; al pulsar `Observar` se abre un `textarea` **obligatorio** de unas 4 líneas visibles, con contador `{c} / 1000 caracteres`, `Guardar observación` y `Cancelar` (E12; límites por confirmar, P8). Con páginas que no coinciden, el `textarea` llega relleno con `Páginas declaradas {d}, contadas {c}` (editable, E10) |

   - La fila observada se resalta con un borde izquierdo de tono rojo **y** el chip `Con observación` (no solo el fondo).
   - Una fila aprobada no se puede editar mientras la recepción esté cerrada (RF-04.2); en revisión, se puede cambiar de Aprobar a Observar y al revés.
   - Fila sin documento: chip `Sin documento`; cuenta como `sin revisar` hasta que se observe (E11). `Observar` en esa fila necesita TSK-F02-12 (T02-11); hasta entonces, deshabilitado con `Todavía no se puede observar un requisito sin documento.` (provisional, E11).
4. **Observaciones generales** (§3.3), debajo de la tabla.
5. **Estados del bloque:** §5.5.

### 3.2 Acción principal (cabecera)

| Situación (contadores de §3.1) | Botón | Estado |
|---|---|---|
| `s > 0` (queda algo sin revisar, incluidos los requisitos sin documento que no se han observado, E11) | `Enviar observaciones` | deshabilitado; motivo visible: `Falta revisar {s} documento(s)` (con 1: `Falta revisar 1 documento`) |
| `s = 0` y `o > 0` | `Enviar observaciones` | habilitado |
| `s = 0`, `o = 0` (todo lo que se revisa está aprobado) | `Aprobar recepción` (E9) | habilitado |
| Recepción ya cerrada (`COMPLETO`, `INCOMPLETO`, `ARCHIVADO`) | sin acción principal | — |
| Sin permiso `RECEPCION_VALIDAR` | la acción y los botones de la tabla se muestran deshabilitados con `No tiene permiso para validar documentos.` | — |

Las dos acciones abren una confirmación (E4) que resume qué pasará:
- `Enviar observaciones`: `Se enviarán {o} observaciones al investigador. El investigador tendrá 30 días para corregir.` (E15, provisional; sin fecha calculada en el frontend) y, si se escribieron, `Incluye las observaciones generales.` Tras enviar, el aviso de resultado muestra la fecha límite de la respuesta (`deadline`, en hora de Ecuador con `fechaEcuador`). Con TSK-F02-10, la confirmación podrá mostrar la fecha exacta antes de enviar.
- `Aprobar recepción`: `Se aprobará la recepción, se generará el código CEISH y se enviará la constancia al investigador.`

### 3.3 Observaciones generales (canvas `0303`; E14, T02-10)

Debajo de la tabla: `Observaciones generales del protocolo` (`label` visible), `textarea` opcional de unas 4 líneas, contador `{c} / 2000 caracteres` (por confirmar, P8) y la ayuda `Se envían junto con las observaciones de cada documento.` (texto del canvas). Se envían en el cuerpo de `POST …/finalize` al pulsar `Enviar observaciones` (TSK-F02-11); no hay guardado aparte ni se usa `PATCH …/verify` (E3). Con `Aprobar recepción` el bloque no se envía (por confirmar, P8). **Bloqueado por TSK-F02-11:** mientras no exista, el bloque no se muestra (la pantalla actual las guarda por `verify`, pero no llegan al investigador, §4 K).

### 3.4 Las otras pestañas (alcance mínimo en F02)

| Pestaña | Contenido | Fuente |
|---|---|---|
| Resumen | Datos del protocolo que ya devuelve el backend: título, tipo de estudio, investigador principal, estado de recepción. Sin campos inventados | `GET /protocols/:id` (§4) |
| Documentos · n | Lista de documentos subidos (nombre, fecha de subida en hora de Ecuador, botón que abre el documento en otra pestaña con la misma regla de E13). `n` = documentos devueltos | `GET /reception/protocol/:id/documents` |
| Recorrido | Eventos del backend (fecha y hora de Ecuador, responsable, acción). Vacío: `Todavía no hay movimientos registrados.` **Sin recorrido simulado** (E8) | `GET /audit/protocol/:id`, **bloqueado** por TSK-F02-5 (permisos y filtro) |

## 4. Contratos del backend (verificados el 06/11/2026, solo lectura)

Todos bajo `JwtAuthGuard` y con el envoltorio `{ statusCode, message, data }` del `ResponseInterceptor`. Ningún endpoint de esta lista usa `@Roles`: el control es por `@Permissions` (o ninguno, ver la columna). Rutas relativas a `src/modules/` del backend (rama `dev`, `de668b3`).

| # | Para qué | Método y ruta | `@Permissions` | Evidencia |
|---|---|---|---|---|
| A | Cabecera + checklist con su documento | `GET /reception/protocol/:protocolId/validation-detail` | ninguno en el controlador; el servicio exige `RECEPCION_LISTA`, `EVALUACION_RIESGO` o `EVALUACION_PLENO`, o ser investigador del protocolo (403 si no) | `reception/infrastructure/controllers/reception.controller.ts:48-58`; `reception/application/services/reception.service.ts:55-88` |
| B | Validar un documento (aprobar u observar) | `POST /reception/document/:documentId/validate` | `RECEPCION_VALIDAR` | `reception.controller.ts:157-172`; servicio `reception.service.ts:711-771` |
| C | Cerrar la revisión (enviar observaciones **o** aprobar) | `POST /reception/protocol/:protocolId/finalize` | `RECEPCION_VALIDAR` | `reception.controller.ts:100-105`; servicio `reception.service.ts:200-371` |
| D | Ver un documento | `GET /reception/document/:documentId/download-url` → `{ downloadUrl }` (enlace firmado y temporal de R2) (y `GET …/view`, que redirige o envía el archivo) | **ninguno** (el guard deja pasar sin metadatos: `shared/guards/permissions.guard.ts:32-39`) | `reception.controller.ts:185-251` |
| E | Documentos del protocolo | `GET /reception/protocol/:protocolId/documents` | `RECEPCION_LISTA`, `EVALUACION_RIESGO` o `EVALUACION_PLENO` | `reception.controller.ts:174-183` (`DocumentMapper.toResponseList`) |
| F | Detalle del protocolo (Resumen) | `GET /protocols/:id` | **ninguno** (solo `JwtAuthGuard` de clase) | `protocols/infrastructure/controllers/protocol.controller.ts:43-44` y `:215-232` (`ProtocolMapper.toResponse`, sin `etapa`: `toResponse` en `protocols/application/mappers/protocol.mapper.ts:45-58`; `etapa` solo en `toListResponse`, `:31-43`) |
| G | Requisitos PET según tipo y banderas | `GET /protocols/requirements?tipo&muestras&vulnerable&multicentrico&riesgoMayor&institucionesPublicas` | ninguno | `protocol.controller.ts:188-213` |
| H | Recorrido | `GET /audit/protocol/:id` | **ninguno** (solo `JwtAuthGuard`) | `audit/infrastructure/controllers/audit.controller.ts:19-26`; `audit/application/services/audit.service.ts:83-110` |
| I | Estado de un requisito | `PATCH /reception/protocol/:protocolId/requirement/:reqId` `{ status }` | `DOCUMENTS_VALIDATE` (= `'RECEPCION_VALIDAR'`) | `reception.controller.ts:300-313`; `shared/enums/permission.enum.ts:12`, `:23`. Solo cambia `status`; **no guarda texto** (§4 I, TSK-F02-12) |
| J | Verificar (el cliente decide `isComplete`) | `PATCH /reception/protocol/:protocolId/verify` `{ isComplete, missingItemsList?, reviewType? }` | `RECEPCION_VALIDAR` | `reception.controller.ts:86-98`; DTO `verify-reception.dto.ts`; servicio `reception.service.ts:598-695`. **F02 no lo usa** (E3; §4 K) |

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
- No dice si el requisito es **obligatorio**: `RequirementMapper.toResponse` devuelve solo `id`, `code`, `name`, `status`, `pageCount`, `observations` (`requirement.mapper.ts:4-14`). Hasta TSK-F02-12, toda fila sin documento y sin `NO_APLICA` cuenta como `sin revisar` (E11, §5.1).
- `globalStatus.missingItemsList` es `reception.missingItemsList` o `protocol.missingRequirements` (`:167-168`): después de `finalize` es la lista que calculó el backend (§4 K).

### B) `validate` — cuerpo y efecto

- DTO `ValidateDocumentDto { statusId: number; observations?: string; pageCount?: number }` (`reception/application/dtos/validate-document.dto.ts`). `statusId`: `1 APROBADO`, `2 RECHAZADO`, `3 OBSERVADO`, `4 PENDIENTE` (`reception/domain/enums/document-validation-status.enum.ts`).
- Guarda un registro en el historial de validaciones (`reception.service.ts:724-730`), marca el documento como validado y **sobrescribe `pageCount` del documento** (`:736`) **y del requisito** (`:753`) con el valor enviado: las páginas declaradas se pierden. Por eso F02 **no envía `pageCount`** (E10; TSK-F02-1 como mejora).
- Cualquier `statusId` distinto de `1` deja el requisito en `RECHAZADO` (`:744-748`) con `observations || ''` (`:750-754`): **la observación no es obligatoria en el backend** (TSK-F02-2). F02 envía `3` al observar (E17).
- Necesita un `documentId` en la ruta (`reception.controller.ts:158`): no sirve para un requisito sin documento (E11).
- No hay control de concurrencia: dos usuarios pueden validar el mismo documento y gana el último (TSK-F02-6). El protocolo tiene `@VersionColumn` `versionLock` (`protocols/infrastructure/database/protocol.entity.orm.ts:30-31`), que `toResponse` expone, pero ningún endpoint de recepción lo pide.
- Respuesta: `DocumentValidationMapper.toResponse(validation)`.

### C) `finalize` — efecto

- **No recibe cuerpo** (`reception.controller.ts:100-105`, solo `@Param('protocolId')`): las observaciones generales (E14) necesitan TSK-F02-11.
- 400 si queda algún documento subido sin validar (`reception.service.ts:212-222`).
- Recalcula los requisitos obligatorios según el tipo y las banderas del protocolo (`:224-236`) y arma la lista de faltantes: `APROBADO`/`NO_APLICA` → nada (`:248-254`); `RECHAZADO` → `{nombre} requiere corrección: {observación}` (`:256-261`); `PENDIENTE`/`NO_PRESENTADO` o sin fila → `Falta documento obligatorio: {nombre}` (`:264-270`). Esto **no cambia** con E11: `finalize` sigue agregando `Falta documento obligatorio` por su cuenta, también para obligatorios que no están en el checklist que ve la Secretaría.
- Sin faltantes: recepción `COMPLETO` (statusId 10), genera el código CEISH si no tiene, crea la versión 1, envía la constancia y avisa a la Presidencia; responde `{ status: 'COMPLETO', ceishCode, message }` (`:275-340`).
- Con faltantes: recepción `INCOMPLETO` (11), plazo de subsanación (`:343-345`), **sobrescribe** `reception.missingItemsList` con la lista calculada (`:346-347`) y manda el correo al investigador **solo con esa lista** (`sendReceptionIncomplete(…, missingList, …)`, `:352-361`); responde `{ status: 'INCOMPLETO', message, missingItems, deadline }` (`:363-369`). El plazo no se expone antes de cerrar (TSK-F02-10, E15).
- Es decir: **un solo endpoint** cubre "Enviar observaciones" y "Aprobar recepción"; el resultado lo decide el backend, no el botón.
- El año del código sale de `now.getFullYear()` del servidor (`:281`; igual en `verify`, `:667`): si el servidor está en UTC, una aprobación del 31/12 desde las 19:00 de Ecuador tendría el año siguiente (TSK-F02-7).

### I) Observar un requisito sin documento — evidencia (P4)

| Pregunta | Respuesta | Evidencia |
|---|---|---|
| ¿`PATCH …/requirement/:reqId` guarda un texto? | **No.** El controlador solo lee `@Body('status') status: RequirementStatus` (sin DTO, así que tampoco se valida que sea del enum) | `reception.controller.ts:300-313` (`:306`) |
| ¿Qué hace el servicio? | Busca el requisito por `id` y `protocolId` (404 si no) y guarda **solo** `status` | `reception.service.ts:697-709` |
| ¿Hay dónde guardar el texto? | Sí: la columna `observaciones` del requisito existe | `protocols/infrastructure/database/protocol-requirement.entity.orm.ts:26-27` |
| ¿Otro endpoint la escribe para un requisito sin documento? | **No.** `validate` la escribe pero exige un `documentId` (`reception.controller.ts:158`; `reception.service.ts:750-754`). `verify` solo guarda `missingItemsList` de la recepción (`:686`). `UpdateReceptionDto.observations` (`reception/application/dtos/update-reception.dto.ts:30-32`) es de la recepción y ningún endpoint del controlador usa ese DTO. Los únicos `@Patch`/`@Post` del controlador son `:67`, `:87`, `:101`, `:108`, `:130`, `:144`, `:151`, `:158`, `:301` | `grep -n "@Patch\|@Post\|UpdateReceptionDto" reception.controller.ts` |
| ¿`validation-detail` dice si es obligatorio? | **No** | `requirement.mapper.ts:4-14` |

Conclusión: **no se puede** guardar el texto de la observación de un requisito sin documento. Se crea **TSK-F02-12** (plan §8). Para su diseño en el backend: si el requisito observado queda `RECHAZADO` con el texto, `finalize` lo enviará como `requiere corrección: {texto}` (`:256-261`); si queda `NO_PRESENTADO`, el texto no llega al correo (`:264-270`). Se propone `RECHAZADO` (se decide en la spec del backend).

### K) Observaciones generales — evidencia (P14)

| Dónde | Qué hay | Evidencia |
|---|---|---|
| Frontend, pantalla anterior | Panel `Observaciones Generales (Para correo al investigador)` con un `textarea` (`rows="3"`, `[(ngModel)]="missingItemsList"`), visible para la Secretaría; se precarga con `globalStatus.missingItemsList` | `protocol-validation-detail.page.ts:377-408`, `:998`, `:1074` |
| Frontend, envío | `onFinalize` → `FinalizeDocumentaryValidationUseCase.execute(protocolId, isComplete, missingItemsList)` → `PATCH …/verify` con `{ isComplete, missingItemsList }` y después `POST …/finalize` sin cuerpo | `protocol-validation-detail.page.ts:1164-1173`; `finalize-documentary-validation.use-case.ts:11-19`; `protocol-api.adapter.ts` (`verifyProtocol` y `finalizeReception`, `:262-312`) |
| Backend, `verify` | Con `isComplete = false` guarda el texto en `reception.missingItemsList` (columna `lista_faltantes`) y pone la recepción en `INCOMPLETO` con plazo, **sin correo** | `reception.service.ts:684-691` (`:686`); `reception/infrastructure/database/reception.entity.orm.ts:48-49` |
| Backend, `finalize` | **Sobrescribe** `missingItemsList` con la lista calculada y manda el correo solo con esa lista | `reception.service.ts:346-347`, `:352-361` |
| Backend, otros | La columna `observaciones` de la recepción (`reception.entity.orm.ts:77-78`) no la escribe ningún método del servicio (`grep "\.observations\s*=" reception.service.ts`: sin resultados); `git grep -i -E "general\|missingItemsList\|observacion"` en `reception` y `protocols` no muestra otro endpoint ni otro uso en el correo | — |

Conclusión: las observaciones generales **existen en la pantalla anterior**, pero **no llegan al investigador**: `finalize` reemplaza el texto antes de mandar el correo, y además pasan por `verify`, que F02 no usa (E3). Por eso **TSK-F02-11 queda como necesaria**: aceptar un texto opcional en `finalize`, guardarlo y usarlo en el correo al investigador.

## 5. Reglas de diseño

**Registro:** producto (impeccable). Tabla densa, una acción por fila, color solo para estado; la acción principal arriba a la derecha, siempre visible.

### 5.1 Contadores y progreso

| Estado del requisito (backend) | Cuenta como | Texto en la fila |
|---|---|---|
| `APROBADO` | aprobado | chip verde `Aprobado` |
| `RECHAZADO` (con o sin documento) | con observación | chip rojo `Con observación` |
| `NO_APLICA` | no se cuenta en `n` | chip gris `No aplica` |
| `PRESENTADO` o `PENDIENTE` con documento | sin revisar | chip gris `Sin revisar` |
| `NO_PRESENTADO`, o cualquiera sin documento (salvo `RECHAZADO` y `NO_APLICA`) | **sin revisar** hasta que la Secretaría lo observe con texto (E11); `Aprobar` deshabilitado | chip ámbar `Sin documento` |
| otro valor | sin revisar, con `console.warn` | chip gris `Estado no reconocido` |

`n` = filas que se revisan (todas menos `NO_APLICA`, con o sin documento). `p` = `round(r / n × 100)`; con `n = 0`, `0 %` y el vacío de §5.5. Si TSK-F02-12 llega a entregar si el requisito es obligatorio, una fila **opcional** sin documento dejará de contar en `n` (se ajusta en T02-11).

### 5.2 Páginas (E10)

- `Declaradas` = `attachedDocument.pageCount` tal como llega; `null` → `Sin dato` (nunca `1`, E6).
- `Contadas` = entero ≥ 1 escrito por la Secretaría; otro valor → `Escriba un número entero mayor que 0.`. **No se envía** al backend (ni en `Aprobar` ni en `Observar`): solo sirve para comparar y para rellenar la observación.
- Si `Contadas ≠ Declaradas` (ambas presentes): aviso `Las páginas no coinciden (declaradas {d}, contadas {c})` con icono, texto y tono ámbar (`aria-live="polite"`); **`Aprobar` deshabilitado** con `Las páginas no coinciden: observa el documento`; al pulsar `Observar`, el `textarea` llega con `Páginas declaradas {d}, contadas {c}` (editable).
- Por confirmar (interpretación): `Contadas` vacía no bloquea `Aprobar` (se aprueba como hoy) y, con `Declaradas` `Sin dato`, no hay comparación.
- **Limitación** (E10): lo contado no se guarda como dato aparte; solo queda dentro del texto de la observación. Si la fila no se observó, el valor de `Contadas` se pierde al recargar. Se resuelve con TSK-F02-1 (mejora).

### 5.3 Estado de la cabecera

- El chip de estado muestra el estado de recepción. Con los códigos de `receptionStatus` que hoy se ven en recepción: `EN_REVISION_SECRETARIA`/`PENDIENTE` → `Por validar` (ámbar), `INCOMPLETO` → `Con observaciones enviadas` (rojo), `COMPLETO` → `Recepción aprobada` (verde), `ARCHIVADO` → `Archivado` (gris). Otro código: `Estado no reconocido` (gris). Lo ideal es que el backend entregue el texto legible (TSK-F02-3); hasta entonces, esta tabla es la única fuente y se valida con la Secretaría (P7).
- Etapa: `StageBar` con la etapa del backend (TSK-F02-3). Sin etapa: la barra no se muestra (no se supone `Recepción`).

### 5.4 Fechas

`submissionDate`, `uploadedAt`, `deadline` y las fechas del recorrido son instantes ISO: `fechaHoraEcuador` (`dd/MM/yyyy, HH:mm`) o `fechaEcuador` (`dd/MM/yyyy`) de `fecha-ecuador.util` (F01 T01-1). Inválida → `Fecha no disponible`. El frontend no calcula la fecha límite (E15).

### 5.5 Estados

| Bloque | Cargando | Vacío | Error | Guardando | Conflicto |
|---|---|---|---|---|---|
| Cabecera | `LoadingState` `Cargando el protocolo…` | — | `ErrorState` `No pudimos cargar el protocolo.` + Reintentar (sin pestañas) | — | — |
| Recepción | `LoadingState` `Cargando la lista de verificación…` | `No hay documentos para revisar. El investigador aún no ha subido archivos.` | `ErrorState` `No pudimos cargar la lista de verificación.` + Reintentar | por fila: botones deshabilitados y `Guardando…` (`aria-live="polite"`); el resto de la tabla sigue usable | 409 del backend (cuando exista, TSK-F02-6): aviso `Otro usuario cambió esta recepción. Recargue para ver los cambios.` + `Recargar`; no se reintenta solo |
| Validar una fila | — | — | aviso en la fila `No se guardó. Intente de nuevo.` + Reintentar; el estado anterior de la fila se conserva | — | — |
| Abrir un documento | botón `Abriendo…` deshabilitado | — | aviso en la fila `No se pudo abrir el documento.` + `Reintentar` (error del backend o enlace que no es `https:`); nunca un error de página | — | — |
| Acción final | — | — | `ErrorState` en la confirmación con el mensaje del backend (por ejemplo el 400 de `finalize`); las observaciones generales escritas se conservan | botón `Enviando…` deshabilitado | igual que arriba |

Los errores nunca se muestran como "sin documentos".

### 5.6 Accesibilidad (checklist de ui-ux-pro-max; manda el repo cuando choca)

1. Orden de teclado = orden visual: migas → acción principal → pestañas → contadores → tabla (por fila: documento, contadas, Aprobar, Observar, observación) → observaciones generales.
2. Foco visible de 2 px con `--c-primary`. Al entrar, foco al `h1` (`tabindex="-1"`). Al cambiar de pestaña, foco al panel (`role="tabpanel"`, `aria-labelledby`).
3. `Aprobar`/`Observar` con `aria-pressed` y `aria-label` con el nombre del requisito; 44 px de alto (`--min-h-action`). Un `Aprobar` deshabilitado tiene su motivo en texto visible, enlazado con `aria-describedby`.
4. Los `textarea` (`Observación` y `Observaciones generales del protocolo`) y el campo `Contadas` tienen `label` visible, `aria-invalid` y el error en `aria-describedby`; la observación por documento, `aria-required="true"`. Los `textarea` tienen `maxlength` y el contador `{c} / {máx} caracteres` en `aria-describedby` (sin `aria-live` en cada tecla).
5. Aviso de páginas, `Abriendo…`, `No se pudo abrir el documento.` y el estado de guardado en `aria-live="polite"`; el error de la acción final en `role="alert"`.
6. La barra de progreso con `role="progressbar"` y valores; el porcentaje también en texto.
7. Color nunca solo: chips con texto, fila observada con borde **y** chip, aviso de páginas con icono **y** texto.
8. Contraste AA con los tonos de F00 (F01 spec-ui §5.6.8).
9. Tabla con `caption` y `th scope="col"`; el botón del documento dice `(se abre en otra pestaña)`.
10. Pestañas con `role="tablist"`/`tab`, flechas para moverse (`Tabs` de `shared/ui` ya lo hace).

## 6. Interacciones

- **Aprobar:** un clic envía `POST …/validate` con `statusId 1`, **sin `pageCount`** (E10). La fila pasa a `Guardando…` y luego a `Aprobado`. Deshabilitado sin documento (E11) o con páginas que no coinciden (E10).
- **Observar:** abre el `textarea` (relleno con `Páginas declaradas {d}, contadas {c}` si no coinciden); `Guardar observación` exige texto (recortado, de 5 a 1000 caracteres, por confirmar P8) y envía `statusId 3` (E17) con `observations`, sin `pageCount`. `Cancelar` vuelve al estado anterior sin llamar al backend. En una fila sin documento, `Observar` llama a la ruta de TSK-F02-12 (T02-11); hasta entonces, deshabilitado (E11).
- **Cambiar de opinión:** pulsar el otro botón de una fila ya revisada vuelve a validar (el backend guarda el historial).
- **Abrir el documento (E13):** al pulsar, y no antes, se pide `GET …/download-url` (el enlace caduca); el botón pasa a `Abriendo…` y queda deshabilitado; con la respuesta, la URL pasa por la regla de `https:` (§7) y se abre con `window.open(url, '_blank', 'noopener,noreferrer')` dentro del `subscribe`, la misma técnica de la pantalla anterior (`protocol-validation-detail.page.ts:1038-1049`, `:1042`), que hoy abre sin que el navegador la bloquee. Con `noopener`, `window.open` devuelve `null` aunque abra, así que no se puede detectar un bloqueo; si un navegador la bloquea, se documenta en la prueba de humo. Error del backend o URL no válida → aviso en la fila con `Reintentar`; no se abre nada.
- **Observaciones generales:** se escriben debajo de la tabla y se envían con `Enviar observaciones` (§3.3, TSK-F02-11).
- **Acción final:** confirmación (con el plazo de 30 días, E15) → `POST …/finalize` (con las observaciones generales cuando exista TSK-F02-11) → aviso con el resultado (fecha límite `deadline` si hubo observaciones) → se recarga la cabecera y la pestaña; el contador del menú (`PendingCountPort`) se refresca.
- **Pestañas:** cambian el segmento de la URL; recargar o volver atrás reproduce la pestaña.

## 7. Seguridad (angular-security)

1. Sin `innerHTML`, `outerHTML` ni `bypassSecurityTrust*`. Todo con interpolación.
2. Mappers estrictos con `contract-readers`: la observación es `nullableStr` (un objeto lanza `ContractError`, nunca `[object Object]`).
3. `downloadUrl` se acepta **solo si es `https:`**; `javascript:`, `data:`, `blob:`, `http:`, `ftp:`, texto que no es URL o un valor que no es texto → no se abre nada y sale el aviso de la fila. `safeHttpUrl` de F01 acepta también `http:` (`src/infrastructure/mappers/contract-readers.ts:98-106`) y no se cambia (lo usa F01): F02 agrega `safeHttpsUrl` en el mismo archivo (plan §2.2). Se abre con `noopener,noreferrer`; hoy el código abre sin ellos (`protocol-validation-detail.page.ts:1042`).
4. El enlace se pide al hacer clic y no se guarda en el estado de la pantalla (caduca y da acceso al archivo).
5. El texto de las observaciones se recorta y se limita (5–1000 por documento, hasta 2000 la general; por confirmar, P8) antes de enviarlo; el backend debería validar lo mismo (TSK-F02-2, TSK-F02-11).
6. Hallazgos del backend que no resuelve el frontend (tareas TSK): `download-url`/`view` sin permiso (cualquier usuario con sesión pide el enlace de cualquier documento por id; el enlace es temporal, pero el acceso por id sigue abierto: TSK-F02-8, sin bloquear), `GET /protocols/:id` y `GET /audit/protocol/:id` sin permiso.

## 8. Criterios de aceptación

1. Con rol SECRETARIA, `/protocolos/:id/recepcion` muestra el espacio del protocolo dentro del AppShell; con INVESTIGADOR (o PRESIDENTE, E16) vuelve a su inicio con aviso (criterio 4 de F00).
2. La fila `VALIDAR` de Mis pendientes navega a `/protocolos/{protocolId}/recepcion` (P2).
3. Las migas dicen `Por validar › {ceishCode}`; sin código, `Sin código`; `Por validar` lleva a `/protocolos?etapa=RECEPCION` (P3).
4. La cabecera muestra los chips, el título, `Investigador: … · Enviado el dd/MM/yyyy, HH:mm · n documentos` en hora de Ecuador y la barra de etapas; los rellenos del backend no se muestran como datos.
5. La pestaña activa sale de la URL; `/protocolos/:id` abre la pestaña por defecto (propuesta P2: `recepcion`); un segmento desconocido vuelve a la pestaña por defecto (`recepcion`), con `replaceUrl`.
6. La pestaña Recepción muestra los contadores, `Progreso de validación · r de n` y el porcentaje, y una fila por requisito con nombre y código.
7. `Aprobar` envía `statusId 1` sin `pageCount`; `Observar` no envía nada hasta escribir la observación; con texto vacío, solo espacios, menos del mínimo o más del máximo (P8) muestra el error y no envía; el contador de caracteres se ve.
8. Una observación que llega como objeto produce `ContractError` y `ErrorState` (nunca `[object Object]`).
9. Páginas: declaradas como dato; `Contadas` como campo entero ≥ 1 que nunca se envía; si no coinciden, el aviso con icono y texto (no solo color), `Aprobar` deshabilitado con `Las páginas no coinciden: observa el documento` y la observación rellena con `Páginas declaradas d, contadas c` (E10).
10. La fila observada se resalta con borde y chip.
11. Botón principal: deshabilitado con `Falta revisar N documento(s)` mientras `s > 0` (incluidos los requisitos sin documento sin observar); `Enviar observaciones` con algo observado; `Aprobar recepción` con todo aprobado (E9); sin acción con la recepción cerrada.
12. La acción final pide confirmación y llama solo a `POST …/finalize`; la confirmación de `Enviar observaciones` dice `El investigador tendrá 30 días para corregir.` y el resultado muestra la fecha `deadline` en hora de Ecuador (E15).
13. Un error al validar una fila no cambia su estado y no afecta a las demás.
14. Un 409 muestra el aviso de conflicto con `Recargar` (cuando el backend lo emita, TSK-F02-6).
15. Abrir el documento: el enlace **no** se pide al cargar la tabla, solo al pulsar; mientras se pide, el botón dice `Abriendo…` y está deshabilitado; una URL `https:` se abre con `noopener,noreferrer`; con `javascript:` (u otra que no sea `https:`) o un error del backend no se abre nada y sale `No se pudo abrir el documento.` con `Reintentar` en la fila.
16. El Recorrido nunca muestra eventos simulados; vacío y error tienen su estado.
17. Ningún archivo de `presentation`/`application` de F02 importa `@angular/common/http` ni `infrastructure` (regla de eslint).
18. Sin hex nuevos, sin `innerHTML` ni `bypassSecurityTrust*`.
19. Fila sin documento: chip `Sin documento`, cuenta como `sin revisar`, `Aprobar` deshabilitado con `No hay documento para aprobar.`; sin TSK-F02-12, `Observar` deshabilitado con su motivo; con T02-11, `Observar` guarda el texto y la fila pasa a `Con observación` (E11).
20. Observaciones generales (T02-10): opcionales, con contador (máximo 2000, P8), se envían en el cuerpo de `finalize` con `Enviar observaciones` y se conservan si el envío falla; nunca por `PATCH …/verify`.

## 9. Pendientes

- **Bloqueos de backend**, en el orden de prioridad de `tasks.md`: observaciones generales (TSK-F02-11 → T02-10) y observar un requisito sin documento (TSK-F02-12 → T02-11); el Recorrido (TSK-F02-5 → T02-7). Mejoras que no bloquean: TSK-F02-1 (páginas contadas como dato), TSK-F02-10 (fecha del plazo antes de enviar), TSK-F02-2 (validar la observación en el backend). Mientras tanto: `Contadas` provisional (E10); no hay bloque de observaciones generales; la fila sin documento no se puede observar (E11, provisional); la confirmación dice `30 días`; la pestaña Recorrido muestra `ErrorState`/`EmptyState` honestos o se oculta (P10).
- **Código actual que no se reutiliza** (Paso 0, plan §5): `ProtocolValidationDetailPage` (1319 líneas, `ngModel` sobre el objeto de la respuesta, `|| 1` en páginas, `window.open` sin `noopener`, observaciones generales por `verify`); `AuditRepositoryAdapter.getProtocolTrail` devuelve un recorrido **simulado** con `integrityHash` inventado cuando la respuesta viene vacía o falla (`features/audit/infrastructure/adapters/audit-repository.adapter.ts:148`, `:164`, `:160`, `:198-217`).
- **Permisos del frontend que no existen en el backend:** `DOCUMENTOS_VALIDAR` y `RECEPCION_VER` (`src/features/protocols/routes.ts:73`) no están en `Permission` del backend (`shared/enums/permission.enum.ts:11-24`); con `permissionStrategy: 'any'` solo funciona `RECEPCION_VALIDAR`. F02 usa los nombres del backend (`RECEPCION_LISTA`, `RECEPCION_VALIDAR`).
- **Retiro** de `ProtocolValidationDetailPage`, `ProtocolValidationListPage` y la acción `Aprobar Todo` del espacio antiguo (`protocol-workspace.component.ts:555-557`): tarea T02-R1, cuando F02 esté en uso y no antes de T02-11 (E11).
- **F01 §9.1 (Protocolos por etapa):** las columnas de Recepción (`Recibido · Requisitos revisados`) y sus filtros (`Por revisar`, `Con observaciones`, `Esperando aceptación de tiempos`) necesitan contadores por protocolo que `GET /protocols` no entrega; siguen pendientes (fuera de F02). El destino del clic en una fila de Recepción (F01 §9.1: `Validar documentos`) será esta pantalla cuando las filas naveguen (D5 de F01 sigue vigente).

### 9.1 Diferencias con el canvas

| # | Canvas | F02 | Motivo | Estado |
|---|---|---|---|---|
| DC1 | Observación como "[object Object]" | Texto | Error del mock (E1) | Decidido |
| DC2 | Una sola acción `Enviar observaciones` | `Enviar observaciones` o `Aprobar recepción` según los contadores | RF-05.2 del backend; confirmado en la reunión (E9) | Decidido (06/11/2026) |
| DC3 | Páginas contadas editables desde ya, en la fila (`03`) y junto al documento abierto (`Páginas contadas`, `0301`/`0303`) | Campo `Contadas` en la fila desde ya, solo para comparar: no se envía y, si no coinciden, obliga a observar (E10). Solo en la fila (E13) | El backend sobrescribe las declaradas al guardar (`reception.service.ts:736`, `:753`); guardarlas aparte es TSK-F02-1 (mejora) | Decidido (06/11/2026), provisional hasta TSK-F02-1 |
| DC4 | Clic en el documento (`Documento (clic para revisar)`) abre un **visor** en diálogo (`0301`–`0303`) | El documento se abre **en otra pestaña**, con el lector de PDF del navegador, como hoy (E13) | Decisión de la Secretaría | **No adoptado** (decisión de la Secretaría, 06/11/2026) |
| DC5 | La fila con páginas distintas se marca solo con fondo y borde ámbar (fila `Instrumentos…`, `03`) | Además del color, aviso con icono y texto `Las páginas no coinciden (declaradas d, contadas c)` (§5.2) y `Aprobar` deshabilitado (E10) | Color nunca solo (§5.6.7) | Decidido |
| DC6 | Campo de observación visible en **todas** las filas, también en las aprobadas; `Aprobar`/`Observar` en la tabla como iconos ✓/✗ sin texto | El campo se abre solo al pulsar `Observar` y la fila muestra la observación guardada (§3.1); botones con texto visible `Aprobar`/`Observar` y `aria-label` con el requisito | Un campo vacío en filas aprobadas sugiere que falta algo; un icono solo no dice la acción (§5.6.3) | Propuesta |
| DC7 | Bajo la tabla (`0303`) un bloque con el texto `Se envían junto con las observaciones de cada documento.`: **observaciones generales** | Bloque `Observaciones generales del protocolo` (§3.3, T02-10) | Confirmado en la reunión (E14). Hoy no llegan al investigador (§4 K): TSK-F02-11 | **Adoptado** (06/11/2026); bloqueado por TSK-F02-11 |

## 10. Preguntas abiertas

| # | Pregunta | Para | Propuesta |
|---|---|---|---|
| P2 | ¿La pantalla vive en `/protocolos/:id/{pestaña}` (nueva, bajo el AppShell) y `VALIDAR` de Mis pendientes cambia a `/protocolos/:id/recepcion`? ¿Pestaña por defecto `resumen` o `recepcion`? | Usuaria (equipo) | Sí; por defecto `recepcion` (la ruta redirige siempre ahí, plan §4; elegir según el estado exigiría cargar antes de redirigir) |
| P3 | Al hacer clic en "Por validar", arriba a la izquierda, ¿a qué pantalla vuelve: la lista de Protocolos en Recepción o Mis pendientes? | Secretaría | La lista de Protocolos en Recepción (`/protocolos?etapa=RECEPCION`, F01) |
| P5 | Confirmar: ¿la confirmación muestra el plazo **antes** de enviar? (La respuesta quedó cortada en "antes de enviar".) | Secretaría | Sí: `El investigador tendrá 30 días para corregir.` (E15); la fecha exacta, con la respuesta de `finalize`; con TSK-F02-10 (mejora), la fecha antes de enviar |
| P7 | Textos del chip de estado (§5.3) | Secretaría | Los de §5.3, hasta que el backend entregue el texto (TSK-F02-3). Sigue abierta tras la reunión |
| P8 | Confirmar los límites: observación por documento de 5 a 1000 caracteres, observaciones generales hasta 2000, `textarea` de unas 4 líneas con contador. ¿Las generales también se envían al aprobar? | Secretaría | Los números de E12; las generales solo con `Enviar observaciones` |
| P10 | Mientras el Recorrido esté bloqueado, ¿se oculta la pestaña o se muestra con un aviso? | Usuaria | Se muestra con `Recorrido no disponible todavía.` (sin datos) |

Por confirmar dentro de decisiones ya tomadas: E10 (`Contadas` vacía no bloquea; `Declaradas` `Sin dato` sin comparación) y E11 (comportamiento mientras no exista TSK-F02-12).

Resueltas: P1 (E9), P4 (E11), P6 (E10), P11 (E16), P13 (E13) y P14 (E14) el 06/11/2026; P9 con el enum del backend (E17) y P12 con el cotejo de §9.1 (0.2).
