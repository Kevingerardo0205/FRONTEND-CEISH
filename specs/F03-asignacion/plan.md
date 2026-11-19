# F03 · Asignación de evaluadores por la Presidenta — plan

**Versión:** 0.1 · **Fecha:** 19/11/2026 · Spec: `spec-ui.md` v0.1 (D1 a D10).

## 1. Por capa

### domain
- `src/domain/entities/peer-evaluation.entity.ts`:
  - `PEER_EVALUATOR_PROFILES` con `BIOETICO` (D9) y la única lista de etiquetas `PEER_EVALUATOR_PROFILE_LABELS` (antes en `active-assignment-view.util.ts`, que la importa).
  - `normalizeProfile` pasa aquí desde `reassignment-candidates.util.ts` (la usan la reasignación y D8; el util la reexporta, sin duplicarla).
  - Se retiran `PEER_ASSIGNMENT_QUOTA` (cuota fija de 4, sin usuarios después de borrar el modal) y `AssignEvaluatorsResponse`/`PeerAssignmentResult` cambian a la respuesta de N52.
  - `PendingPeerAssignmentProtocol` pasa a una forma estricta con `null` donde falta el dato (D2).
  - `AssignmentMember`, `AssignmentReviewType`, `AssignedEvaluator`.
- **CREAR** `src/domain/entities/peer-assignment-composition.ts` + spec: `EXPEDITED_REVIEW_PROFILES`, `MIN_ASSIGNED_EVALUATORS`, `compositionBlockReason(reviewType, selections)` (motivos (2) a (7) de D5, en orden), `expeditedRowProfiles(members)` (D3: perfiles con miembros) y `crossAssignmentMembers(active, dashboardEvaluators)` (D8).
- `src/domain/ports/IEvaluationRepositoryPort.ts`: `assignPeerEvaluators(protocolId, { reviewType, evaluators })`; `ActiveEvaluator` con la forma real (`id`, `fullName`).
- `src/domain/entities/evaluator.entity.ts`: `EvaluatorProfile` = `PeerEvaluatorProfile` (D9).

### application
- **CREAR** `src/features/evaluations/application/load-assignment-members.use-case.ts` + spec: `forkJoin` de `getActiveEvaluators` y `getEvaluatorsDashboard`, cruzados con `crossAssignmentMembers` (D8).
- **CREAR** `src/features/evaluations/application/assign-peer-evaluators.use-case.ts` + spec: llama al puerto (la página no llama al puerto directo, README §2.2 regla 4).
- `load-pending-peer-assignment-protocols.use-case.ts` se reutiliza sin cambios.
- Para el protocolo del formulario se usa `IProtocolRepositoryPort.getById` (puerto de `src/domain`, ya registrado en `app.config.ts:65`), a través de un caso de uso nuevo `load-assignment-protocol.use-case.ts` en la sección.

### infrastructure
- `src/infrastructure/adapters/evaluation-api.adapter.ts` + spec: el cuerpo de N52; `getPendingPeerAssignmentProtocols` con un mapper estricto (D2: `studyType.name`, `principalInvestigator.fullName`, `activeVersion.reception.receptionDate`, `isTimelineTermsAccepted`); `getActiveEvaluators` con la forma real.

### presentation
- **CREAR** `src/features/evaluations/presentation/pages/peer-assignment-list/peer-assignment-list.page.{ts,html,scss}` + spec (D2). Reemplaza a `PeerRiskPendingPage` y `PeerRiskPendingTableComponent`, que se borran (D10 (1)): tenían colores fijos y rellenos inventados («General», «Investigador Principal», «S/C»).
- **CREAR** `src/features/evaluations/presentation/pages/peer-assignment-form/peer-assignment-form.page.{ts,html,scss}` + spec (D3 a D7). Reemplaza a `AssignPeersModalComponent`, que se borra (D10 (1)).
- `src/features/evaluations/routes.ts` + spec: `assignment` (lista) y `assignment/:protocolId` (formulario), `loadComponent`, `RoleGuard` [PRES] + `AuthGuard` `EVALUACION_ASIGNAR`; se quita `AssignmentPage`.
- `src/app/app.routes.ts` + spec: se quita `estratificacion-riesgo` de `SECRETARIA_ROUTES`.
- `src/features/shell/infrastructure/menu.config.ts` + spec: «Asignar evaluadores» de PRESIDENTE (F10 D20).
- `src/features/protocols/domain/workspace-tab-roles.ts` y `protocol-workspace.component.ts` + specs: `ASSIGN_EVALUATORS` → PRESIDENTE; «Asignar Pares» navega al formulario (F10 D20).
- `src/features/dashboard/presentation/pages/dashboard-secretaria/dashboard-secretaria.page.ts`: sin la pestaña PEERS ni la carga de la bandeja (D10 (2)).
- `src/features/dashboard/presentation/pages/dashboard-home.page.ts`: sin «Oficializar Asignaciones» (D10 (3)).
- `src/features/pendientes/domain/accion.rules.ts`, `pendientes-table.component.{ts,html}` + specs: ASIGNAR sin destino y con el texto de D10 (5).
- `active-assignment-view.util.ts`, `reassignment-candidates.util.ts`, `evaluator-load.component.ts` y `subsanacion.page.ts` (D9).

## 2. Mapa de equivalencias (búsqueda del Paso 0, 19/11/2026)

| Pieza | Búsqueda | Resultado |
|---|---|---|
| Lista de protocolos por asignar | `grep -rn "pending-peer-assignment\|PeerRiskPending" src` | (b) `PeerRiskPendingPage` + `PeerRiskPendingTableComponent` (`/estratificacion-riesgo`, solo SECRETARIA): se reemplazan y se borran en esta tarea (D10) |
| Formulario de asignación | `grep -rn "AssignPeersModalComponent\|assign-peer-evaluators" src` | (b) `AssignPeersModalComponent` (cuota fija de 4, cuerpo `{ evaluatorIds }`): se reemplaza y se borra en esta tarea |
| Miembros con perfiles | `grep -rn "mapDashboardCandidates\|getActiveEvaluators" src` | (c) `normalizeProfile` y el dashboard de la reasignación se reutilizan; `getActiveEvaluators` no tenía usuarios y su tipo no coincidía con el backend |
| Caso de uso de la lista | `load-pending-peer-assignment-protocols.use-case.ts` | (c) se reutiliza |
| Etiquetas de perfil | `grep -rn "Sociedad Civil\|PROFILE_LABELS" src` | (c) una sola lista en el dominio |
| Ruta `/dashboard/evaluations/assignment` | `evaluations/routes.ts` | (b) `AssignmentPage` (solo redirigía): se borra y la ruta pasa a la lista |

## 3. Pruebas

- domain: `peer-assignment-composition.spec.ts` (cada motivo de D5, orden de las filas de D3, cruce de D8) y `peer-evaluation.entity.spec.ts` (5 perfiles, etiquetas, `normalizeProfile`).
- application: los dos casos de uso nuevos con el puerto simulado.
- infrastructure: el cuerpo del `POST`, el mapper de la lista y de `evaluators/active`.
- presentation: lista y formulario con TestBed (estados, filas, motivos, envío, 400/409, éxito); rutas, menú, espacio del protocolo y Mis pendientes.

## 4. Pantallas actuales a verificar en el navegador

- PRESIDENTE: menú, lista, formulario expedita y pleno, envío, «Asignar Pares» del espacio.
- SECRETARIA: Mis pendientes (fila ASIGNAR sin botón), espacio del protocolo sin «Asignar Pares», `/estratificacion-riesgo` ya no existe.
