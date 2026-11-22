# F11 · Qué ve cada rol de un protocolo — spec-ui

**Versión:** 0.2 · **Fecha:** 20/11/2026 · **Rama:** `feat/ep4-investigador-sin-datos-internos` (desde `dev` `ba1b9c4`)
**Historial:**
- 0.2 (20/11/2026) Paso 0 de EP4 (frontend `dev` `ba1b9c4`; backend `dev` `19a5519`, leído con `git show`) y decisiones de la usuaria del 20/11/2026 (V10 a V15): EP4 (§4b), estados de la bitácora, del registro general y de la actividad reciente, sin datos inventados de auditoría para ningún rol, sin la huella inventada, Subsanaciones sin los informes individuales y con el dictamen de `EvaluatorDictamen`; EARS F11-8 a F11-17; §6 con B2, B8 y B12; tareas aparte en §8 y `tasks.md`.
- 0.1 (20/11/2026) primer borrador desde los dos Paso 0 del 20/11/2026 (frontend `dev` `975b8e5`; backend `dev` `19a5519`, leído con `git show`) y las decisiones de la usuaria del 20/11/2026 (V1 a V9). Primera tarea: EP2 (la PRESIDENTE ve Recepción en solo lectura).

**Cubre:** spec-001 v3.7.8 del backend: HU-001 (roles fijos, matriz de permisos fija, rol activo) y RF-02.10 (quién lee `GET /protocols/:id`); spec-002 v1.3.4: RF-12.1 h (pantalla de la Presidente). No copia su texto: lo cita.
**Reglas nuevas pendientes de registrar en spec-001 HU-001 del backend** (README §3, regla 1): V2 (matriz rol × etapa), V5 (lo que ve el investigador), V6 (lo que ve el evaluador) y V7 (la resolución firmada la sube la SECRETARIA). Hasta que se registren allí, se marcan **«pendiente en HU-001»**. EP2 no depende de ellas: usa solo la matriz de permisos que ya existe (la PRESIDENTE tiene `EVALUACION_RIESGO` y `EVALUACION_PLENO` y no tiene `RECEPCION_VALIDAR` ni `RECEPCION_CONSTANCIAS`, migración `1880000000000-FixedRolesMatrix.ts` del backend).
**Depende de:** F00 (`ProtocolHeader`, `RoleGuard`, rol activo, tokens), F10 (espacio del protocolo: D10, D12, D13, D17, D19 y D20), F02 (recepción, E16), F03 (asignación de la Presidenta), F09 (vista del investigador).
**Reemplaza en parte:** F10 D10 (la pestaña Validación suma PRESIDENTE), D12 (2), D17 (2) y D20 (2) en lo que la matriz de V2 cambia; F02 E16 (la PRESIDENTE no valida, pero ve en solo lectura).
**Canvas:** no hay. Se usan las piezas de F00.

---

## 1. Alcance y roles

F11 fija, en una sola matriz, qué ve y qué puede hacer cada rol activo en cada etapa de un protocolo. No agrega pantallas por sí misma: cada tarea (EP2 a EP7, `tasks.md`) cambia una pantalla que ya existe.

Roles: SECRETARIA, PRESIDENTE, INVESTIGADOR y EVALUADOR (F00 §2). Se decide siempre con el **rol activo**, nunca con la suma de roles (F10 D12). La única cuenta con dos roles posible hoy es PRESIDENTE + EVALUADOR (F10 D17 (1)): con PRESIDENTE activo ve lo de la PRESIDENTE y con EVALUADOR activo, lo del EVALUADOR.

## 2. Decisiones (usuaria, 20/11/2026)

| # | Decisión |
|---|---|
| V1 | **Principio: mismas piezas, no mismas pantallas.** La consistencia visual se logra con las mismas piezas (`ProtocolHeader`, lista de documentos, chips de estado), no mostrando las mismas pantallas a todos. Las etapas cerradas son de solo lectura para todos. Recepción validada no cambia: se consulta y se abre cada documento, sin cambios. La etapa en curso solo la edita el rol responsable. |
| V2 | **Matriz rol × etapa** (§3). *Pendiente en HU-001.* |
| V3 | **SECRETARIA:** el espacio completo del protocolo, las 6 etapas; edita la que le toca. |
| V4 | **PRESIDENTE:** el mismo espacio completo, las 6 etapas en solo lectura, salvo Asignación (asigna, F03). Ve y abre los documentos de Recepción para decidir la asignación (EP2). |
| V5 | **INVESTIGADOR:** su vista actual (Mis protocolos y el detalle). Ve la barra de etapas, solo con su información: documentos, observaciones, aceptación de tiempos, resolución e informes. **No** ve los nombres de sus evaluadores. **Sí** ve el perfil y el dictamen de cada par (sin nombres), y el nivel de riesgo y el tipo de revisión una vez fijados. **Nunca** ve las propuestas de riesgo de cada par. Nada interno del comité. *Pendiente en HU-001.* |
| V6 | **EVALUADOR:** sus pantallas actuales (Mis evaluaciones y el formulario), sin barra de etapas. Su pantalla de evaluación muestra el encabezado del protocolo (código, título, tipo) y los documentos en solo lectura, junto a su formulario y su plazo. Solo ve su propio dictamen. *Pendiente en HU-001.* |
| V7 | **Resolución:** se firma fuera del sistema y la SECRETARIA sube el documento firmado. Si la PRESIDENTE conserva `RESOLUCION_CREAR`: **por decidir**. *Pendiente en HU-001.* |
| V8 | **EP2, constancia:** la PRESIDENTE no ve el botón «Descargar Anexo 7 (constancia)»: el endpoint actual le responde 403 y además vuelve a emitir la constancia (§6, FALTA 1). |
| V9 | **EP2, Recepción validada no cambia:** con el protocolo ya validado (`isFinalized`), el cuadro de observaciones generales queda deshabilitado también para la SECRETARIA. La barra de progreso de validación queda visible para la PRESIDENTE (es informativa y usa datos reales). |
| V10 | **EP4, bitácora del Resumen:** el INVESTIGADOR no la ve ni se pide al backend. La ven SECRETARIA y PRESIDENTE (los mismos roles de `audit/*`, F00 D4). |
| V11 | **EP4, sin datos inventados de auditoría, para ningún rol:** la bitácora del protocolo (Resumen y `/dashboard/audit/trail/:id`), el registro general (`/dashboard/audit/logs`) y la «Actividad Reciente» del tablero de la Secretaría muestran datos reales, o su estado de vacío o error. Un error nunca se muestra como vacío. |
| V12 | **EP4, estados de la bitácora** (Resumen y `trail/:id`): cargando «Cargando la bitácora…»; error «No pudimos cargar la bitácora del protocolo.» con «Reintentar»; vacío «Aún no hay eventos registrados para este protocolo.». |
| V13 | **EP4, sin la «Huella Digital (SHA-256)»:** el frontend la armaba con el id y la fecha (`sha256-{id}-{fecha}`); no es una huella. Se quita del Resumen y de `trail/:id`. |
| V14 | **EP4, Subsanaciones:** se conservan las tarjetas con el perfil y el dictamen de cada par, sin nombres, ids ni correos. Se quitan los enlaces a los informes individuales (PDF adicional, PDF oficial y Word): esos archivos llevan el nombre del revisor. |
| V15 | **EP4, dictamen de cada par:** las etiquetas siguen los códigos del backend (`EvaluatorDictamen`: 1 Aprobado, 2 Aprobado con observaciones, 3 Rechazado). Sin dictamen: «Sin dictamen registrado», nunca «PENDIENTE». |

## 3. Matriz rol × etapa (V2)

Etapas del backend (F10 D13 y D19): Recepción · Asignación · Evaluación · Resolución · Seguimiento · Renovación.

| Rol | Recepción | Asignación | Evaluación | Resolución | Seguimiento | Renovación |
|---|---|---|---|---|---|---|
| SECRETARIA | Valida (en curso); solo lectura (cerrada) | Solo lectura | Edita lo que le toca si está en curso (**por precisar**) | Sube la resolución firmada (V7) | Edita lo que le toca (**por precisar**) | Edita lo que le toca (**por precisar**) |
| PRESIDENTE | Solo lectura: checklist, observaciones, páginas, abrir cada documento (EP2) | **Asigna** (F03) | Solo lectura | Solo lectura | Solo lectura | Solo lectura |
| INVESTIGADOR | Barra de etapas; sus documentos y observaciones; subsana | Acepta los tiempos | Perfil y dictamen de cada par, sin nombres; nivel de riesgo y tipo de revisión una vez fijados; nunca las propuestas de cada par | Ve la resolución firmada | Sus informes | Su solicitud |
| EVALUADOR | — | — | Sin barra de etapas: encabezado (código, título, tipo), documentos en solo lectura, su formulario, su plazo y solo su dictamen | — | — | — |

Las celdas «por precisar» no se rellenan: las decisiones del 20/11/2026 no dicen qué edita la SECRETARIA en esas etapas.

## 4. EP2 · La PRESIDENTE ve Recepción en solo lectura

**Ruta:** `/dashboard/protocols/workspace/:id/validation` (pestaña «Validación Técnica»). `WORKSPACE_TAB_ROLES.validation` pasa a SECRETARIA, PRESIDENTE e INVESTIGADOR (reemplaza en parte F10 D10). El `RoleGuard` de la ruta lee esa misma fila. Ocultar o mostrar en el frontend no es seguridad: el backend niega las acciones de validación con `RECEPCION_VALIDAR`.

**Tres vistas de la misma pantalla** (`protocol-validation-detail.page.ts`, sin duplicarla), decididas con el rol activo:
- **validar:** el rol activo está en `WORKSPACE_ACTION_ROLES.VALIDATE_ALL` (hoy SECRETARIA);
- **subsanar:** el rol activo está en `WORKSPACE_ACTION_ROLES.SUBMIT_CORRECTIONS` (INVESTIGADOR, F10 D17 (4)), sin cambios;
- **solo lectura:** ninguna de las dos (hoy PRESIDENTE). `isReadOnlyMode` es verdadero.

**Qué ve la PRESIDENTE:** el checklist con el estado de cada requisito, las páginas declaradas y validadas, la observación de cada requisito, las observaciones de la Secretaría (solo si hay texto), la barra de progreso de validación y el botón «Ver documento cargado» de cada requisito.

**Qué no ve:** Aprobar y Rechazar, el campo de páginas validadas, el campo de observación de cada requisito, el cuadro de observaciones generales, «Finalizar revisión» / «Notificar observaciones», «Descargar Anexo 7 (constancia)» (V8) y el aviso legal antes de finalizar. Los métodos de validar, cambiar páginas y finalizar no hacen nada sin la vista de validar.

**SECRETARIA con el protocolo ya validado (V9):** el cuadro de observaciones generales queda deshabilitado, como ya lo estaban los demás controles.

## 4b. EP4 · El investigador sin datos internos

**Bitácora del Resumen** (pestaña Información, `protocol-detail-tab.component.ts`): se muestra y se pide a `GET /audit/protocol/:id` solo con el rol activo en `WORKSPACE_SECTION_ROLES.AUDIT_TRAIL` (SECRETARIA y PRESIDENTE, V10). Con INVESTIGADOR (o EVALUADOR) activo no hay sección ni petición. Ocultarla no es seguridad: hoy el backend responde a cualquier sesión (B2, §6).

**Sin datos inventados (V11):** el adaptador de auditoría devuelve lo que manda el backend. Respuesta vacía → lista vacía; error → error. Nunca eventos ni registros de respaldo. Tampoco se arma la huella (V13).

**Subsanaciones** (`/dashboard/evaluacion-etica/subsanaciones`, `subsanacion.page.ts`), V14 y V15:
- Cada tarjeta: «Evaluador {perfil}» y el dictamen. Sin nombres, ids, correos ni enlaces a los informes individuales.
- El adaptador de `GET /evaluations/protocol/:id/observations` deja pasar solo el perfil, el dictamen, las observaciones generales y el detalle del checklist (para cuando el backend los mande, B8). Si el backend agrega `reportPath`, nombres, ids o correos, no llegan a la pantalla.
- Dictamen: 1 «Aprobado», 2 «Aprobado con observaciones», 3 «Rechazado»; sin dictamen (`null` o ausente), «Sin dictamen registrado»; otro número, «Dictamen no reconocido» (texto de esta spec: no se inventa un dictamen).
- Siguen la «Carta de Observaciones Consolidadas» y el «Formato de Respuestas a Evaluadores» (su ruta armada a mano es una tarea aparte, §8).

## 5. Estados

EP2 no cambia los estados de la pestaña: cargando, no encontrado y error siguen como hoy (F10 D14 para el espacio).

EP4 (V11, V12). Un error nunca se muestra como vacío y, mientras carga, no se muestra el vacío.

| Pantalla | Cargando | Vacío | Error |
|---|---|---|---|
| Bitácora del Resumen (SECRETARIA y PRESIDENTE) y `/dashboard/audit/trail/:id` | «Cargando la bitácora…» | «Aún no hay eventos registrados para este protocolo.» | «No pudimos cargar la bitácora del protocolo.» con «Reintentar» |
| Registro general `/dashboard/audit/logs` | «Cargando el registro de auditoría…» | «Aún no hay registros de auditoría.» | «No pudimos cargar el registro de auditoría.» con «Reintentar» |
| «Actividad Reciente» del tablero de la Secretaría | «Cargando la actividad reciente…» | «Aún no hay actividad registrada.» | «No pudimos cargar la actividad reciente.» con «Reintentar» |

Los textos del registro general y de la actividad reciente siguen el modelo aprobado para la bitácora (V12). Se usan `LoadingState`, `EmptyState` y `ErrorState` de F00. `trail/:id` sin `:id` no pide nada (antes usaba el código inventado `PRT-2026-001`).

## 6. Endpoints

| Endpoint | Para qué | Estado |
|---|---|---|
| `GET /reception/protocol/:id/validation-detail` | Checklist, observaciones y documento adjunto de cada requisito | Existe. Acepta `RECEPCION_LISTA`, `EVALUACION_RIESGO` o `EVALUACION_PLENO`, o al dueño (`reception.service.ts:55-85` del backend) |
| `GET /reception/document/:id/download-url` | «Ver documento cargado» | Existe. Hoy funciona para la PRESIDENTE **porque no pide ningún permiso** (`reception.controller.ts:245-298`). Ver FALTA 2 |
| `POST /reception/protocol/:id/certificate` | «Descargar Anexo 7» de la SECRETARIA | Existe, pero **no descarga**: ver FALTA 1 |
| Acciones de validación (`verify`, `finalize`, `document/:id/validate`, `requirement/:reqId`) | Validar | Existen; piden `RECEPCION_VALIDAR`, que la PRESIDENTE no tiene |

**FALTA 1 · constancia sin efectos (backend).** `GET` de la constancia sin efectos (sin volver a emitirla, sin reenviar el correo, sin pisar `certificateDate`), para quien puede leer el protocolo. **Error actual:** cada clic de la SECRETARIA en «Descargar Anexo 7» llama a `POST /reception/protocol/:id/certificate` (`protocol-api.adapter.ts:280-286`), que pide `RECEPCION_CONSTANCIAS`, vuelve a generar la constancia con la fecha del día, la reenvía por correo al investigador, pisa `certificateDate` (`reception.service.ts:795-841` del backend) y devuelve un JSON, no el PDF. Al INVESTIGADOR, el mismo botón le responde 403.

**FALTA 2 · B4, regla del lector en los documentos (backend).** «Ver documento» funciona hoy porque `/reception/document/:id/download-url` no pide permiso. Cuando se cierre con la regla del lector, debe seguir permitiendo a la PRESIDENTE (y a la SECRETARIA, al investigador dueño y al evaluador asignado).

**EP4 (backend `dev` `19a5519`):**

| Endpoint | Para qué | Estado |
|---|---|---|
| `GET /audit/protocol/:id` | Bitácora del protocolo | Existe. Ver FALTA 3 (B2) |
| `GET /audit` | Registro general y actividad reciente | Existe. Ver FALTA 3 (B2) |
| `GET /evaluations/protocol/:id/observations` | Tarjetas de Subsanaciones | Existe. Devuelve `{ protocolId, versionNumber, observations: [{ evaluatorProfile, result, reportPath }] }` (`evaluations.service.ts:1949`); sin nombres, ids ni correos. Ver FALTA 4 (B8) |
| `POST /ai-assistant/chat` | Asistente de IA | Existe. Ver FALTA 5 (B12) |

**FALTA 3 · B2, auditoría con permiso (backend).** `/audit` y `/audit/protocol/:id` solo piden sesión (`JwtAuthGuard`, `audit.controller.ts`): cualquier rol, también el INVESTIGADOR, puede pedirlos directamente. `findProtocolTrail` devuelve el nombre completo de cada usuario (`userName`), `oldData` y `newData`, y filtra solo por `recordId` (mezcla tablas distintas con el mismo id). Falta: permiso, filtro por tabla y sin el INVESTIGADOR.

**FALTA 4 · B8, observaciones y correo de la resolución sin nombres (backend).** `observations` manda `reportPath`, el informe individual con el nombre del revisor; debe mandar el perfil y el dictamen de cada par (y sus observaciones), sin nombres ni `reportPath`. El correo de la resolución no debe adjuntar ni enlazar los informes individuales (V5).

**FALTA 5 · B12, asistente de IA (backend).** `POST /ai-assistant/chat` arma el contexto de cualquier `protocolId` que reciba (`context.service.ts`) sin comprobar que el protocolo sea del usuario o que su rol pueda leerlo, y decide el acceso con todos los roles de la cuenta (`user.roles`), no con el rol activo (F10 D12).

## 7. Criterios de aceptación (EARS)

1. **F11-1:** Mientras el rol activo sea PRESIDENTE, `/dashboard/protocols/workspace/:id/validation` debe abrir sin el aviso de acceso denegado, y el espacio debe mostrar la pestaña «Validación Técnica» (salvo en borrador, como hoy).
2. **F11-2:** Mientras el rol activo sea PRESIDENTE, la pestaña Validación no debe mostrar Aprobar, Rechazar, el campo de páginas validadas, el campo de observación de cada requisito, el cuadro de observaciones generales, «Finalizar revisión» / «Notificar observaciones», «Descargar Anexo 7» ni el aviso legal, en ningún estado del protocolo.
3. **F11-3:** Mientras el rol activo sea PRESIDENTE, la pestaña debe mostrar el estado, las páginas declaradas y validadas y la observación de cada requisito, las observaciones de la Secretaría si hay texto, y la barra de progreso de validación.
4. **F11-4:** Cuando la PRESIDENTE pulse «Ver documento cargado», el sistema debe abrir el documento con `GET /reception/document/:id/download-url`.
5. **F11-5:** Mientras el rol activo no esté en `VALIDATE_ALL`, validar un requisito, cambiar sus páginas o finalizar no debe llamar al backend.
6. **F11-6:** Mientras el protocolo esté validado (`isFinalized`), el cuadro de observaciones generales de la SECRETARIA debe estar deshabilitado.
7. **F11-7:** Con SECRETARIA o INVESTIGADOR activos, la pestaña debe verse y actuar como antes de EP2, salvo F11-6.

EP4:

8. **F11-8:** Mientras el rol activo sea INVESTIGADOR (o EVALUADOR), el Resumen no debe pedir `GET /audit/protocol/:id` ni mostrar la bitácora.
9. **F11-9:** Mientras el rol activo sea SECRETARIA o PRESIDENTE, el Resumen debe pedir la bitácora del protocolo abierto y mostrar sus eventos reales.
10. **F11-10:** Cuando el backend devuelva una lista vacía de auditoría (bitácora o registro general), el adaptador debe devolver una lista vacía, sin eventos ni registros de respaldo.
11. **F11-11:** Si `GET /audit/protocol/:id` o `GET /audit` fallan, el adaptador debe propagar el error y la pantalla debe mostrar su estado de error con «Reintentar» (§5), nunca el vacío ni datos de respaldo; «Reintentar» vuelve a pedir lo mismo.
12. **F11-12:** Mientras la bitácora, el registro general o la actividad reciente carguen, la pantalla debe mostrar su texto de carga (§5) y no el vacío.
13. **F11-13:** La bitácora (Resumen y `trail/:id`) no debe mostrar ninguna «Huella Digital» ni «Hash».
14. **F11-14:** La tarjeta de cada par en Subsanaciones debe mostrar su perfil y su dictamen y no debe mostrar nombres, ids ni correos de evaluadores, aunque el backend los mande.
15. **F11-15:** Subsanaciones no debe mostrar enlaces a los informes individuales de los evaluadores (PDF adicional, PDF oficial ni Word), aunque el backend mande sus rutas.
16. **F11-16:** El dictamen de cada par debe mostrarse como «Aprobado» (1), «Aprobado con observaciones» (2) o «Rechazado» (3); sin dictamen, «Sin dictamen registrado»; con otro código, «Dictamen no reconocido».
17. **F11-17:** El adaptador de `observations` debe devolver solo perfil, dictamen, observaciones generales y detalle del checklist de cada par, y una lista vacía si la respuesta no trae observaciones.

## 8. Pendientes

- Registrar V2, V5, V6 y V7 en spec-001 HU-001 del backend (README §3, regla 1).
- FALTA 1 y FALTA 2 (§6).
- Tareas de backend del Paso 0 del 20/11/2026 (filtraciones al investigador y al evaluador), en `tasks.md` §2.
- V7: si la PRESIDENTE conserva `RESOLUCION_CREAR`.
- Qué edita la SECRETARIA en Evaluación, Seguimiento y Renovación (§3, «por precisar»).
- FALTA 3 (B2), FALTA 4 (B8) y FALTA 5 (B12) (§6).
- Tareas aparte del Paso 0 de EP4 (decisión de la usuaria del 20/11/2026), en `tasks.md` §1: notificaciones inventadas; pestaña Seguimiento con eventos adversos inventados; eventos adversos y renovaciones con éxito falso; `downloadConsolidatedPdf` con la ruta armada a mano; saludo de tú del asistente de IA; inventario de pantallas y adaptadores con datos simulados en todo el frontend.
