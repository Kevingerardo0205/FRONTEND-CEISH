# F09 · Investigador: borrador y envío a la Secretaría — spec-ui

**Versión:** 0.1 · **Fecha:** 10/11/2026 · **Rama:** `docs/f09-spec`
**Historial:**
- 0.1 (10/11/2026) primer borrador desde el Paso 0 del flujo del investigador (frontend en `dev` `99c2a74`; backend en solo lectura, `dev` `446d41d`) y las decisiones de la usuaria del 10/11/2026 (D1–D5).

**Cubre:** spec-001 v3.7.2 (`specs/001-flujo-mvp/spec.md` del backend): RF-02.2, RF-02.3 a–f, RF-02.5, RF-02.7 a–d (bloqueado), RF-02.8 (bloqueado) y HU-002 puntos 1, 3, 4 y 5.
**Depende de:** F00 (rutas por rol activo, `RoleGuard`). No depende de F01 ni de F02.
**Canvas:** pantalla `MisProtocolosInvestigador` del canvas del proyecto (claude.ai): chip `Borrador` con texto y botón `Continuar`. La captura todavía no está en `canvas/` (pendiente P1).

---

## 1. Alcance y roles

Que el investigador vea su protocolo como **borrador** mientras no lo envía, lo envíe a la Secretaría con un botón claro, reciba un mensaje verdadero al terminar o al fallar, y pueda **retomar** un borrador que dejó a medias.

**Solo rol activo `INVESTIGADOR`.** Se trabaja sobre las pantallas actuales, que ya funcionan, sin crear una sección nueva en `src/features/`:
- `nuevo-protocolo` (`/dashboard/investigador/nuevo-protocolo`): paso 1 (datos) y paso 2 (documentos y envío);
- `mis-protocolos` (`/dashboard/investigador/mis-protocolos`);
- `subsanacion` (`/dashboard/evaluacion-etica/subsanaciones`), solo el mensaje de error del envío de correcciones;
- el espacio actual del protocolo (`/dashboard/protocols/workspace/:id`), solo para ocultar `Completar / Editar` en un borrador.

**No incluye:**
- editar los datos del paso 1 de un borrador (RF-02.8): espera `PATCH /protocols/:id` (TSK-001.14 del backend) → T09-7;
- la fecha de eliminación, `Descartar borrador` y el límite de un borrador abierto (RF-02.7): esperan TSK-001.11 → T09-8;
- el retiro del código muerto (§8, P3): tarea de retiro aparte;
- la regla del título (RF-02.2): ya está en el frontend (PR #22 del frontend, `nuevo-protocolo.page.spec.ts:125-172`).

## 2. Decisiones de esta spec

| # | Decisión | Estado |
|---|---|---|
| D1 | Orden de tareas T09-0 → T09-1 → T09-2 → T09-3 → T09-4 → T09-5 → T09-6; T09-7 y T09-8 bloqueadas por el backend. El código muerto va en una tarea de retiro aparte | Decidida (usuaria, 10/11/2026) |
| D2 | `EVALUACION_SUBSANACIONES` se muestra como `Correcciones sin enviar`, no `En subsanación`, que se confunde con `REQUIERE_SUBSANACION_DOC` / `Con observaciones` | Decidida (usuaria, 10/11/2026) |
| D3 | Aviso de éxito del envío: `Protocolo enviado a la Secretaría.` (texto fijo del frontend; sin código CEISH, que el backend no devuelve) | Decidida (usuaria, 10/11/2026) |
| D4 | `Completar / Editar` se oculta en un borrador hasta TSK-001.14. `Continuar borrador` lleva directo al paso de documentos y envío, sin editar los datos del paso 1 | Decidida (usuaria, 10/11/2026) |
| D5 | Referencia visual de T09-2 y T09-4: canvas `MisProtocolosInvestigador` (chip `Borrador` con texto, botón `Continuar`). El aviso `Se elimina el…` y `Nuevo protocolo` deshabilitado **no** entran ahora: esperan TSK-001.11 (T09-8) | Decidida (usuaria, 10/11/2026) |
| D6 | El botón de envío del paso 2 dice `Enviar a la Secretaría` (decisión del 09/11/2026 recogida en el Paso 0); hoy dice `FIRMAR Y ENVIAR AL CEISH` (`nuevo-protocolo.page.html:330`) | Decidida (usuaria, 09/11/2026) |

## 3. Pantallas y navegación

### 3.1 Mis protocolos (`mis-protocolos.page.ts`)
- Datos: `GET /protocols/mis-protocolos?limit=100` (`protocolo.service.ts:281-283`). Incluye los borradores (backend `protocol.controller.ts:90-101`, sin `excludeDrafts`; RF-02.3 b).
- Chip de estado (`mis-protocolos.page.ts:64-67`, pipes `protocolStatusLabel`/`protocolStatusClass` → `ProtocolUI`, `protocol-ui.util.ts:27-38`):

  | `receptionStatus` del backend | Hoy | Con F09 |
  |---|---|---|
  | `BORRADOR` | `Iniciado` (alias `BORRADOR → INICIADO`, `estado.alias.ts:5`) | `Borrador` (F09-1) |
  | `EVALUACION_SUBSANACIONES` | código crudo `EVALUACION_SUBSANACIONES` (`protocol-ui.util.ts:30`) | `Correcciones sin enviar` (F09-5, D2) |
  | los demás | sin cambios | sin cambios |

- Tarjeta de un borrador: botón `Continuar` (canvas), con nombre accesible `Continuar borrador: {título}`, que lleva a `/dashboard/investigador/nuevo-protocolo?borrador={id}` (F09-4). Las demás tarjetas no lo muestran.

### 3.2 Nuevo protocolo (`nuevo-protocolo.page.ts` y `.html`)
- Paso 1 (datos) sin cambios: `POST /protocols` crea el borrador (RF-02.3 a).
- Paso 2 (documentos): botón `Enviar a la Secretaría` (D6) → `POST /protocols/:id/submit` (`protocolo.service.ts:270-279`, `nuevo-protocolo.page.ts:502`).
- Con `?borrador={id}` (F09-4): no se crea otro protocolo; se carga el checklist de ese protocolo (`getChecklist(id)`), el stepper abre en el paso 2 y el paso 1 queda completado y no editable.
- Después del envío: `/dashboard/investigador/mis-protocolos` (hoy navega a `/investigador/mis-protocolos`, `nuevo-protocolo.page.ts:513`, que no es una ruta y termina en el inicio por `**`, `app.routes.ts:133-136`).

### 3.3 Espacio actual del protocolo
- `Completar / Editar` (`protocol-workspace.component.ts:548-553`) y `Completar / Editar Datos` (`protocol-detail-tab.component.ts:34-40`, `isEditable()` `:569-580`) **no** se muestran cuando `receptionStatus` es `BORRADOR` (D4). Hoy llevan a `/investigador/protocolo/:id/editar` (ruta rota) y esa pantalla guarda con `PUT /protocols/:id`, que el backend no tiene.

### 3.4 Subsanación del investigador
- El envío de correcciones usa el mismo `POST /protocols/:id/submit` (`submit-subsanacion.use-case.ts:10`); el backend lo acepta desde 9 (versión > 1). Solo cambia el mensaje de error (F09-3).
- `Subir correcciones` en Mis protocolos (`mis-protocolos.page.ts:464-475`) elige el destino por la versión; hoy `versionNumber` llega como `"1.0"` (texto) y nunca vale `1` (F09-5).

## 4. Estados de cada pantalla

| Pantalla | Cargando | Vacío | Error | Éxito |
|---|---|---|---|---|
| Mis protocolos | sin cambios | sin cambios (`Listo para investigar`) | sin cambios | chips de §3.1 |
| Nuevo protocolo, envío | botón deshabilitado con spinner (`nuevo-protocolo.page.html:327-336`, sin cambios) | — | aviso con el mensaje del backend; se queda en el paso 2 y el botón se vuelve a habilitar (F09-3) | aviso `Protocolo enviado a la Secretaría.` y paso a Mis protocolos (F09-2) |
| Nuevo protocolo con `?borrador` | spinner mientras carga el checklist | checklist vacío: mismo comportamiento que hoy (`processRequirements([])`) | id inválido o protocolo ajeno: aviso con el mensaje del backend y vuelta a Mis protocolos | paso 2 con los documentos ya subidos marcados |
| Subsanación, envío | sin cambios | — | aviso con el mensaje del backend (F09-3) | sin cambios |

## 5. Interacciones y acción principal

- Acción principal del paso 2: `Enviar a la Secretaría`. Las validaciones previas del frontend no cambian (`nuevo-protocolo.page.ts:481-499`).
- Un segundo clic mientras se envía no hace otra petición (el botón ya se deshabilita con `isLoading`, `.html:327`).
- `Continuar` en una tarjeta de borrador: abre el paso 2 de ese borrador.
- Los mensajes van como texto en `MatSnackBar`, nunca como HTML (angular-security).

## 6. Endpoints

| Endpoint | Estado | Evidencia (backend `dev`) |
|---|---|---|
| `POST /protocols` | existe | `protocol.controller.ts:295`; respuesta `ProtocolMapper.toResponse` con `receptionStatus` (`protocol.mapper.ts:55`) |
| `POST /protocols/:id/submit` | existe | `protocol.controller.ts:247-271`. 201 → `{ data: { message, status: 'EN_REVISION_SECRETARIA' } }` (`protocols.service.ts:121-124`, `response.interceptor.ts:32-37`), sin `code`. 400 si no es el investigador principal (`protocol.controller.ts:263-268`). 404 si no existe (`protocols.service.ts:72-80`). 409 fuera de 9, 11 y 20 (`protocols.service.ts:111-118`, `can-submit-protocol.ts:8-23`) |
| `GET /protocols/mis-protocolos` | existe | `protocol.controller.ts:90-101`; incluye borradores |
| `GET /protocols/mis-subsanaciones` | existe | `protocol.controller.ts:103-119`; recepción 9 y versión > 1 (`protocol.typeorm.repository.ts:133-137`) |
| `GET /protocols/checklist/:id` | existe | usado por `getChecklist` (`protocolo.service.ts:155-157`) |
| `PATCH /protocols/:id` | **FALTA** (TSK-001.14) | `protocol.controller.ts` sin `@Patch`; el frontend llama `PUT` (`protocolo.service.ts:472-477`) |
| fecha de eliminación del borrador y descartar | **FALTA** (TSK-001.11) | RF-02.7 b y d |

Forma de los errores del backend: `{ statusCode, timestamp, path, error: { message, error, statusCode } }` (`http-exception.filter.ts:49`). El mensaje viene anidado en `error.message`.

## 7. Criterios de aceptación (EARS)

- **F09-1 (RF-02.5):** **Mientras** `receptionStatus` sea `BORRADOR`, el chip de la tarjeta en Mis protocolos **debe** mostrar el texto `Borrador` (texto, no solo color). → T09-2
- **F09-2 (RF-02.3 c, HU-002 4, D3, D6):** **Cuando** el investigador pulse `Enviar a la Secretaría` y el backend responda 201, el frontend **debe** mostrar `Protocolo enviado a la Secretaría.`, sin ningún código CEISH, y llevarlo a `/dashboard/investigador/mis-protocolos`, donde el chip dice `Revisión Secretaría`. → T09-3
- **F09-3 (RF-02.3 d y e.1):** **Si** el envío (desde Nuevo protocolo o desde Subsanación) responde 400 o 409, el frontend **debe** mostrar el mensaje en español del backend (`error.message`), quedarse en la pantalla y no mostrar el texto genérico de concurrencia (`Este trámite ha sido actualizado por otro usuario…`, `error.interceptor.ts:134-135`). → T09-1, T09-3, T09-5
- **F09-4 (HU-002 3 y 4, D4, D5):** **Mientras** el protocolo sea borrador, Mis protocolos **debe** ofrecer `Continuar`, que abre el paso de documentos y envío de ese mismo protocolo sin crear otro ni editar los datos del paso 1; y el espacio del protocolo **no debe** ofrecer `Completar / Editar` ni `Completar / Editar Datos`. → T09-4
- **F09-5 (RF-02.5, RF-02.3 e, D2):** **Mientras** `receptionStatus` sea `EVALUACION_SUBSANACIONES`, el chip **debe** decir `Correcciones sin enviar` y la tarjeta **debe** ofrecer `Subir correcciones`; **cuando** el investigador pulse `Subir correcciones`, el destino **debe** elegirse con el número de versión real (`"1.0"` → 1). → T09-2, T09-6
- **F09-6 (RF-02.8, HU-002 5; bloqueado por TSK-001.14):** **Mientras** el protocolo sea borrador, el investigador principal **debe** poder corregir los datos del paso 1 con `PATCH /protocols/:id`, con la regla del título de RF-02.2; después del envío, no. → T09-7
- **F09-7 (RF-02.7 a–d; bloqueado por TSK-001.11):** **Mientras** el protocolo sea borrador, la tarjeta **debe** mostrar `Se elimina el {dd/MM/yyyy}` (fecha del backend, hora de Ecuador) y `Descartar borrador`; **si** el investigador ya tiene un borrador abierto, `Nuevo protocolo` **debe** quedar deshabilitado con el motivo visible. → T09-8

## 8. Pendientes

| # | Pendiente | Estado |
|---|---|---|
| P1 | Agregar la captura de `MisProtocolosInvestigador` a `canvas/` | Abierto |
| P2 | Texto del motivo de `Nuevo protocolo` deshabilitado y formato del aviso `Se elimina el…` | Abierto, con T09-8 (TSK-001.11) |
| P3 | Código muerto visto en el Paso 0, para la tarea de retiro (D1): rama de quien no es investigador en `subsanacion.page.ts:1121-1146` (filtra `EVALUADO`/`EVALUACION_SUBSANACIONES` sobre una lista que ya los descartó, `load-reception-protocols.use-case.ts:15-22`; siempre vacía); `ProtocolCreatePage` (`protocols/components/protocol-create.page.ts`, sin ruta), `ProtocolFormComponent` y `SubmitProtocolUseCase` (único llamador de `protocol-api.adapter.ts:171-179`, `PUT`) | Abierto, tarea de retiro aparte |
| P4 | `protocol-validation-detail.page.ts:1311-1316` lee `err.error?.message`, que nunca existe en un `Error` (`base-api.service.ts:52`). Esa página la retira F02 (`specs/F02-espacio-recepcion/spec-ui.md` §1); no entra en T09-5 | Anotado |
| P5 | Otros enlaces absolutos `/investigador/...` sin `/dashboard` (`detalle-protocolo.page.ts:196,216,224`, `editar-protocolo.page.ts:161,254`, `enmiendas.page.ts:155`, `eventos-adversos.page.ts:153`, `renovaciones.page.ts:145`) | Fuera de F09; para la tarea de retiro o la que toque cada pantalla |
