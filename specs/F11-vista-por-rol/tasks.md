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

Estado general: **Pendiente**. Este bloque documenta la Etapa 1; ninguna tarea de implementacion o pruebas esta completada.

#### Documentacion

| Identificador | Descripcion | Criterio verificable | Dependencias | Estado |
|---|---|---|---|---|
| EP2b-DOC-01 | Incorporar EP2b-01 a EP2b-06 en `spec-ui.md`. | Cada requisito describe el flujo, el contexto y las restricciones sin introducir backend. | F03, EP2, F10 D20. | Pendiente de aprobacion |
| EP2b-DOC-02 | Registrar D21 a D26 en `plan.md`. | Cada decision contiene contexto, decision, justificacion y consecuencias tecnicas. | F11, F10 D20. | Pendiente de aprobacion |
| EP2b-DOC-03 | Incorporar F11-18 a F11-27 y referencias cruzadas. | Todos los requisitos EP2b tienen al menos un criterio verificable. | `spec-ui.md`. | Pendiente de aprobacion |

#### Implementacion

| Identificador | Descripcion | Criterio verificable | Dependencias | Estado |
|---|---|---|---|---|
| EP2b-IMP-01 | Incorporar «Ver protocolo» en `PeerAssignmentListPage`. | PRESIDENTA ve la accion y «Asignar» permanece disponible con su comportamiento actual. | EP2b-DOC-01; F03. | Pendiente |
| EP2b-IMP-02 | Navegar desde la lista al workspace con el identificador y origen permitido. | Se abre el protocolo seleccionado y el origen solo admite `assignment-list`. | EP2b-IMP-01; EP2. | Pendiente |
| EP2b-IMP-03 | Incorporar «Revisar documentacion» en `PeerAssignmentFormPage`. | La accion usa el `protocolId` que recibe el formulario. | EP2b-DOC-01; F03. | Pendiente |
| EP2b-IMP-04 | Navegar desde el formulario a Validacion con contexto permitido. | Se abre `/dashboard/protocols/workspace/:protocolId/validation` para el mismo protocolo. | EP2b-IMP-03; EP2. | Pendiente |
| EP2b-IMP-05 | Resolver el retorno seguro a lista o formulario. | Cada origen vuelve a su destino correspondiente sin aceptar URL arbitraria. | EP2b-IMP-02, EP2b-IMP-04. | Pendiente |
| EP2b-IMP-06 | Conservar F10 D20 y «Asignar Pares». | La accion sigue conduciendo al formulario sin duplicarse ni perder el contexto permitido. | F10 D20; EP2. | Pendiente |

#### Pruebas

| Identificador | Descripcion | Criterio verificable | Dependencias | Estado |
|---|---|---|---|---|
| EP2b-TEST-01 | Probar la navegacion desde la lista. | «Ver protocolo» abre el `protocolId` correcto. | EP2b-IMP-01, EP2b-IMP-02. | Pendiente |
| EP2b-TEST-02 | Probar la navegacion desde el formulario. | «Revisar documentacion» abre Validacion del mismo protocolo. | EP2b-IMP-03, EP2b-IMP-04. | Pendiente |
| EP2b-TEST-03 | Probar el origen permitido y el retorno. | `assignment-list` vuelve a la lista y `assignment-form` vuelve al formulario correcto. | EP2b-IMP-05. | Pendiente |
| EP2b-TEST-04 | Probar las restricciones de solo lectura. | PRESIDENTA no ve ni ejecuta controles no permitidos por F11. | EP2. | Pendiente |
| EP2b-TEST-05 | Probar regresion de «Asignar». | «Asignar» conserva su ruta, estado deshabilitado y comportamiento actuales. | EP2b-IMP-01. | Pendiente |
| EP2b-TEST-06 | Probar regresion de «Asignar Pares». | F10 D20 sigue navegando al formulario. | EP2b-IMP-06. | Pendiente |
