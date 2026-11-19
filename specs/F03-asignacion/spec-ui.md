# F03 · Asignación de evaluadores por la Presidenta — spec-ui

**Versión:** 0.2 · **Fecha:** 19/11/2026 · **Rama:** `feat/asignacion-presidenta` (desde `dev` con EP1b, `444c49f`)
**Historial:**
- 0.2 (19/11/2026) revisión del Paso A (decisiones de la usuaria del 19/11/2026): D4 con la etiqueta visible «Perfil» y la primera opción «Elija el perfil»; D7 con el nombre tomado de lo que la Presidenta eligió y «Nombre no disponible» si falta; §4 con «no encontrado» solo para el 404 o 400 de `GET /protocols/:id`.
- 0.1 (19/11/2026) primer borrador desde el Paso 0 de la asignación de la Presidenta (frontend `444c49f`; backend `dev` `9759fba`, que ya trae TSK-002-N52 fusionada, PR #89) y las decisiones de la usuaria del 19/11/2026 (D1 a D10).

**Cubre:** spec-002 v1.3.2 del backend: RF-12.1 a–c y h (pantalla de la Presidente), RF-12.REV (tipo de revisión primero), RF-12.1 f (perfil Bioético), RF-12.2a (Anexo 10 para todos menos Sociedad civil), EARS 1, 1b y 1c. No copia su texto: lo cita.
**Depende de:** F00 (AppShell, `RoleGuard`, tokens, `PageHeader`, estados), F10 (menú por rol activo y espacio del protocolo: D20 de F10 se escribe junto con esta spec), F01 (fila ASIGNAR de Mis pendientes).
**Canvas:** no hay. La pantalla sigue los componentes y tokens de F00, como Mis pendientes (F01).
**Condición del backend:** TSK-002-N52 se fusiona con esta tarea (tasks.md del backend). Al escribir esta spec, N52 ya está en `dev` del backend (`9759fba`): con ese backend la Secretaría recibe `403` al asignar y el cuerpo antiguo `{ evaluatorIds }` recibe `400`.

---

## 1. Alcance y roles

Que la **Presidenta** (rol activo `PRESIDENTE`) asigne los evaluadores pares de un protocolo: primero el tipo de revisión (expedita o en pleno) y después las personas, con la composición que exige el backend. La **Secretaría** deja de asignar.

**Incluye:** la lista de protocolos por asignar, el formulario de asignación, la entrada en el menú de la Presidenta, el botón «Asignar Pares» del espacio del protocolo para la Presidenta, el retiro de las acciones de asignar de la Secretaría y el perfil Bioético en el frontend.

**No incluye:** la reasignación (RF-12.1 g, RF-12.3, proceso aparte); el cambio del tipo de revisión por la Secretaría (RF-12.REV b, TSK-002-N56); el conflicto de interés al asignar (TSK-002-N59); `ENSAYO_CLINICO` como tipo de revisión (spec-002 §11 n.º 8).

## 2. Decisiones (usuaria, 19/11/2026)

| # | Decisión |
|---|---|
| D1 | **Solo la Presidenta asigna.** La lista y el formulario llevan `RoleGuard` con `PRESIDENTE` y el permiso `EVALUACION_ASIGNAR` (el backend se lo da desde TSK-002-N51, migración 1970). Otro rol activo vuelve a su inicio con «No tiene acceso a esta sección con el rol activo.» (F00 D12). La Presidenta puede elegirse a sí misma si tiene el rol EVALUADOR activo (spec-002 §roles, RF-12.1 b): la pantalla no la excluye. |
| D2 | **Lista de la Presidenta:** `/dashboard/evaluations/assignment`, opción «Asignar evaluadores» del menú de PRESIDENTE (F10 D20). Datos de `GET /evaluations/protocols/pending-peer-assignment`. Columnas: Protocolo (código, si existe, y título), Investigador principal, Tipo de estudio, Recepción (fecha de recepción de la versión activa) y la acción «Asignar», que abre el formulario de ese protocolo. Sin datos inventados: sin título → «Sin título»; sin investigador → «Sin investigador principal»; sin tipo → «Sin tipo de estudio»; sin fecha → «Sin fecha»; sin código no se muestra código. Si el protocolo no tiene los tiempos aceptados (`isTimelineTermsAccepted === false`), la acción se deshabilita con el motivo «El investigador aún no acepta los tiempos del comité.» (D10 (3)). Estados: «Cargando protocolos por asignar…»; error «No pudimos cargar los protocolos por asignar.» con «Reintentar»; vacío «No hay protocolos por asignar.». |
| D3 | **Revisión expedita** (RF-12.1 a): una fila por perfil, en este orden: Metodológico, Salud, Jurídico, Bioético y Sociedad Civil. Cada fila tiene un selector con las personas que tienen ese perfil activo («Elija una persona»), sin valor elegido al empezar. Cada fila se puede quitar con «Quitar fila», **salvo Sociedad Civil**; una fila quitada se vuelve a poner con «Agregar {perfil}». La fila de un perfil **sin miembros disponibles no aparece** (RF-12.1 f). |
| D4 | **Revisión en pleno** (RF-12.1 b y c): una fila por cada persona con rol EVALUADOR activo, incluida en la asignación al empezar. Cada fila tiene el nombre, un selector con la etiqueta visible «Perfil» (su texto accesible es «Perfil de {nombre}») y los perfiles activos de esa persona, **sin valor por defecto** (aunque tenga uno solo; la primera opción es «Elija el perfil»), y «Quitar» / «Incluir». Cada persona entra con un solo perfil, el que elige la Presidenta. Una persona sin perfiles muestra «Sin perfil asignado», queda fuera y no se puede incluir (D8). |
| D5 | **Composición válida, en los dos tipos** (RF-12.1 c, EARS 1): al menos 2 evaluadores, al menos uno de Sociedad Civil, al menos uno que no sea de Sociedad Civil y sin personas repetidas. El botón «Asignar evaluadores» se deshabilita mientras la composición no sea válida y muestra **el primer motivo** debajo (`aria-describedby`), en este orden: (1) «El investigador aún no acepta los tiempos del comité.»; (2) «Elija el tipo de revisión.»; (3) expedita: «Elija una persona para {perfil} o quite la fila.»; pleno: «Elija el perfil de {nombre}.»; (4) «{nombre} está en más de una fila; cada persona entra una sola vez.»; (5) «Asigne al menos 2 evaluadores.»; (6) «Incluya al menos un evaluador de Sociedad Civil.»; (7) «Incluya al menos un evaluador que no sea de Sociedad Civil.». Las reglas viven en una función pura del dominio; los números y perfiles salen de constantes (`MIN_ASSIGNED_EVALUATORS`, `EXPEDITED_REVIEW_PROFILES`), no se escriben en la plantilla. |
| D6 | **Envío** (RF-12.1, RF-12.REV): `POST /evaluations/protocols/:id/assign-peer-evaluators` con `{ reviewType, evaluators: [{ evaluatorId, profile }] }`, en el orden de las filas. Mientras se envía, el botón dice «Asignando…» y no se puede volver a pulsar. Si el backend responde `400` o `409`, la pantalla muestra **tal cual** su mensaje (en español) en un aviso `role="alert"` sobre el botón; si no trae mensaje, «No se pudieron asignar los evaluadores.». Los datos del formulario se conservan para corregir. El `403` lo maneja el interceptor (F00 D12). |
| D7 | **Éxito:** «Se asignaron N evaluadores.» (N = asignaciones que devolvió el backend) y, por cada una, el nombre de la persona (el que la Presidenta eligió en el formulario, no el de la respuesta, que no lo trae; si aun así falta, «Nombre no disponible», nunca el id), su perfil y, si `isAssignedForAnnex10`, «Define el riesgo (Anexo 10)» (RF-12.2a: todos menos Sociedad Civil, sin sorteo). Sin fecha límite: la respuesta no trae la fecha límite de la revisión (`fecha_limite_revision` de N52 va solo en el oficio) y su `deadlineDate` es la de la convocatoria; no se calcula ninguna fecha en el frontend. Botón «Volver a la lista», que recarga la lista. |
| D8 | **Miembros y perfiles (transitorio hasta TSK-002-N54):** `GET /evaluations/profiles` devuelve solo el catálogo de perfiles activos, sin miembros (`findProfiles`: `profileRepo.find({ where: { isActive: true } })`, backend `dev`). Por eso las personas salen de `GET /evaluations/evaluators/active` (usuarios activos con rol EVALUADOR; devuelve `id`, `fullName` e `institutionalEmail`, **sin perfiles**) y sus perfiles de `GET /evaluations/evaluators/dashboard` (`profiles[].name`; permiso `REPORTES_CARGA`, que la PRESIDENTE tiene), **cruzados por id**: solo aparecen las personas de `evaluators/active`; una persona sin perfiles en el dashboard queda «Sin perfil asignado». Los nombres de perfil se convierten a códigos con la misma función que la reasignación (`normalizeProfile`; un nombre desconocido se ignora). Se cambia cuando `evaluators/active` devuelva los perfiles (N54). |
| D9 | **Perfil Bioético** (RF-12.1 f, TSK-002-N50): `BIOETICO` entra en `PEER_EVALUATOR_PROFILES` y en la única lista de etiquetas (`Bioético`). Los catálogos aparte se alinean con los códigos del backend si reciben sus datos: `evaluator.entity.ts` (lo llena `GET /evaluations/evaluators/dashboard`) pasa a los códigos `PeerEvaluatorProfile` y su filtro a la lista única. `subsanacion.page.ts` lee `evaluatorProfile` de `GET /evaluations/protocol/:id/observations`, que manda el **nombre** del perfil (`assignment.profile?.name`), no el código: solo se agrega la etiqueta de Bioético a su mapa y queda anotado (§8). |
| D10 | **Retiro de la asignación de la Secretaría:** (1) se borran `AssignPeersModalComponent`, `PeerRiskPendingTableComponent`, la página de `/estratificacion-riesgo` (`PeerRiskPendingPage`), su ruta, `AssignmentPage` (la redirección de `/dashboard/evaluations/assignment`), `pending-peer-protocol.util.ts` y sus specs; (2) la pestaña «Estratificación de Riesgo» de `DashboardSecretariaPage` (`dashboard-secretaria.page.ts:91`) sale; (3) la acción rápida «Oficializar Asignaciones» (`dashboard-home.page.ts:726-728`) sale; (4) «Asignar Pares» del espacio del protocolo pasa a PRESIDENTE (F10 D20) y lleva al formulario; (5) la fila ASIGNAR de Mis pendientes queda **sin acción**, con el texto «Pendiente de asignación por la Presidencia» (F01); (6) el aviso de tiempos no aceptados pasa a la Presidenta como motivo del botón deshabilitado en su lista y en el formulario (D2, D5); el backend igual responde `409`. |

## 3. Pantallas y navegación

| Pantalla | Ruta | Guard | Se llega desde |
|---|---|---|---|
| Lista «Asignar evaluadores» | `/dashboard/evaluations/assignment` | `RoleGuard` [PRES] + `AuthGuard` `EVALUACION_ASIGNAR` | Menú de PRESIDENTE (F10 D20); «Volver a la lista» del formulario |
| Formulario de asignación | `/dashboard/evaluations/assignment/:protocolId` | `RoleGuard` [PRES] + `AuthGuard` `EVALUACION_ASIGNAR` | «Asignar» de la lista; «Asignar Pares» del espacio del protocolo (F10 D20) |

`/dashboard/evaluacion-etica/...` carga las mismas rutas (`dashboard/routes.ts:52-53`); no se enlaza.

**Formulario, de arriba abajo:** `PageHeader` «Asignar evaluadores» con el código (si existe) y el título del protocolo como subtítulo (de `GET /protocols/:id`); grupo «Tipo de revisión» con «Expedita» y «En pleno» (radio, sin valor al empezar); las filas de D3 o D4; el motivo de D5 o el error de D6; el botón «Asignar evaluadores» y el enlace «Volver a la lista».

## 4. Estados

- **Lista:** cargando, error con «Reintentar», vacío y datos (D2).
- **Formulario:** cargando «Cargando la asignación…» (protocolo y miembros a la vez); error «No pudimos cargar los datos de la asignación.» con «Reintentar»; protocolo no encontrado (un id que no es número, o el 404 o 400 de `GET /protocols/:id`; si falla la carga de los miembros u otra, es el estado de error con «Reintentar») «No encontramos este protocolo. Revise el enlace.» con «Volver a la lista»; sin miembros activos: «No hay evaluadores activos para asignar.»; enviando (D6); error del envío (D6); éxito (D7).
- **Expedita sin miembros de Sociedad Civil:** no hay fila de Sociedad Civil y el motivo es el (6) de D5.

## 5. Interacciones

- Al cambiar el tipo de revisión se vuelve a armar la composición desde cero (las elecciones del otro tipo no se conservan) y desaparece el error del envío anterior.
- Una persona elegida en una fila de la expedita sigue apareciendo en las demás filas donde tiene perfil; si se elige dos veces, el motivo (4) de D5 lo dice.
- Todo se usa con teclado: los selectores son `<select>` nativos con `<label>`, el grupo de tipo es un `fieldset` con `legend`, los botones tienen texto visible y el motivo del botón deshabilitado está enlazado con `aria-describedby`.
- Estilos solo con los tokens de F00 (`src/styles/_tokens.scss`), sin Bootstrap ni colores hexadecimales. Trato de usted.

## 6. Endpoints

| Endpoint | Para qué | Estado |
|---|---|---|
| `GET /evaluations/protocols/pending-peer-assignment` | Lista (D2) | Existe. **Pendiente del backend (N54):** no excluye los protocolos que ya tienen asignaciones activas (`evaluations.service.ts`, `getProtocolsPendingPeerAssignment`): un protocolo recién asignado sigue en la lista hasta N54 y un segundo intento responde `409` «La versión activa del protocolo ya tiene evaluadores asignados.», que la pantalla muestra (D6). Hoy solo devuelve protocolos con los tiempos aceptados. Devuelve la entidad ORM con `studyType { name }`, `principalInvestigator { fullName }` y `activeVersion.reception.receptionDate` |
| `GET /evaluations/evaluators/active` | Personas (D8) | Existe. **Pendiente del backend (N54):** no trae perfiles |
| `GET /evaluations/evaluators/dashboard` | Perfiles de cada persona (D8, transitorio) | Existe (`REPORTES_CARGA`); no filtra inactivos, por eso se cruza con `evaluators/active` |
| `GET /protocols/:id` | Código, título y `isTimelineTermsAccepted` del formulario | Existe |
| `POST /evaluations/protocols/:id/assign-peer-evaluators` | Envío (D6) | Existe (N52): `@Roles('PRESIDENTE')`, `400`/`409` en español, respuesta `{ data: EvaluationAssignmentEntity[] }` |

## 7. Criterios de aceptación (EARS)

1. Mientras el rol activo sea PRESIDENTE, el menú lateral debe mostrar «Asignar evaluadores», que abre `/dashboard/evaluations/assignment` (D2, F10 D20).
2. Si el rol activo no es PRESIDENTE, entonces el sistema no debe abrir la lista ni el formulario y debe volver al inicio del rol con «No tiene acceso a esta sección con el rol activo.» (D1).
3. La lista debe mostrar los protocolos de `pending-peer-assignment` sin datos inventados, y cada «Asignar» debe abrir `/dashboard/evaluations/assignment/{id}` (D2).
4. Mientras el tipo sea EXPEDITA, el formulario debe mostrar una fila por perfil en el orden de D3, solo para los perfiles con miembros, y no debe permitir quitar la fila de Sociedad Civil (D3).
5. Mientras el tipo sea PLENO, el formulario debe mostrar una fila por cada persona de `evaluators/active`, con su selector de perfil sin valor por defecto; una persona sin perfiles debe mostrar «Sin perfil asignado» y no se debe poder incluir (D4, D8).
6. Mientras la composición no cumpla D5, el botón «Asignar evaluadores» debe estar deshabilitado y mostrar el primer motivo de D5.
7. Cuando la Presidenta envíe una composición válida, el sistema debe mandar `{ reviewType, evaluators: [{ evaluatorId, profile }] }` y nunca `evaluatorIds` (D6).
8. Si el backend responde `400` o `409`, entonces la pantalla debe mostrar su mensaje tal cual y conservar el formulario (D6).
9. Cuando el backend acepte la asignación, la pantalla debe mostrar «Se asignaron N evaluadores.» con el perfil de cada uno y «Define el riesgo (Anexo 10)» en los que lo tienen (D7).
10. Mientras el rol activo sea SECRETARIA, el sistema no debe ofrecer ninguna acción para asignar evaluadores, y la fila ASIGNAR de Mis pendientes debe mostrar «Pendiente de asignación por la Presidencia» sin botón (D10).
11. El frontend debe reconocer el perfil `BIOETICO` y mostrarlo como «Bioético» (D9).
12. Los estilos de la lista y del formulario no deben tener colores hexadecimales (§5).

## 8. Pendientes

- **Backend (N54):** `pending-peer-assignment` no excluye los protocolos ya asignados (§6); `evaluators/active` no trae perfiles. D8 es transitoria: al cerrar N54 se lee una sola fuente y se borra el cruce.
- **Fecha límite de la revisión:** la respuesta de la asignación no trae `fecha_limite_revision`; mostrarla requiere un cambio del backend.
- **`subsanacion.page.ts`:** su mapa de etiquetas está escrito con códigos que el endpoint no manda (`getObservationsForInvestigator` manda el nombre del perfil o «Evaluador»), así que hoy muestra el nombre tal cual; se revisa con el rediseño de Subsanaciones (F10 §1).
- **`evaluator-load.component.ts`:** su entidad espera `nombre`, `perfil` y `cargaActiva`, pero el dashboard manda `fullName`, `profiles[]` y `currentLoad`; D9 solo alinea los códigos y el filtro; la lectura de la respuesta queda pendiente (hoy cada fila dice «Sin Perfil»).
- **`evaluation-consolidation.page.ts:65`:** su botón «Volver» lleva a `/dashboard/evaluations/assignment`, que ahora es la lista de la Presidenta (antes, una redirección); con SECRETARIA activa rebota a su inicio con aviso. Se revisa con F04.
