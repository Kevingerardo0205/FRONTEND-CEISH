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
