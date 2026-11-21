# F11 · Qué ve cada rol de un protocolo — tasks

**Versión:** 0.1 · **Fecha:** 20/11/2026 · Spec: `spec-ui.md` v0.1 · Plan: `plan.md` v0.1.

**Línea base (20/11/2026, `975b8e5`):** `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit` exit 0; `npx ng test --watch=false` tres veces: `2 FAILED` de 1518 (nombres no guardados) · `1 FAILED, 1517 SUCCESS` · `1 FAILED, 1517 SUCCESS` (las dos con «NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c) nuevo diseño (D15, C2d) con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra», prueba de foco ya anotada en F00); `npx ng build --configuration production` exit 0; `npx eslint "src/**/*.ts"` `✖ 65 problems (0 errors, 65 warnings)`.
**Verificación:** `npx tsc` app y spec dos veces · `npx ng test --watch=false` tres veces, con los nombres de lo que falle · `npx ng build --configuration production` · `npx eslint` (ningún archivo empeora).

## 1. Frontend

| Tarea | Contenido | Depende del backend | Estado |
|---|---|---|---|
| **EP2** · La PRESIDENTE ve Recepción en solo lectura | spec-ui §4, EARS F11-1 a F11-7; plan EP2 | No | En curso |
| EP3 · Lista de documentos compartida | Una sola pieza en lugar de la lista vacía del Resumen; la usan los 4 roles | Sí, para el investigador (B6) | Pendiente |
| EP4 · El investigador sin datos internos | Sin la bitácora para INVESTIGADOR, sin la bitácora inventada para nadie; en Subsanaciones, perfil y dictamen de cada par sin nombres y sin los informes con nombre (V5) | B2 y B8 | Pendiente |
| EP5 · Pantalla del evaluador | `ProtocolHeader` (código, título, tipo), la lista de EP3 y el plazo (V6) | B4 y B6 | Pendiente |
| EP6 · Espacio por etapas | Las 6 etapas para SECRETARIA y PRESIDENTE; las cerradas en solo lectura (V2) | — | Pendiente |
| EP7 · Resolución firmada | La SECRETARIA la sube; INVESTIGADOR y PRESIDENTE la ven (V7) | B11 | Pendiente |

### EP2 · La PRESIDENTE ve Recepción en solo lectura

- **Capas:** domain (`workspace-tab-roles.ts`) y presentation (`protocol-validation-detail.page.ts`).
- **Pruebas:** `protocol-validation-detail.page.spec.ts`, `src/app/workspace-routes.spec.ts`, `src/features/route-roles.spec.ts`, `protocol-workspace.component.spec.ts`.
- **Terminado cuando:** EARS F11-1 a F11-7 con prueba; mutaciones M1 a M8 detectadas y revertidas; verificación completa sin archivos que empeoren.
- **Mutaciones previstas:** M1 sin PRESIDENTE en `WORKSPACE_TAB_ROLES.validation`; M2 rama de la Secretaría con `!isInvestigador()`; M3 constancia con `(!isInvestigador() || isFinalized())`; M4 observaciones generales con `!isInvestigador()`; M5 sin la salida temprana de los métodos; M6 `isReadOnlyMode` con `isFinalized()` para quien no es investigador; M7 celda de estado con `isInvestigador()`; M8 cuadro de observaciones generales sin `[disabled]` (V9).

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
- **B8:** observaciones al investigador con perfil y dictamen de cada par, sin nombres ni `reportPath`; el correo de la resolución sin los informes con el nombre del revisor (V5).
- **B9:** `GET /resolutions/protocol/:id` con la regla del lector y un mapper.
- **B10:** sacar de la respuesta al investigador los campos internos (`isPresidentNotified`, `presidentNotificationDate`, `timelineTermsAcceptedIp`, `versionLock`); `riskLevel` y `reviewType` solo una vez fijados (V5).
- **B11:** endpoint para subir la resolución firmada y su estado (V7).
