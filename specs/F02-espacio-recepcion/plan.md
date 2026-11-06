# F02 · Espacio del protocolo + Recepción — plan

**Versión:** 0.1 · **Fecha:** 06/11/2026 · **Spec:** `spec-ui.md` 0.1
**Patrón:** el de F01 (`specs/F01-pendientes-protocolos/plan.md`): sección propia con `domain`/`application`/`infrastructure`/`presentation`, port de la sección registrado en la ruta, fachada con signals provista en la página, mappers estrictos con `contract-readers`, estados por bloque.

---

## 1. Estructura

```text
src/features/espacio-protocolo/      ← /protocolos/:id/{resumen|documentos|recepcion|recorrido}
├── domain/                          ← modelos, ports, reglas (contadores, acción principal, páginas)
├── application/                     ← EspacioProtocoloFacade (signals)
├── infrastructure/                  ← adapters HTTP + mappers
├── presentation/                    ← página, cabecera, pestañas y sus componentes
└── espacio-protocolo.providers.ts   ← raíz de composición
```

`src/features/protocols/` (inglés, código anterior) no se toca, salvo el retiro de T02-R1. El nombre `espacio-protocolo` no choca con `protocolos` (F01) en la regla `noOtherFeatures` (§6).

## 2. Archivos por capa

### 2.1 `domain/`

| Acción | Archivo | Contenido | Tarea |
|---|---|---|---|
| CREAR | `espacio.model.ts` | `CabeceraProtocolo { id, ceishCode: string \| null, version: number \| null, title, investigador: string \| null, tipoEstudio: string \| null, enviadoEl: string \| null (ISO), estadoRecepcion: string \| null, etapa: Stage \| null }`; `EstadoRequisito = 'APROBADO' \| 'RECHAZADO' \| 'NO_APLICA' \| 'PRESENTADO' \| 'PENDIENTE' \| 'NO_PRESENTADO'`; `DocumentoAdjunto { id, fileName, uploadedAt: string \| null, paginasDeclaradas: number \| null }`; `RequisitoRecepcion { id, code, name, estado: EstadoRequisito \| null, observacion: string \| null, documento: DocumentoAdjunto \| null }`; `DetalleRecepcion { cabecera, requisitos, cerrada: boolean }`; `ResultadoCierre = { tipo: 'COMPLETO', ceishCode } \| { tipo: 'INCOMPLETO', faltantes: string[], plazo: string \| null }` | T02-1 |
| CREAR | `recepcion.port.ts` | `abstract class RecepcionPort { detalle(protocolId); validar(documentId, { decision: 'APROBAR' \| 'OBSERVAR', observacion?, paginasContadas? }); cerrar(protocolId): Observable<ResultadoCierre>; urlDocumento(documentId): Observable<string> }` | T02-1 |
| CREAR | `resumen.port.ts` | `abstract class ResumenProtocoloPort { obtener(id) }` y `DocumentosPort { listar(protocolId) }` | T02-6 |
| CREAR | `recepcion.rules.ts` + spec | `contadores(requisitos) → { aprobados, observados, sinRevisar, sinDocumento, total }` (spec-ui §5.1); `accionPrincipal(contadores, cerrada, puedeValidar) → { texto, habilitada, motivo } \| null` (§3.2); `paginas(declaradas, contadas) → { valida, coinciden }` (§5.2); `observacionValida(texto, min, max)` | T02-2 |
| CREAR | `pestanas.rules.ts` + spec | `pestanaDesdeUrl(segmento) → 'resumen' \| 'documentos' \| 'recepcion' \| 'recorrido'` (desconocida → `resumen`) | T02-4 |

### 2.2 `infrastructure/`

| Acción | Archivo | Contenido | Tarea |
|---|---|---|---|
| CREAR | `recepcion.mapper.ts` + spec | Estricto con `contract-readers` (`asObject`, `asArray`, `str`, `nullableStr`, `num`, `nullableNum`, `idValue`, `oneOf`). Quita los rellenos del backend: `'TRÁMITE EN PROCESO'` → `ceishCode: null`, `'No asignado'` → `investigador: null`, `'No especificado'` → `tipoEstudio: null` (spec-ui E6; se borra cuando llegue TSK-F02-3). `observations` con `nullableStr` (un objeto lanza). Estado desconocido → `null` (no lanza). `pageCount` `null`/ausente → `null` (nunca `1`) | T02-1 |
| CREAR | `recepcion-http.adapter.ts` + spec | `GET /reception/protocol/:id/validation-detail`; `POST /reception/document/:id/validate` con `{ statusId: 1 \| 3, observations?, pageCount? }` (P9); `POST /reception/protocol/:id/finalize`; `GET /reception/document/:id/download-url` + `safeHttpUrl`. Quita el envoltorio (`stripTransportEnvelope`/`unwrapData`). **Propaga** el error (sin `catchError(() => of(...))`). **No** llama a `PATCH …/verify` (spec-ui E3) | T02-1 |
| CREAR | `resumen-http.adapter.ts`, `documentos-http.adapter.ts` + specs | `GET /protocols/:id` (`toResponse`); `GET /reception/protocol/:id/documents` | T02-6 |
| CREAR | `recorrido-http.adapter.ts` + spec | `GET /audit/protocol/:id`, estricto, **sin** mock ni `integrityHash` | T02-7 (bloqueada por TSK-F02-5) |
| raíz | CREAR `espacio-protocolo.providers.ts` | `ESPACIO_PROTOCOLO_PROVIDERS = [{ provide: RecepcionPort, useClass: RecepcionHttpAdapter }, …]` | T02-1 |

Endpoints nuevos en `src/infrastructure/api/endpoints.constant.ts`: ya existen `PROTOCOLS.RECEPTION.VALIDATION_DETAIL`, `FINALIZE`, `VALIDATE_DOC`, `DOCUMENTS_HISTORY` (`endpoints.constant.ts:21-32`); se agrega `DOWNLOAD_URL` si no existe (se verifica en T02-1).

### 2.3 `application/`

| Acción | Archivo | Contenido | Tarea |
|---|---|---|---|
| CREAR | `espacio-protocolo.facade.ts` + spec | `@Injectable()` (provista en la página). Signals: `detalle: Bloque<DetalleRecepcion>` (`cargando`/`listo`/`error`), `guardando: ReadonlySet<documentId>`, `errorFila: Map<documentId, string>`, `cierre: Bloque<ResultadoCierre>`, `conflicto: boolean`. `computed`: `contadores`, `progreso`, `accion` (de `recepcion.rules`). Métodos: `cargar(id)`, `aprobar(req, paginas?)`, `observar(req, texto, paginas?)`, `cerrar()`, `reintentar()`. Cada validación es independiente (`mergeMap` por fila, sin `forkJoin`); `cargar` usa `switchMap`. Tras validar, actualiza solo esa fila con la respuesta; tras cerrar, recarga y refresca `PendingCountPort` | T02-3 |

### 2.4 `presentation/`

| Acción | Archivo | Contenido | Tarea |
|---|---|---|---|
| CREAR | `espacio-protocolo.page.{ts,html,scss}` + spec | Migas, cabecera, `Tabs` según la URL, `<router-outlet>` de las pestañas; foco al `h1`; `providers: [EspacioProtocoloFacade]` | T02-4 |
| CREAR | `components/cabecera-protocolo/*` + spec | Chips, título, línea de datos (fechas con `fechaHoraEcuador`), `StageBar`, acción principal con `disabledReason` y la confirmación (`Dialog`) | T02-4 |
| CREAR | `tabs/recepcion-tab/*` + spec | Cabecera del checklist, contadores, `progressbar`, tabla | T02-5 |
| CREAR | `components/fila-requisito/*` + spec | Una fila: requisito, documento, páginas, `Aprobar`/`Observar` (`aria-pressed`, 44 px), observación con campo obligatorio, `Guardando…`, error de fila | T02-5 |
| CREAR | `tabs/resumen-tab/*`, `tabs/documentos-tab/*` + specs | Solo lectura | T02-6 |
| CREAR | `tabs/recorrido-tab/*` + spec | Solo lectura; `Recorrido no disponible todavía.` mientras TSK-F02-5 (P10) | T02-7 |

### 2.5 Compartido que se reutiliza (Paso 0)

| Qué | Dónde | Uso en F02 |
|---|---|---|
| Lectores estrictos y `safeHttpUrl` | `src/infrastructure/mappers/contract-readers.ts` (F01 T01-2/T01-4) | Mappers |
| `fechaEcuador`, `fechaHoraEcuador` | `src/shared/utils/fecha-ecuador.util.ts` (F01 T01-1) | Fechas de la cabecera, documentos y recorrido |
| `Stage` | `src/domain/value-objects/stage.vo.ts` | Etapa de la cabecera |
| `PageHeader` (`disabledReason`), `StatusChip`, `StageBar`, `Tabs`, `Dialog`, `InlinePanel`, `LoadingState`/`ErrorState`/`EmptyState` | `src/shared/ui/` | Cabecera, chips, etapas, pestañas, confirmación, estados |
| `PendingCountPort` | `src/features/shell/domain/pending-count.port.ts` (root, F01 T01-3) | Refrescar el contador del menú tras cerrar. **No** se importa desde `shell` (regla R4): se expone un método de refresco en root o se usa un evento; se decide en T02-3 |
| `ErrorInterceptor` → `{ type: 'CONCURRENCY_ERROR', status: 409 }` | `src/infrastructure/interceptors/error.interceptor.ts` | Detectar el conflicto (§5.5 de la spec) |

## 3. Registro de providers (angular-di)

| Token | Dónde | Por qué |
|---|---|---|
| `RecepcionPort`, `ResumenProtocoloPort`, `DocumentosPort`, `RecorridoPort` | `providers` de la ruta `/protocolos/:id` (`ESPACIO_PROTOCOLO_PROVIDERS`) | Como F01: el port de la sección se registra en su ruta |
| `EspacioProtocoloFacade` | `providers` del componente de la página | Una instancia por visita; las pestañas hijas la inyectan desde el padre |
| `IProtocolRepositoryPort`, `IDocumentRepositoryPort` | root (sin cambios) | F02 no los usa: los adapters actuales tragan errores y completan datos (§5) |

Todo con `inject()`.

## 4. Rutas

En `SECRETARIA_ROUTES` (`src/app/app.routes.ts`), una entrada nueva (P2):

```text
{
  path: 'protocolos/:id',
  loadComponent: EspacioProtocoloPage,
  providers: ESPACIO_PROTOCOLO_PROVIDERS,
  canActivate: [RoleGuard, AuthGuard],
  data: { roles: ['SECRETARIA'], permissions: ['RECEPCION_LISTA'] },
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'recepcion' },   // P2
    { path: 'resumen' | 'documentos' | 'recepcion' | 'recorrido', loadComponent: … },
    { path: '**', redirectTo: 'resumen' },
  ],
}
```

- `RECEPCION_LISTA` es el permiso que pide el servicio de `validation-detail` (`reception.service.ts:70-76`). Validar y cerrar piden `RECEPCION_VALIDAR` (`reception.controller.ts:100` y `:157`): si la sesión no lo trae, los botones se deshabilitan con motivo (spec-ui §3.2); la ruta no lo exige, para que la Secretaría pueda consultar.
- `/protocolos` (F01) sigue igual: la ruta nueva es otra entrada (`protocolos/:id`), sin `pathMatch` conflictivo.
- F01: `destinoAccion('VALIDAR', id)` pasa de `['/dashboard/protocols/workspace', id, 'validation']` a `['/protocolos', id, 'recepcion']` (`src/features/pendientes/domain/accion.rules.ts`), con sus pruebas. ASIGNAR y REASIGNAR no cambian.
- `/dashboard/protocols/workspace/:id/...` y `/dashboard/protocols/validation/list` siguen funcionando hasta T02-R1.

## 5. Mapa de equivalencias (Paso 0)

| Existe hoy | Archivo:línea | Qué hace | F02 |
|---|---|---|---|
| `ProtocolValidationDetailPage` | `src/features/protocols/presentation/pages/protocol-validation-detail/protocol-validation-detail.page.ts` (1319 líneas) | Checklist con `ngModel` sobre la respuesta (`:214`, `:341`), `catchError` (`:1061`), `window.open` sin `noopener` (`:1042`), páginas `|| 1` (`:1088`, `:1122-1128`) | (b) lo reemplaza; retiro en T02-R1 |
| `LoadValidationDetailUseCase` | `src/features/protocols/application/use-cases/load-validation-detail.use-case.ts:20` | Pone `pageCount = originalPageCount \|\| 1` (el backend no envía `originalPageCount`) | (b) |
| `ValidateChecklistItemUseCase` | `…/validate-checklist-item.use-case.ts:24`, `:31` | Páginas `\|\| 1`; observación ≥ 5 caracteres solo con `actionType 2` | (b); la regla de longitud pasa a `recepcion.rules` (P8) |
| `FinalizeDocumentaryValidationUseCase` | `…/finalize-documentary-validation.use-case.ts:17-18` | `PATCH verify` (el cliente decide `isComplete`) y luego `POST finalize` | (b); F02 solo `finalize` (E3) |
| `ProtocolApiAdapter.getValidationDetail`, `verifyProtocol`, `finalizeReception` | `src/infrastructure/adapters/protocol-api.adapter.ts:262-312` | Sin mapper estricto (`res.data \|\| res`) | (b) adapter propio |
| `DocumentApiAdapter.validateDocument` | `src/infrastructure/adapters/document-api.adapter.ts:19-33` | `POST …/validate` con `{ statusId, observations, pageCount }` | (b) |
| `ProtocolWorkspaceComponent` | `src/features/protocols/presentation/pages/protocol-workspace/protocol-workspace.component.ts` (751 líneas) | Pestañas por rol (`:564-611`), acciones `Aprobar Todo` (`:555-557`) y `Asignar Pares` (`:558-560`) | Se mantiene para los demás roles; ASIGNAR de F01 sigue yendo allí (D1 de F01) |
| `AuditRepositoryAdapter.getProtocolTrail` | `src/features/audit/infrastructure/adapters/audit-repository.adapter.ts:143-167` | **Mock** si la respuesta viene vacía (`:148`) o falla (`:164`); `integrityHash` inventado (`:160`, `:198-217`) | (b) adapter nuevo sin mock; el actual se anota como deuda |
| `ProtocolValidationListPage` | `src/features/protocols/routes.ts:67-76` | Bandeja de validación; permisos `RECEPCION_VALIDAR`, `DOCUMENTOS_VALIDAR`, `RECEPCION_VER` (`:73`, los dos últimos no existen en el backend) | Se mantiene hasta T02-R1 |
| `contract-readers`, `fecha-ecuador.util`, `Stage`, `shared/ui`, `PendingCountPort` | §2.5 | — | (c) se reutilizan |

Clasificación del README §6.2: (a) no había nada, (b) lo nuevo lo reemplaza (con su tarea de retiro), (c) se reutiliza.

## 6. Regla de capas en eslint

En `eslint.config.js`, una línea más junto a las de F01 (T01-8):

```js
...f01Layers("espacio-protocolo"),
```

`f01Layers(f)` ya da: `presentation`/`application` sin `@angular/common/http` ni `infrastructure`; `domain` sin `@angular`, `infrastructure`, `application` ni `presentation`; y `noOtherFeatures(f)` en todas las capas. Si el nombre del helper confunde (ya no es solo de F01), se renombra a `seccionLayers` en la misma tarea, sin cambiar su comportamiento. Prueba: archivos temporales con imports prohibidos, como en T01-8.

## 7. Seguridad (angular-security)

- Sin `innerHTML`, `outerHTML`, `DomSanitizer` ni `bypassSecurityTrust*`.
- Observación como texto (`nullableStr`); recortada y limitada antes de enviar.
- `downloadUrl` por `safeHttpUrl`; apertura con `noopener,noreferrer`.
- Los huecos de permisos del backend (§8) no se tapan en el frontend: se reportan como TSK.

## 8. Lo que necesita el backend (detalle en `tasks.md`, lista TSK)

| TSK | Hueco | Evidencia | Bloquea |
|---|---|---|---|
| TSK-F02-1 | Páginas **contadas** guardadas aparte de las **declaradas**, y las dos en `validation-detail` | `validate` sobrescribe `pageCount` del documento y del requisito (`reception.service.ts:732-755`) | E7, columna de páginas |
| TSK-F02-2 | Observación obligatoria (y longitud) cuando `statusId ≠ 1` | `observations || ''` (`reception.service.ts:752`); DTO sin `IsNotEmpty` (`validate-document.dto.ts`) | No bloquea (el frontend la exige) |
| TSK-F02-3 | `validation-detail` sin rellenos (`null` en vez de `'TRÁMITE EN PROCESO'`, `'No asignado'`, `'No especificado'`, `version \|\| 1`), con `etapa`, `etapaOrden` y un `estadoActual` legible | `reception.service.ts:155-165`; `GET /protocols/:id` sin `etapa` (`protocol.mapper.ts:45-58`) | Mapper sin la tabla de rellenos; chip de estado y `StageBar` |
| TSK-F02-4 | Asociar documento ↔ requisito solo por `requirementId` (sin coincidencia por nombre ni "primer documento libre") | `reception.service.ts:96-136` | Riesgo de mostrar el documento equivocado |
| TSK-F02-5 | `GET /audit/protocol/:id` con `@Permissions` y filtrado por tabla (hoy filtra solo `recordId`, mezcla registros de otras tablas con el mismo id) | `audit.controller.ts:19-26`; `audit.service.ts:84-87` | Pestaña Recorrido |
| TSK-F02-6 | Concurrencia en `validate` y `finalize` (por ejemplo `versionLock` en el cuerpo o `If-Match`, 409 si cambió) | Sin control (`reception.service.ts:711-771`); `@VersionColumn` en `protocol.entity.orm.ts:30-31` | Estado "conflicto" |
| TSK-F02-7 | Año del código CEISH en hora de Ecuador | `now.getFullYear()` (`reception.service.ts:281` y `:667`) | No bloquea la UI |
| TSK-F02-8 | `@Permissions` en `GET /reception/document/:id/view` y `download-url` (y comprobar que el documento es del protocolo que el usuario puede ver) | `reception.controller.ts:185-251`; `permissions.guard.ts:32-39` | No bloquea; riesgo de acceso por id |
| TSK-F02-9 | `@Permissions` en `GET /protocols/:id` | `protocol.controller.ts:43-44`, `:215-232` | No bloquea |
| TSK-F02-10 | Exponer el plazo de subsanación antes de cerrar (para la confirmación, P5) | `finalize` lo calcula al cerrar (`reception.service.ts:343-346`) | No bloquea |

## 9. Pruebas

Como F01 (`specs/F01-pendientes-protocolos/plan.md` §9): Jasmine + Karma, `npx ng test --watch=false --browsers=ChromeHeadless`.

| Capa | Cómo |
|---|---|
| domain (`recepcion.rules`, `pestanas.rules`) | Unitarias puras |
| mappers | Contrato completo, cada campo con otro tipo (lanza), estado desconocido (`null`), rellenos del backend → `null`, `observations` objeto → lanza, `pageCount` null → `null` |
| adapters | `HttpTestingController`: URL, cuerpo (`statusId 1/3`, `observations`, `pageCount`), envoltorio, el error llega al suscriptor, `verify` nunca se llama |
| fachada | Ports sustituidos: estados, validar una fila no toca las otras, error de fila conserva el estado, cierre recarga, 409 → `conflicto` |
| componentes | `setInput`: textos, `aria-pressed`, `aria-label`, 44 px (clase con `--min-h-action`), observación obligatoria, aviso de páginas con texto, fila observada con borde y chip |
| página | `Router` real: pestaña desde la URL, migas, foco al `h1` |
| rutas | `app.routes.spec.ts`: SECRETARIA con `RECEPCION_LISTA` entra; sin él no; INVESTIGADOR vuelve con aviso; `/protocolos` de F01 sin cambios; VALIDAR de Mis pendientes → `/protocolos/:id/recepcion` |

Cada subscribe de las pruebas maneja el error. Mutaciones mínimas por tarea en `tasks.md`.

**Verificación de cada tarea (dos veces):** `npx tsc -p tsconfig.app.json --noEmit`, `npx eslint <archivos cambiados>` (sin `--fix`; total ≤ 75 avisos), `npx ng test --watch=false --browsers=ChromeHeadless`, `npx ng build --configuration production`; prueba de humo contra el backend local desde T02-4.

## 10. Duplicados temporales

| Duplicado | Por qué existe | Retiro |
|---|---|---|
| Recepción de F02 y `ProtocolValidationDetailPage` | El espacio antiguo lo siguen usando otros roles y la bandeja actual | T02-R1 |
| `RecorridoHttpAdapter` y `AuditRepositoryAdapter.getProtocolTrail` (con mock) | La pantalla de auditoría actual usa el adapter con mock | T02-R2 (quitar el mock del adapter actual) |
