# F11 · Qué ve cada rol de un protocolo — plan

**Versión:** 0.2 · **Fecha:** 20/11/2026 · Spec: `spec-ui.md` v0.2.

## EP2 · La PRESIDENTE ve Recepción en solo lectura

**domain** (`src/features/protocols/domain/workspace-tab-roles.ts`)
- `WORKSPACE_TAB_ROLES.validation`: SECRETARIA, PRESIDENTE e INVESTIGADOR. El `RoleGuard` de `protocols/routes.ts` y las pestañas del espacio (`protocol-workspace.component.ts`) ya leen esa fila; no cambian.
- Se reutiliza `WORKSPACE_ACTION_ROLES.VALIDATE_ALL` (SECRETARIA) para decidir quién valida, sin una tabla nueva.

**application / infrastructure:** sin cambios. Los casos de uso y los adaptadores son los mismos.

**presentation** (`protocol-validation-detail.page.ts`, sin duplicar la pantalla)
- `canValidate`: rol activo en `VALIDATE_ALL`. Las ramas de la Secretaría pasan de `!isInvestigador()` a `canValidate()`; las de lectura que hoy son del investigador pasan a `!canValidate()` (páginas, chip de estado, observación de cada requisito, observaciones de la Secretaría).
- `isReadOnlyMode`: verdadero también sin las vistas de validar ni de subsanar.
- Constancia, «Finalizar» y aviso legal: solo con `canValidate()` (la constancia del investigador sigue como hoy).
- `onValidateItem`, `onChangePageCount` y `onFinalize` salen de inmediato sin `canValidate()`.
- Cuadro de observaciones generales: `[disabled]="isFinalized()"` (V9).
- Sin `.scss` nuevo, sin colores nuevos.

**Pruebas**
- `protocol-validation-detail.page.spec.ts`: PRESIDENTE en revisión y con el protocolo validado (sin controles, con la lectura, abre el documento, los métodos no llaman al backend); SECRETARIA con el protocolo validado (cuadro deshabilitado).
- `src/app/workspace-routes.spec.ts`, `src/features/route-roles.spec.ts` y `protocol-workspace.component.spec.ts`: la fila nueva de `validation`.

**Se retira:** nada.

## EP4 · El investigador sin datos internos

**domain**
- `src/features/protocols/domain/workspace-tab-roles.ts`: `WORKSPACE_SECTION_ROLES.AUDIT_TRAIL` = SECRETARIA y PRESIDENTE (V10), junto a `EVALUATOR_PANEL`; sin tabla nueva.
- `src/features/audit/domain/entities/audit.entity.ts`: `ProtocolTrailEvent` sin `integrityHash` (V13).
- `src/domain/catalogs/dictamen.catalog.ts` (se reutiliza `DictamenId`, que ya copia `EvaluatorDictamen`): etiquetas del dictamen y los textos «Sin dictamen registrado» y «Dictamen no reconocido» (V15).
- `src/domain/ports/IEvaluationRepositoryPort.ts`: `ObservationEntry` con la forma que se muestra (perfil, dictamen, observaciones generales y detalle del checklist), sin `evaluatorName` (V14).

**application:** `load-subsanacion-detail.use-case.ts` usa el arreglo que ya entrega el adaptador (sin el `switchMap` con `any`). `AuditUseCase` sin cambios.

**infrastructure**
- `audit-repository.adapter.ts`: se retiran `mockLogs`, `getMockTrail` y los dos `catchError`; vacío → `[]`; el error se propaga (V11). Sin la huella (V13).
- `evaluation-api.adapter.ts`, `getProtocolObservations`: desenvuelve `data` y `observations` y deja pasar solo los campos de `ObservationEntry` (V14).

**presentation**
- `protocol-detail-tab.component.ts`: bitácora con `showAuditTrail()` (rol activo en `AUDIT_TRAIL`); estados de §5 con `LoadingState`, `EmptyState` y `ErrorState`; «Reintentar» vuelve a pedirla. Sin la huella.
- `protocol-trail.page.ts`: estados de §5 y sin la huella; sin el código inventado `PRT-2026-001`.
- `audit-logs.page.ts` y `audit-feed.component.ts`: estados de §5; el feed ya no convierte el error en vacío ni dice «Cargando flujo de eventos...» con la lista vacía.
- `subsanacion.page.ts`: sin los tres enlaces de los informes individuales; dictamen con las etiquetas del catálogo (la clase del distintivo reutiliza las existentes, sin colores nuevos).

**Pruebas:** `audit-repository.adapter.spec.ts` (nuevo, `HttpTestingController`), `evaluation-api.adapter.spec.ts`, `protocol-detail-tab.component.spec.ts`, `protocol-trail.page.spec.ts`, `audit-logs.page.spec.ts`, `audit-feed.component.spec.ts` (si no existe, nuevo), `subsanacion.page.spec.ts`, `audit.use-case.spec.ts` (sin la huella). Nombres de prueba ficticios (`ZZ_TEST_`), nunca de personas reales.

**Se retira:** los datos de respaldo de `audit-repository.adapter.ts` (`mockLogs`, `getMockTrail`) y la huella; no los usa nadie más (`git grep`).
## EP2b - Revisar documentacion antes de asignar

**Alcance:** permitir que la PRESIDENTA consulte la documentacion de un protocolo antes de asignar evaluadores, reutilizando F03 y EP2. Esta etapa documenta el diseno; no implementa codigo ni cambia permisos.

**Piezas existentes que se reutilizan**
- `PeerAssignmentListPage` en `/dashboard/evaluations/assignment`.
- `PeerAssignmentFormPage` en `/dashboard/evaluations/assignment/:protocolId`.
- `ProtocolWorkspaceComponent` y `ProtocolWorkspaceService`.
- `ProtocolValidationDetailPage` en `/dashboard/protocols/workspace/:id/validation`.
- `WORKSPACE_TAB_ROLES`, `WORKSPACE_ACTION_ROLES` y la accion `ASSIGN_EVALUATORS` de F10.

**Navegacion propuesta**
- Navegacion SPA en la misma pestana.
- El identificador se conserva en el parametro de ruta `:id` o `:protocolId` segun el destino existente.
- El contexto se conserva mediante un origen interno limitado a `assignment-list` o `assignment-form`.
- El retorno se resuelve mediante destinos conocidos; no se acepta una URL arbitraria ni una redireccion abierta.
- Desde `assignment-list`, el retorno vuelve a la lista.
- Desde `assignment-form`, el retorno vuelve al formulario del mismo protocolo.
- La accion `Asignar Pares` conserva su destino actual al formulario.

**Decisiones EP2b propuestas**

| # | Contexto | Decision | Justificacion | Consecuencias tecnicas |
|---|---|---|---|---|
| D21 | F03 necesita abrir el detalle sin abandonar el flujo institucional. | «Ver protocolo» abre el workspace existente en la misma pestana. | Reutiliza EP2 y evita duplicar la vista documental. | Se anade una navegacion desde la lista hacia el workspace. |
| D22 | El retorno debe identificar de donde partio la PRESIDENTA. | Se conserva el identificador y un origen interno permitido. | Mantiene el protocolo seleccionado y evita retornos arbitrarios. | Se propaga un contexto limitado a `assignment-list` o `assignment-form`. |
| D23 | F03 ya tiene una accion de asignacion. | «Ver protocolo» es independiente de «Asignar». | Consultar documentacion no debe alterar la accion existente. | Se mantienen dos acciones y sus destinos independientes. |
| D24 | EP2 ya define el modo de consulta de PRESIDENTA. | Se conserva el acceso de solo lectura y no se cambian guards ni permisos. | La ocultacion visual no sustituye la autorizacion existente. | Se reutilizan `RoleGuard`, `WORKSPACE_TAB_ROLES` y `WORKSPACE_ACTION_ROLES`. |
| D25 | La lista y el formulario requieren retornos distintos. | El retorno depende del origen de navegacion. | Evita perder el contexto de F03. | Se implementan destinos de retorno permitidos y deterministas. |
| D26 | EP2 ya contiene Validacion y F10 D20 ya contiene la asignacion. | Se reutilizan el workspace y Validacion, sin vista paralela. | Reduce duplicacion y conserva la trazabilidad de F11/F10. | No se crean componentes, endpoints ni servicios nuevos salvo evidencia posterior. |

**Restricciones**
- Sin cambios de backend ni nuevos endpoints.
- Sin cambios en dependencias, environments, guards o permisos.
- Sin duplicar componentes de F03 o EP2.
- Sin modificar la logica de asignacion existente.
- La seguridad de solo lectura sigue dependiendo de la autorizacion existente; el frontend no es la unica barrera.

**Pruebas previstas:** navegacion desde la lista, navegacion desde el formulario, `protocolId`, origen permitido, retorno, solo lectura, regresion de «Asignar» y regresion de «Asignar Pares». La verificacion de que las acciones del workspace conservan realmente el contexto queda pendiente de la implementacion.
## Revisión EP2b — flujo integrado de asignación (22/11/2026)

Implementado dentro del alcance de F11: `PeerAssignmentListPage` navega a la pestaña `assignment` del workspace y ya no ofrece «Ver protocolo». La ruta hija reutiliza `PeerAssignmentFormPage`; el formulario acepta el identificador del parámetro padre `workspace/:id` y conserva la ruta independiente existente para compatibilidad. `ProtocolWorkspaceComponent` añade la pestaña solo para `PRESIDENTE` en el estado de asignación y `Asignar Pares` usa el mismo destino integrado.

Pruebas actualizadas: lista de asignaciones, roles/rutas del workspace y acciones contextuales. `tsc` de aplicación y specs pasan; la ejecución de Karma quedó bloqueada porque Chrome no inicia en el entorno local por errores de GPU/OS encryption.
