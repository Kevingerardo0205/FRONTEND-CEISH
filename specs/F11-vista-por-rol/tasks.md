# F11 · Qué ve cada rol de un protocolo — tasks

**Versión:** 0.2 · **Fecha:** 20/11/2026 · Spec: `spec-ui.md` v0.2 · Plan: `plan.md` v0.2.

**Línea base (20/11/2026, `975b8e5`):** `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit` exit 0; `npx ng test --watch=false` tres veces: `2 FAILED` de 1518 (nombres no guardados) · `1 FAILED, 1517 SUCCESS` · `1 FAILED, 1517 SUCCESS` (las dos con «NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c) nuevo diseño (D15, C2d) con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra», prueba de foco ya anotada en F00); `npx ng build --configuration production` exit 0; `npx eslint "src/**/*.ts"` `✖ 65 problems (0 errors, 65 warnings)`.
**Verificación:** `npx tsc` app y spec dos veces · `npx ng test --watch=false` tres veces, con los nombres de lo que falle · `npx ng build --configuration production` · `npx eslint` (ningún archivo empeora).

## 1. Frontend

| Tarea | Contenido | Depende del backend | Estado |
|---|---|---|---|
| **EP2** · La PRESIDENTE ve Recepción en solo lectura | spec-ui §4, EARS F11-1 a F11-7; plan EP2 | No | Hecho (`8b927e7`; resultados abajo) |
| EP3 · Lista de documentos compartida | Una sola pieza en lugar de la lista vacía del Resumen; la usan los 4 roles | Sí, para el investigador (B6) | Pendiente |
| EP4 · El investigador sin datos internos | Sin la bitácora para INVESTIGADOR, sin la bitácora inventada para nadie; en Subsanaciones, perfil y dictamen de cada par sin nombres y sin los informes con nombre (V5) | B2 y B8 (la pantalla no los espera) | Hecho (`91bca59`; resultados abajo) |
| EP5 · Pantalla del evaluador | `ProtocolHeader` (código, título, tipo), la lista de EP3 y el plazo (V6) | B4 y B6 | Pendiente |
| EP6 · Espacio por etapas | Las 6 etapas para SECRETARIA y PRESIDENTE; las cerradas en solo lectura (V2) | — | Pendiente |
| EP7 · Resolución firmada | La SECRETARIA la sube; INVESTIGADOR y PRESIDENTE la ven (V7) | B11 | Pendiente |
| EP8 · Notificaciones reales | `notification-repository.adapter.ts` devuelve notificaciones inventadas (`of([...])`, códigos PRT-2024-00x) a todos los roles | Sí (no hay endpoint) | Pendiente (Paso 0 de EP4) |
| EP9 · Pestaña Seguimiento sin datos inventados | `adverse-events-list.page.ts:162-180` (pestaña Seguimiento del espacio) muestra eventos adversos inventados de otros protocolos, también al investigador | Sí | Pendiente (Paso 0 de EP4) |
| EP10 · Eventos adversos y renovaciones sin éxito falso | `eventos-adversos.page.ts`, `renovaciones.page.ts`, `renewal-request.page.ts` y `adverse-event-form.page.ts` no llaman al backend y muestran un éxito («Se notificó a Secretaría y Presidencia») | Sí | Pendiente (Paso 0 de EP4) |
| EP11 · Carta consolidada sin ruta armada | `subsanacion.page.ts`, `downloadConsolidatedPdf`: si el backend no da la ruta o falla, arma `protocols/{id}/resolutions/Carta_Resolucion_Consolidada.pdf` a mano | Sí | Pendiente (Paso 0 de EP4) |
| EP12 · Asistente de IA con trato de usted | El saludo del asistente (`ai-assistant.component.ts`) trata de tú («Estoy aquí para ayudarte») | No | Pendiente (Paso 0 de EP4) |
| EP13 · Inventario de datos simulados | Inventario de pantallas y adaptadores con datos simulados (`of([...])`, mocks, éxitos falsos) en todo el frontend, con una tarea por hallazgo. Ya vistos en EP4: `getLogs` con la entidad fija `'Protocol'`, la acción por defecto `'UPDATE'` y `'Sistema'` cuando falta el usuario; frases de `getActionText` del feed que no corresponden a las acciones reales del backend | — | Pendiente (Paso 0 de EP4) |

### EP4 · El investigador sin datos internos

- **Capas:** domain (`workspace-tab-roles.ts`, `audit.entity.ts`, `dictamen.catalog.ts`, `IEvaluationRepositoryPort.ts`), application (`load-subsanacion-detail.use-case.ts`), infrastructure (`audit-repository.adapter.ts`, `evaluation-api.adapter.ts`) y presentation (`protocol-detail-tab.component.ts`, `protocol-trail.page.ts`, `audit-logs.page.ts`, `audit-feed.component.ts`, `subsanacion.page.ts`).
- **Terminado cuando:** EARS F11-8 a F11-17 con prueba; mutaciones M1 a M8 detectadas y revertidas; verificación completa sin archivos que empeoren.
- **Mutaciones previstas:** M1 bitácora del Resumen sin la comprobación de rol (el INVESTIGADOR la pide y la ve); M2 `raw.length === 0 → getMockTrail`; M3 `catchError → of(getMockTrail)`; M4 error de la bitácora solo con `console.error`; M5 vuelven los enlaces `reportPath`, `rutaPdf` y `rutaDocx`; M6 el adaptador de `observations` pasa la respuesta tal cual; M7 vuelve la huella `sha256-{id}-{fecha}`; M8 dictamen con la tabla anterior (`3 → NO_APROBADO`, sin dictamen → `PENDIENTE`). También: M2b y M3b (`getLogs` con `mockLogs`) y M4b (feed con `catchError(() => of([]))`).

**Resultados de EP4 (21/11/2026, código `91bca59`, docs `b31f632`)**
- Línea base (`ba1b9c4`): `npx tsc` app y spec dos veces exit 0; `npx ng test --watch=false` `TOTAL: 1 FAILED, 1529 SUCCESS` (solo «DialogComponent al abrir, el foco entra al diálogo y queda atrapado»); build de producción exit 0; `npx eslint "src/**/*.ts"` `✖ 65 problems (0 errors, 65 warnings)`.
- `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`, dos veces: exit 0 las cuatro.
- `npx ng test --watch=false` tres veces: `2 FAILED, 1563 SUCCESS` · `1 FAILED, 1564 SUCCESS` · `1565 SUCCESS` (1565 pruebas; línea base 1530, 35 nuevas). Fallaron solo las dos pruebas de foco ya anotadas en F00: «DialogComponent al abrir, el foco entra al diálogo y queda atrapado» (corridas 1 y 2) y «NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c) nuevo diseño (D15, C2d) con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra» (corrida 1). Ninguna de EP4.
- `npx ng build --configuration production`: exit 0 (19 avisos `WARNING`, los mismos 19 de la línea base: `canvg` no ESM).
- `npx eslint "src/**/*.ts"`: `✖ 64 problems (0 errors, 64 warnings)` (línea base 65). Desaparece el `no-explicit-any` de `load-subsanacion-detail.use-case.ts:31`; los demás avisos de los archivos tocados son los de `dev` con otra línea (`audit-repository.adapter.ts` 111 y 144 → 32 y 59; `audit-logs.page.ts` 338 → 362; `subsanacion.page.ts:41` e `IEvaluationRepositoryPort.ts:7` sin cambio). Ningún archivo empeora. Las `*.spec.ts` están ignoradas por la configuración de eslint.
- **Nota:** el feed «Actividad Reciente» (`audit-feed.component.ts`) no lo monta ninguna pantalla hoy (`git grep "app-audit-feed\|AuditFeedComponent" -- src` solo da su propio archivo); se le aplicaron los estados de §5 igual, como pidió la usuaria. Su retiro o su montaje es otra tarea.
- Mutaciones (cada una revertida con el mismo script, comprobando que las sumas `md5sum` de los 20 archivos cambiados son las de antes y `git diff --stat` igual: `18 files changed, 806 insertions(+), 367 deletions(-)`). Corridas con `npx ng test --watch=false --include=<spec>`:

| # | Qué se rompió (código anterior) | Prueba que falla | Línea |
|---|---|---|---|
| M1 | `showAuditTrail()` devuelve `true` (bitácora para cualquier rol, como antes) | «… bitácora del Resumen (F11 EP4) con INVESTIGADOR activo no pide la bitácora ni la muestra (F11-8)»; «… con EVALUADOR activo …» | `TOTAL: 2 FAILED, 22 SUCCESS` |
| M2 | `getProtocolTrail`: `raw.length === 0` → eventos de respaldo | «AuditRepositoryAdapter (F11 EP4) getProtocolTrail lista vacía del backend → lista vacía, sin eventos de respaldo (F11-10)»; «… { data: [] } → lista vacía (F11-10)» | `TOTAL: 2 FAILED, 20 SUCCESS` |
| M2b | `getLogs`: `raw.length === 0` → registros de respaldo | «AuditRepositoryAdapter (F11 EP4) getLogs lista vacía del backend → lista vacía, sin registros de respaldo (F11-10)» | `TOTAL: 1 FAILED, 21 SUCCESS` |
| M3 | `getProtocolTrail` con `catchError(() => of(<eventos de respaldo>))` | «… getProtocolTrail error del backend → el error se propaga, sin eventos de respaldo (F11-11)» | `TOTAL: 1 FAILED, 21 SUCCESS` |
| M3b | `getLogs` con `catchError(() => of(<registros de respaldo>))` | «… getLogs error del backend → el error se propaga, sin registros de respaldo (F11-11)» | `TOTAL: 1 FAILED, 21 SUCCESS` |
| M4 | Error de la bitácora del Resumen solo con `console.error` | «… bitácora del Resumen (F11 EP4) error: «No pudimos cargar la bitácora del protocolo.» con Reintentar, nunca el vacío; Reintentar vuelve a pedirla (F11-11)» | `TOTAL: 1 FAILED, 23 SUCCESS` |
| M4b | Feed: el error se muestra como vacío (como `catchError(() => of([]))`) | «AuditFeedComponent - estados (F11 EP4) error: mensaje con Reintentar, nunca el vacío; Reintentar vuelve a pedirla (F11-11)» | `TOTAL: 1 FAILED, 3 SUCCESS` |
| M5 | Vuelven los enlaces `reportPath`, `rutaPdf` y `rutaDocx` | «SubsanacionPage tarjetas de los pares (F11 EP4) sin enlaces a los informes individuales (PDF adicional, PDF oficial ni Word), aunque lleguen sus rutas (F11-15)» | `TOTAL: 1 FAILED, 15 SUCCESS` |
| M6 | El adaptador de `observations` pasa la respuesta tal cual | «EvaluationApiAdapter (Infrastructure) getProtocolObservations (F11 EP4) deja pasar solo los campos de ObservationEntry: sin reportPath, nombres, ids ni correos (F11-17)» | `TOTAL: 1 FAILED, 11 SUCCESS` |
| M7 | Vuelve la huella `sha256-{id}-{fecha}` (adaptador y Resumen) | «AuditRepositoryAdapter (F11 EP4) getProtocolTrail hace GET /api/audit/protocol/5 y mapea los eventos reales, sin huella (V13)»; «… bitácora del Resumen (F11 EP4) sin huella: no muestra «Huella Digital» ni «SHA-256» ni «Hash» (F11-13, V13)» | `TOTAL: 2 FAILED, 44 SUCCESS` |
| M8 | Dictamen con la tabla anterior (`3 → NO_APROBADO`, sin dictamen → `PENDIENTE`) | «SubsanacionPage tarjetas de los pares (F11 EP4) dictamen con los códigos de EvaluatorDictamen; sin dictamen «Sin dictamen registrado», nunca «PENDIENTE» (F11-16)» | `TOTAL: 1 FAILED, 15 SUCCESS` |

- **No detectable por mutación:** F11-14 (sin nombres, ids ni correos en las tarjetas). La plantilla nunca los mostró; la prueba es una guardia para cambios futuros.
- **Pendiente:** revisión en el navegador con INVESTIGADOR, SECRETARIA y PRESIDENTE (la hace la usuaria). Backend: B2, B8 y B12.

### EP2 · La PRESIDENTE ve Recepción en solo lectura

- **Capas:** domain (`workspace-tab-roles.ts`) y presentation (`protocol-validation-detail.page.ts`).
- **Pruebas:** `protocol-validation-detail.page.spec.ts`, `src/app/workspace-routes.spec.ts`, `src/features/route-roles.spec.ts`, `protocol-workspace.component.spec.ts`.
- **Terminado cuando:** EARS F11-1 a F11-7 con prueba; mutaciones M1 a M8 detectadas y revertidas; verificación completa sin archivos que empeoren.
- **Mutaciones previstas:** M1 sin PRESIDENTE en `WORKSPACE_TAB_ROLES.validation`; M2 rama de la Secretaría con `!isInvestigador()`; M3 constancia con `(!isInvestigador() || isFinalized())`; M4 observaciones generales con `!isInvestigador()`; M5 sin la salida temprana de los métodos; M6 `isReadOnlyMode` con `isFinalized()` para quien no es investigador; M7 celda de estado con `isInvestigador()`; M8 cuadro de observaciones generales sin `[disabled]` (V9).

**Resultados de EP2 (20/11/2026, código `8b927e7`, docs `82b2dc5`)**
- `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`, dos veces: exit 0 las cuatro.
- `npx ng test --watch=false` tres veces: `1 FAILED, 1529 SUCCESS` · `2 FAILED, 1528 SUCCESS` · `1 FAILED, 1529 SUCCESS` (1530 pruebas; línea base 1518, 12 nuevas). Fallaron solo las dos pruebas de foco ya anotadas en F00: «DialogComponent al abrir, el foco entra al diálogo y queda atrapado» (las tres corridas) y «NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c) nuevo diseño (D15, C2d) con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra» (corrida 2). Ninguna de EP2.
- `npx ng build --configuration production`: exit 0.
- `npx eslint "src/**/*.ts"`: `✖ 65 problems (0 errors, 65 warnings)` (línea base 65). `workspace-tab-roles.ts` sin avisos (como en `dev`); `protocol-validation-detail.page.ts` con el mismo aviso de `dev` (`no-explicit-any` de `verDocumento`, línea 1042 → 1055). Las `*.spec.ts` están ignoradas por la configuración de eslint.
- Mutaciones (cada una revertida editando; después de revertir, `git diff --stat` igual al de antes y las cuatro specs afectadas `TOTAL: 108 SUCCESS`). Corridas con `npx ng test --watch=false --include=<spec>`:

| # | Qué se rompió (código anterior) | Prueba que falla | Línea |
|---|---|---|---|
| M1 | `validation: ['SECRETARIA', 'INVESTIGADOR']` | «PRESIDENTE abre validation»; «PRESIDENTE abre validation desde /dashboard/protocols/validation/detail/1, sin aviso (F11 EP2)»; «WORKSPACE_TAB_ROLES y PROTOCOL_ROUTES contienen las mismas tres filas con RoleGuard»; «Route role codes (T13a) mantiene la tabla ruta → roles de las decisiones D2, D4 y D5»; «PRESIDENTE ve Resumen, Validación (solo lectura, F11 EP2) y Seguimiento aprobado…» | `TOTAL: 5 FAILED, 86 SUCCESS` |
| M2 | Aprobar/Rechazar con `*ngIf="!isInvestigador()"` | «PRESIDENTE en revisión de la Secretaría / con la recepción validada: sin Aprobar ni Rechazar ni campos de páginas u observación (F11-2)» | `TOTAL: 2 FAILED, 15 SUCCESS` |
| M3 | Constancia con `(!isInvestigador() \|\| isFinalized())` | «PRESIDENTE en revisión… / con la recepción validada: sin Finalizar, sin constancia y sin aviso legal (F11-2, V8)» | `TOTAL: 2 FAILED, 15 SUCCESS` |
| M4 | Cuadro de observaciones generales con `*ngIf="!isInvestigador()"` | «PRESIDENTE en revisión… / con la recepción validada: sin el cuadro de observaciones generales (F11-2)» | `TOTAL: 2 FAILED, 15 SUCCESS` |
| M5 | Sin la salida temprana de `onValidateItem` | «PRESIDENTE: validar, cambiar páginas y finalizar no llaman al backend (F11-5)» | `TOTAL: 1 FAILED, 16 SUCCESS` |
| M5b | Sin la salida temprana de `onFinalize` | La misma (F11-5) | `TOTAL: 1 FAILED, 16 SUCCESS` |
| M5c | `onChangePageCount` sin `!this.canValidate()` | La misma (F11-5) | `TOTAL: 1 FAILED, 16 SUCCESS` |
| M6 | `isReadOnlyMode` sin `if (!this.canValidate()) return true` | «PRESIDENTE en revisión de la Secretaría: ve estado, páginas, observaciones y progreso en lectura (F11-3)» (con la recepción validada `isFinalized()` ya da verdadero) | `TOTAL: 1 FAILED, 16 SUCCESS` |
| M7 | Celda de estado con `*ngIf="isInvestigador()"` | «PRESIDENTE en revisión… / con la recepción validada: ve estado, páginas, observaciones y progreso en lectura (F11-3)» | `TOTAL: 2 FAILED, 15 SUCCESS` |
| M8 | Cuadro de observaciones generales sin `[disabled]="isFinalized()"` | «SECRETARIA con la recepción validada: el cuadro de observaciones generales está deshabilitado (F11-6, V9)» | `TOTAL: 1 FAILED, 16 SUCCESS` |

- **Pendiente:** revisión en el navegador con la PRESIDENTE y la SECRETARIA (la hace la usuaria).

### Hallazgos de auditoría frontend (24/11/2026)

Identificadores asignados por la usuaria. No existen en ninguna otra spec; F-03 y F-05 no existen.

| Hallazgo | Alcance | Rama |
|---|---|---|
| **F-01** | Reactividad del `protocolId` y recuperación de errores en el formulario de asignación (`peer-assignment-form`), el historial de asignación (`protocol-assignment-history`) y la página de etapa (`protocol-workspace-stage`). Un error no debe terminar la suscripción ni dejar datos del protocolo anterior. | `feat/ep2b-presidenta-revisar-antes-de-asignar` |
| **F-02** | Eventos adversos sin datos simulados ni éxito falso (`adverse-event-form`, `adverse-events-list`). | `feat/f02-f04-sin-simulados` |
| **F-04** | Renovación sin éxito falso (`renewal-request`). | `feat/f02-f04-sin-simulados` |
| **F-06** | Conservar el contexto de origen (`origin`) al volver del espacio del protocolo a la asignación (`protocol-workspace.component`). | `feat/ep2b-presidenta-revisar-antes-de-asignar` |

### Resultados de la verificación (24/11/2026)

- `tsc -p tsconfig.app.json --noEmit` y `tsc -p tsconfig.spec.json --noEmit`: exit 0.
- `ng test` completo, tres veces: 1662 de 1662 SUCCESS cada vez (sin pruebas fallidas).
- `ng build --configuration production`: exit 0.
- `npx eslint "src/**/*.ts"`: 0 errores, 64 avisos (línea base 64, sin cambio).

**Mutaciones** (se aplica cada una, se corren las suites afectadas, se revierte y se comprueba por hash que el archivo quedó idéntico).

| Id | Mutación | Resultado | Pruebas que fallan | Revertida e idéntica |
|---|---|---|---|---|
| M1 | deriveStageStates sin la rama de cierre (RECHAZADO/ARCHIVADO) | 6 FAILED, 113 SUCCESS | deriveStageStates: RECHAZADO en EVALUACION: anteriores completadas, EVALUACION cerrada, posteriores no aplica; deriveStageStates: cada etapa recibe exactamente un estado y nunca una etapa cerrada sin ser la actual; deriveStageStates: ARCHIVADO_VENCIMIENTO en RECEPCION: la recepción cerrada y todas las demás no aplica; deriveStageStates: protocolo cerrado gana a no disponible: RECHAZADO en SEGUIMIENTO cierra SEGUIMIENTO; Workspace: template real ep2c §3.4: protocolo ARCHIVADO cierra la etapa actual y las posteriores no aplican; Workspace: template real ep2c §3.4: protocolo RECHAZADO cierra la etapa donde se detuvo y las posteriores no aplican | Sí |
| M2 | etapas posteriores como «completada» | 3 FAILED, 116 SUCCESS | Workspace: template real ep2c §3.4: los estados de la barra se derivan de la etapa actual y SEGUIMIENTO y RENOVACION son no disponibles; deriveStageStates: protocolo en curso en ASIGNACION: anterior completada, actual en curso, posteriores pendientes; deriveStageStates: protocolo en curso en RECEPCION: ninguna completada | Sí |
| M3 | protocol-header renderiza la barra con stage null | 2 FAILED, 76 SUCCESS | Workspace: template real D19: sin etapa del backend (null o desconocida) no muestra la barra, aunque el estado se reconozca; ProtocolHeader: sin etapa no hay barra | Sí |
| M4 | «Asignar Pares» navega a /dashboard/evaluations/assignment/:id | 3 FAILED, 61 SUCCESS | Workspace: carga y errores (F10 D14, S-1g) Asignar Pares lleva al formulario del espacio (workspace/:id/assignment), sin abrir un modal (F10 D20 (2)); Workspace: acciones contextuales conserva el origen al ejecutar Asignar Pares desde el workspace; Workspace: acciones contextuales Asignar Pares sin origen navega al formulario del espacio sin queryParams y con id numérico | Sí |
| M5 | sin la redirección del EVALUADOR en evaluation | 3 FAILED, 63 SUCCESS | S-1a: declara las seis rutas consultivas dentro del workspace; S-1a: EVALUADOR en workspace/1/evaluation va a Mis evaluaciones, sin aviso (D11 actualizada en S-1f, EARS 16); S-1a: EVALUADOR en workspace/1/evaluation va a Mis evaluaciones, sin aviso (ep2c) | Sí |
| M6 | el id vuelve a ser string | 4 FAILED, 60 SUCCESS | Workspace: carga y errores (F10 D14, S-1g) Asignar Pares lleva al formulario del espacio (workspace/:id/assignment), sin abrir un modal (F10 D20 (2)); Workspace: acciones contextuales conserva el origen al ejecutar Asignar Pares desde el workspace; Workspace: acciones contextuales Asignar Pares sin origen navega al formulario del espacio sin queryParams y con id numérico; Workspace: acciones contextuales Editar y Aprobar Todo navegan con el id numérico del protocolo | Sí |
| M7 | la ruta vieja de F03 deja de redirigir | 3 FAILED, 127 SUCCESS | T13d: la ruta vieja del formulario redirige al formulario del espacio del protocolo (EP2b); S-1a: la ruta vieja /dashboard/evaluations/assignment/1 redirige al formulario del espacio para la PRESIDENTE; EVALUATION_ROUTES: assignment/:protocolId ya no carga un formulario: redirige al formulario del espacio (EP2b) | Sí |

### Pestañas por etapa y formulario en el espacio (24/11/2026)

Decisiones de la usuaria en `ep2c.md` §3.6 y EARS F11-28 a F11-34 (`spec-ui.md` §7b): pestañas según la etapa seleccionada, apertura en la etapa actual, formulario del espacio sin «Revisar documentación» ni «Volver a la lista», botón «Asignar evaluadores» después de elegir el tipo y «Asignar Pares» oculto con la pestaña Asignación abierta.

- `tsc -p tsconfig.app.json --noEmit` y `tsc -p tsconfig.spec.json --noEmit`: exit 0.
- `ng test` completo, tres veces: 1687 de 1687 SUCCESS cada vez (sin pruebas fallidas).
- `ng build --configuration production`: exit 0.
- `npx eslint "src/**/*.ts"`: 0 errores, 64 avisos (línea base 64, sin cambio).

**Mutaciones** (se aplica, se corren las suites afectadas, se revierte y se comprueba por hash que el archivo quedó idéntico).

| Id | Mutación | Resultado | Pruebas que fallan | Revertida e idéntica |
|---|---|---|---|---|
| M8 | pestañas de Recepción (Resumen y Validación Técnica) visibles con Asignación seleccionada | 26 FAILED, 56 SUCCESS | Workspace: estado real EN_EVALUACION: etiqueta, pestañas y acciones (Paso 0 de S-1f); Workspace: PRESIDENTE ve Resumen, Validación (solo lectura, F11 EP2) y Seguimiento aprobado, sin Evaluación; su única acción es Asignar Pares con los tiempos aceptados (D20); Workspace: estado real RECHAZADO: etiqueta, pestañas y acciones (Paso 0 de S-1f); … (26 en total) | Sí |
| M9 | botón «Asignar evaluadores» visible antes de elegir el tipo de revisión (en el espacio) | 2 FAILED, 42 SUCCESS | Formulario en el espacio: en pleno también muestra el botón solo después de elegir el tipo; Formulario en el espacio: antes de elegir el tipo solo hay título, código y título del protocolo y «Tipo de revisión» | Sí |
| M10 | «Asignar Pares» visible con la pestaña Asignación abierta | 3 FAILED, 79 SUCCESS | Workspace: Asignar Pares: con los tiempos sin aceptar, el aviso y el botón deshabilitado tampoco salen en ASIGNACION; Workspace: Asignar Pares: se muestra en las demás etapas y no en ASIGNACION; Apertura: PRESIDENTE abre en ASIGNACION: va al formulario, solo ve la pestaña Asignación y no ve Asignar Pares | Sí |
| M11 | «Revisar documentación» visible dentro del espacio | 1 FAILED, 43 SUCCESS | Formulario en el espacio: no ofrece «Revisar documentación» ni «Volver a la lista», con o sin tipo elegido | Sí |
| M12 | al abrir el espacio no se selecciona la etapa actual del protocolo | 4 FAILED, 78 SUCCESS | Apertura: en EVALUACION no hay pestañas todavía: ninguna del espacio; Apertura: PRESIDENTE abre en ASIGNACION: va al formulario, solo ve la pestaña Asignación y no ve Asignar Pares; Apertura: ASIGNACION con una asignación ya hecha abre el historial; … (4 en total) | Sí |

## 2. Backend (las hace otra sesión en el repo del backend)

- **Registrar en spec-001 HU-001** V2, V5, V6 y V7 (README §3, regla 1).
- **Constancia sin efectos (FALTA 1):** `GET` de la constancia sin efectos (sin volver a emitirla, sin reenviar el correo, sin pisar `certificateDate`), para quien puede leer el protocolo. Error actual: cada clic de la SECRETARIA en «Descargar Anexo 7» vuelve a emitir la constancia, la reenvía al investigador y pisa `certificateDate`.
- **B1:** `GET /evaluations/submit/protocol/:id` (nombres de los evaluadores) solo para SECRETARIA y PRESIDENTE, con `EVALUACION_INFORMES`.
- **B2:** `/audit` y `/audit/protocol/:id` con permiso, filtrados por tabla, sin el INVESTIGADOR.
- **B3:** `/storage/download-url` y `/storage/upload-url` comprueban la clave o se retiran.
- **B4 (FALTA 2):** regla del lector (la de `findOneForReader`) en `/reception/document/:id/view`, `/download-url` y `/documents/*`; arreglar los archivos antiguos (ruta sin `/`), que hoy siempre dan 404 en `download-url`. «Ver documento» funciona hoy porque `/reception/document/:id/download-url` no pide permiso; cuando se cierre con la regla del lector, debe seguir permitiendo a la PRESIDENTE (y a la SECRETARIA, al investigador dueño y al evaluador asignado).
- **B5:** cerrar `POST /documents`.
- **B6:** el EVALUADOR solo ve los documentos de sus asignaciones (5, 6, 7); el investigador dueño puede listar los suyos.
- **B7:** `GET /evaluations/:id/checklist-details`, `/document` y `/docx` solo para la asignación propia.
- **B12:** `POST /ai-assistant/chat` comprueba que el usuario pueda leer el protocolo cuyo contexto pide y decide el acceso con el rol activo, no con todos los roles (spec-ui §6, FALTA 5).
- **B8:** observaciones al investigador con perfil y dictamen de cada par, sin nombres ni `reportPath`; el correo de la resolución sin los informes con el nombre del revisor (V5).
- **B9:** `GET /resolutions/protocol/:id` con la regla del lector y un mapper.
- **B10:** sacar de la respuesta al investigador los campos internos (`isPresidentNotified`, `presidentNotificationDate`, `timelineTermsAcceptedIp`, `versionLock`); `riskLevel` y `reviewType` solo una vez fijados (V5).
- **B11:** endpoint para subir la resolución firmada y su estado (V7).
### EP2b - La PRESIDENTA revisa antes de asignar

Estado general: **Implementacion realizada; pruebas de navegador pendientes**. La ejecucion de ChromeHeadless queda bloqueada por el entorno local.

#### Documentacion

| Identificador | Descripcion | Criterio verificable | Dependencias | Estado |
|---|---|---|---|---|
| EP2b-DOC-01 | Incorporar EP2b-01 a EP2b-06 en `spec-ui.md`. | Cada requisito describe el flujo, el contexto y las restricciones sin introducir backend. | F03, EP2, F10 D20. | Pendiente de aprobacion |
| EP2b-DOC-02 | Registrar D21 a D26 en `plan.md`. | Cada decision contiene contexto, decision, justificacion y consecuencias tecnicas. | F11, F10 D20. | Pendiente de aprobacion |
| EP2b-DOC-03 | Incorporar F11-18 a F11-27 y referencias cruzadas. | Todos los requisitos EP2b tienen al menos un criterio verificable. | `spec-ui.md`. | Pendiente de aprobacion |

#### Implementacion

| Identificador | Descripcion | Criterio verificable | Dependencias | Estado |
|---|---|---|---|---|
| EP2b-IMP-01 | Incorporar «Ver protocolo» en `PeerAssignmentListPage`. | PRESIDENTA ve la accion y «Asignar» permanece disponible con su comportamiento actual. | EP2b-DOC-01; F03. | Implementada; TypeScript de aplicacion OK |
| EP2b-IMP-02 | Navegar desde la lista al workspace con el identificador y origen permitido. | Se abre el protocolo seleccionado y el origen solo admite `assignment-list`. | EP2b-IMP-01; EP2. | Implementada; TypeScript de aplicacion OK |
| EP2b-IMP-03 | Incorporar «Revisar documentacion» en `PeerAssignmentFormPage`. | La accion usa el `protocolId` que recibe el formulario. | EP2b-DOC-01; F03. | Implementada; TypeScript de aplicacion OK |
| EP2b-IMP-04 | Navegar desde el formulario a Validacion con contexto permitido. | Se abre `/dashboard/protocols/workspace/:protocolId/validation` para el mismo protocolo. | EP2b-IMP-03; EP2. | Implementada; TypeScript de aplicacion OK |
| EP2b-IMP-05 | Resolver el retorno seguro a lista o formulario. | Cada origen vuelve a su destino correspondiente sin aceptar URL arbitraria. | EP2b-IMP-02, EP2b-IMP-04. | Implementada; origen validado y fallback seguro |
| EP2b-IMP-06 | Conservar F10 D20 y «Asignar Pares». | La accion sigue conduciendo al formulario sin duplicarse ni perder el contexto permitido. | F10 D20; EP2. | Implementada; regresion cubierta en pruebas |

#### Pruebas

| Identificador | Descripcion | Criterio verificable | Dependencias | Estado |
|---|---|---|---|---|
| EP2b-TEST-01 | Probar la navegacion desde la lista. | «Ver protocolo» abre el `protocolId` correcto. | EP2b-IMP-01, EP2b-IMP-02. | Prueba añadida; ejecución ChromeHeadless bloqueada |
| EP2b-TEST-02 | Probar la navegacion desde el formulario. | «Revisar documentacion» abre Validacion del mismo protocolo. | EP2b-IMP-03, EP2b-IMP-04. | Prueba añadida; ejecución ChromeHeadless bloqueada |
| EP2b-TEST-03 | Probar el origen permitido y el retorno. | `assignment-list` vuelve a la lista y `assignment-form` vuelve al formulario correcto. | EP2b-IMP-05. | Prueba añadida; ejecución ChromeHeadless bloqueada |
| EP2b-TEST-04 | Probar las restricciones de solo lectura. | PRESIDENTA no ve ni ejecuta controles no permitidos por F11. | EP2. | Pendiente; requiere ejecución de suite |
| EP2b-TEST-05 | Probar regresion de «Asignar». | «Asignar» conserva su ruta, estado deshabilitado y comportamiento actuales. | EP2b-IMP-01. | Cobertura existente; ejecución ChromeHeadless bloqueada |
| EP2b-TEST-06 | Probar regresion de «Asignar Pares». | F10 D20 sigue navegando al formulario. | EP2b-IMP-06. | Prueba añadida; ejecución ChromeHeadless bloqueada |
### EP2b — cierre de integración (22/11/2026)

- **Hecho:** la lista usa «Asignar» como única acción y abre `/dashboard/protocols/workspace/:id/assignment`.
- **Hecho:** el segundo módulo del workspace reutiliza `PeerAssignmentFormPage`, conservando carga, validaciones y envío.
- **Hecho:** el contexto `protocolId`, la recarga, la restricción de `PRESIDENTE` y la navegación entre módulos quedan representados en rutas y specs.
- **Verificación:** `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit` exit 0. Karma no pudo ejecutar las specs porque Chrome no inicia en el entorno local; se registran los errores reales en el cierre de la tarea.

## EP2c — Protocolo ya asignado e INVESTIGADOR en Asignación (24/11/2026)

Decisión de la usuaria tras la validación en el navegador; detalle en `ep2c.md` §3.7 y criterios F11-35 a F11-40 en `spec-ui.md` §7c.

- **Hecho:** `ProtocolWorkspaceService` guarda el estado de las asignaciones activas (`idle | loading | none | has | error`) con una petición por protocolo (`ensureActiveAssignments`, `retryActiveAssignments`).
- **Hecho:** con asignación activa la pestaña Asignación lleva al historial, «Asignar Pares» no se muestra y el formulario muestra el aviso «Este protocolo ya tiene evaluadores asignados.» con enlace al historial. Si la consulta falla: error con «Reintentar», nunca el formulario.
- **Hecho:** el INVESTIGADOR abre la etapa Asignación y ve «La asignación de evaluadores es reservada del comité…»; esa página no hace ninguna petición de asignaciones ni de reasignaciones.
- **Pendiente del backend (N54):** la lista de asignación de la PRESIDENTE (`pending-peer-assignment`) no trae asignaciones activas, por lo que «Asignar» no se puede marcar o quitar por fila sin una consulta por cada una. La lista debe excluir los protocolos con asignación activa; mientras tanto rigen el aviso del formulario y el 409 del backend.
- **Mutaciones (cada una restaurada con hash idéntico):**

| # | Mutación | Pruebas que fallan |
|---|---|---|
| M13 | Formulario visible con asignación activa | 2 (formulario) |
| M14 | «Asignar Pares» visible con asignación activa | 3 (espacio) |
| M15 | `assignment-history` sin el rol INVESTIGADOR (rebote al inicio) | 4 (rutas) |
| M16 | El INVESTIGADOR ve el historial con evaluadores | 3 (historial) |
| M17 | Si falla la consulta, formulario por defecto | 1 (formulario) |

### Aviso «Consulta en solo lectura» (d5ed5bb, revisado 24/11/2026)

- **Revisión:** aceptada; el commit se queda en esta rama. Añade un banner en `protocol-validation-detail.page.ts` (12 líneas de template y 29 de SCSS) y estilos del formulario y de la lista de asignación; no cambia lógica ni permisos.
- **Condición:** `!canValidate() && !isInvestigador()`, es decir, cualquier rol que no valide y no sea investigador. Hoy solo la PRESIDENTE, por las rutas (EVALUADOR no abre la pestaña).
- **Pruebas (`protocol-validation-detail.page.spec.ts`):** la PRESIDENTE lo ve con su texto; la SECRETARIA no lo ve (en revisión y con la recepción validada); el INVESTIGADOR no lo ve.
- **Mutación M18:** condición del aviso siempre verdadera → fallan 3 pruebas (las dos de la SECRETARIA y la del INVESTIGADOR); archivo restaurado con hash idéntico.

## EP2c — Etapas posteriores a la actual (24/11/2026)

Decisión de la usuaria; detalle en `ep2c.md` §3.8 y criterios F11-41 a F11-46 en `spec-ui.md` §7d.

- **Hecho:** regla única `isStageNotReached` (dominio). La barra convierte las etapas posteriores a la actual en un botón sin enlace ni `aria-current`, con texto oculto «etapa pendiente, aún no disponible»; el clic avisa con `NotificationService` (tipo «info») y no navega.
- **Hecho:** la URL de una etapa posterior redirige a la etapa actual con `replaceUrl` y el mismo aviso; sin etapa del backend no se bloquea nada. La página de etapa sin pantalla muestra «Esta sección todavía no está disponible en el sistema.».
- **Decisión (reemplazada el 24/11/2026, ver abajo):** con el protocolo cerrado las posteriores eran «no aplica» y esta regla no las bloqueaba. Los textos «completada», «etapa actual», «cerrada» y «no aplica» no cambian; «pendiente» pasó a «etapa pendiente, aún no disponible» y «no disponible» solo queda para SEGUIMIENTO/RENOVACION que no son posteriores a la actual.
- **Mutaciones (cada una restaurada con hash idéntico):**

| # | Mutación | Pruebas que fallan |
|---|---|---|
| M19 | Etapa pendiente navegable por clic | 10 |
| M20 | Sin aviso al hacer clic | 3 |
| M21 | URL de etapa pendiente sin redirección | 4 |
| M22 | Mismo mensaje para «aún no llega» y «no existe todavía» | 2 |
| M23 | La etapa actual también queda bloqueada | 1 (prueba nueva del VO; la primera versión era un mutante equivalente) |

### Protocolo cerrado: etapas «no aplica» (24/11/2026)

- **Decisión de la usuaria:** con RECHAZADO o ARCHIVADO_VENCIMIENTO las etapas «no aplica» tampoco se abren. Clic: aviso «El protocolo se cerró en la etapa {etapa}; esta etapa no aplica.»; URL: redirección a la etapa cerrada con el mismo aviso. Detalle en `ep2c.md` §3.8; EARS F11-47 y F11-48.
- **Hecho:** `isStageNotApplicable` (dominio); la barra las convierte en botón (sin enlace ni `aria-current`, texto oculto «no aplica») con salida `notApplicableClick`; el espacio nombra la etapa donde se cerró y redirige por URL.
- **Mutaciones (cada una restaurada con hash idéntico):**

| # | Mutación | Pruebas que fallan |
|---|---|---|
| M25 | Etapa «no aplica» navegable por clic | 5 |
| M26 | Clic en «no aplica» con el aviso de «aún no llega» | 7 |
| M27 | URL de etapa «no aplica» sin redirección | 4 |
| M28 | El aviso nombra la etapa clicada y no donde se cerró | 7 |
