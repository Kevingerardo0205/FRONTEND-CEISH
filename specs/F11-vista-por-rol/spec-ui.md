# F11 · Qué ve cada rol de un protocolo — spec-ui

**Versión:** 0.1 · **Fecha:** 20/11/2026 · **Rama:** `feat/ep2-presidenta-recepcion-lectura` (desde `dev` `975b8e5`)
**Historial:**
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

## 5. Estados

EP2 no cambia los estados de la pestaña: cargando, no encontrado y error siguen como hoy (F10 D14 para el espacio).

## 6. Endpoints

| Endpoint | Para qué | Estado |
|---|---|---|
| `GET /reception/protocol/:id/validation-detail` | Checklist, observaciones y documento adjunto de cada requisito | Existe. Acepta `RECEPCION_LISTA`, `EVALUACION_RIESGO` o `EVALUACION_PLENO`, o al dueño (`reception.service.ts:55-85` del backend) |
| `GET /reception/document/:id/download-url` | «Ver documento cargado» | Existe. Hoy funciona para la PRESIDENTE **porque no pide ningún permiso** (`reception.controller.ts:245-298`). Ver FALTA 2 |
| `POST /reception/protocol/:id/certificate` | «Descargar Anexo 7» de la SECRETARIA | Existe, pero **no descarga**: ver FALTA 1 |
| Acciones de validación (`verify`, `finalize`, `document/:id/validate`, `requirement/:reqId`) | Validar | Existen; piden `RECEPCION_VALIDAR`, que la PRESIDENTE no tiene |

**FALTA 1 · constancia sin efectos (backend).** `GET` de la constancia sin efectos (sin volver a emitirla, sin reenviar el correo, sin pisar `certificateDate`), para quien puede leer el protocolo. **Error actual:** cada clic de la SECRETARIA en «Descargar Anexo 7» llama a `POST /reception/protocol/:id/certificate` (`protocol-api.adapter.ts:280-286`), que pide `RECEPCION_CONSTANCIAS`, vuelve a generar la constancia con la fecha del día, la reenvía por correo al investigador, pisa `certificateDate` (`reception.service.ts:795-841` del backend) y devuelve un JSON, no el PDF. Al INVESTIGADOR, el mismo botón le responde 403.

**FALTA 2 · B4, regla del lector en los documentos (backend).** «Ver documento» funciona hoy porque `/reception/document/:id/download-url` no pide permiso. Cuando se cierre con la regla del lector, debe seguir permitiendo a la PRESIDENTE (y a la SECRETARIA, al investigador dueño y al evaluador asignado).

## 7. Criterios de aceptación (EARS)

1. **F11-1:** Mientras el rol activo sea PRESIDENTE, `/dashboard/protocols/workspace/:id/validation` debe abrir sin el aviso de acceso denegado, y el espacio debe mostrar la pestaña «Validación Técnica» (salvo en borrador, como hoy).
2. **F11-2:** Mientras el rol activo sea PRESIDENTE, la pestaña Validación no debe mostrar Aprobar, Rechazar, el campo de páginas validadas, el campo de observación de cada requisito, el cuadro de observaciones generales, «Finalizar revisión» / «Notificar observaciones», «Descargar Anexo 7» ni el aviso legal, en ningún estado del protocolo.
3. **F11-3:** Mientras el rol activo sea PRESIDENTE, la pestaña debe mostrar el estado, las páginas declaradas y validadas y la observación de cada requisito, las observaciones de la Secretaría si hay texto, y la barra de progreso de validación.
4. **F11-4:** Cuando la PRESIDENTE pulse «Ver documento cargado», el sistema debe abrir el documento con `GET /reception/document/:id/download-url`.
5. **F11-5:** Mientras el rol activo no esté en `VALIDATE_ALL`, validar un requisito, cambiar sus páginas o finalizar no debe llamar al backend.
6. **F11-6:** Mientras el protocolo esté validado (`isFinalized`), el cuadro de observaciones generales de la SECRETARIA debe estar deshabilitado.
7. **F11-7:** Con SECRETARIA o INVESTIGADOR activos, la pestaña debe verse y actuar como antes de EP2, salvo F11-6.

## 8. Pendientes

- Registrar V2, V5, V6 y V7 en spec-001 HU-001 del backend (README §3, regla 1).
- FALTA 1 y FALTA 2 (§6).
- Tareas de backend del Paso 0 del 20/11/2026 (filtraciones al investigador y al evaluador), en `tasks.md` §2.
- V7: si la PRESIDENTE conserva `RESOLUCION_CREAR`.
- Qué edita la SECRETARIA en Evaluación, Seguimiento y Renovación (§3, «por precisar»).
