# F01 · Mis pendientes y Protocolos — plan

**Estilo:** capas + Clean Architecture (ADR-001) · **Angular 20:** componentes standalone, signals, `ChangeDetectionStrategy.OnPush`, `inject()`
**Estado:** borrador 05/11/2026. Rutas y líneas verificadas con lectura del código en `docs/f01-pendientes-protocolos` (base: `dev`, 0 commits por delante).
**Línea base (Paso 0, 05/11/2026):** `npx tsc -p tsconfig.app.json --noEmit` exit 0 · `npx eslint "src/**/*.ts"` 0 errores y 75 avisos · `npx ng test --watch=false --browsers=ChromeHeadless` `TOTAL: 699 SUCCESS` · build de producción NO EJECUTADO en el Paso 0.

---

## 1. Estructura

Dos secciones nuevas, con los nombres de sus rutas:

```text
src/features/pendientes/          ← Mis pendientes (/pendientes)
├── domain/                       ← modelo, port, reglas de plazo
├── application/                  ← fachada con signals
├── infrastructure/               ← adapter HTTP + mapper
├── presentation/                 ← página y componentes
└── pendientes.providers.ts       ← registro del port (raíz de composición)

src/features/protocolos/          ← Protocolos (/protocolos)
├── domain/ application/ infrastructure/ presentation/
└── protocolos.providers.ts
```

`src/features/protocols/` (inglés) es el código anterior y no se toca en F01, salvo lo que diga §4. La convivencia de los dos nombres se resuelve cuando se retire el código anterior (§10).

## 2. Archivos por capa

### 2.1 Compartido (`shared`, `infrastructure`, `domain` global)

| Acción | Archivo | Contenido | Tarea |
|---|---|---|---|
| CREAR | `src/shared/utils/fecha-ecuador.util.ts` + spec | `fechaCalendario('YYYY-MM-DD')` → `dd/MM/yyyy` partiendo el texto (sin `new Date()`); `fechaEcuador(iso)` → `dd/MM/yyyy`; `fechaHoraEcuador(iso)` → `dd/MM/yyyy, HH:mm`. Las dos últimas usan `Intl.DateTimeFormat` con `timeZone: 'America/Guayaquil'` y `formatToParts` (formato exacto, sin depender del locale). Entrada inválida → `null` | T01-1 |
| CREAR | `src/infrastructure/mappers/contract-readers.ts` + spec | Lectores estrictos genéricos: `asObject`, `asArray`, `str`, `nullableStr`, `num`, `nullableNum`, `bool`, `idValue` (string o number, como `meeting.mapper.ts:194-201`), `oneOf(valores)`, `safeHttpUrl(valor)` (`new URL` en `try`, solo `http:`/`https:`; si no, `null`). Lanzan `ContractError(path, expected)` | T01-2 (`safeHttpUrl` en T01-4) |
| CREAR | `src/shared/ui/pager/pager.component.{ts,html,scss}` + spec | Paginador: `Mostrando a–b de N` (`aria-live="polite"`), `Anterior`/`Siguiente` de `--min-h-action` (44 px), deshabilitados en los extremos. Entradas: `page`, `limit`, `total`; salida: `pageChange` | T01-7 |
| MODIFICAR | `src/domain/entities/meeting.entity.ts` | `NextMeeting { id, numeroConvocatoria, tipoSesion: MeetingSessionType, fechaReunion, lugar: NextMeetingPlace \| null, protocolosATratar }` y `NextMeetingPlace { nombre, esVirtual, enlaceReunion: string \| null }`. **No** incluye `informesATratar` (siempre null, no se muestra) | T01-4 |
| MODIFICAR | `src/domain/ports/IMeetingRepositoryPort.ts` | `abstract next(): Observable<NextMeeting \| null>` | T01-4 |
| MODIFICAR | `src/infrastructure/mappers/meeting.mapper.ts` | `MeetingMapper.toNextMeeting(value, path)` con sus lectores actuales (`meeting.mapper.ts:152-215`) y `safeHttpUrl` para `enlaceReunion` | T01-4 |
| MODIFICAR | `src/infrastructure/adapters/meeting-api.adapter.ts` | `next()`: `GET ENDPOINTS.MEETINGS.NEXT`, `stripTransportEnvelope` (`:99-107`), `data: null` → `null`, errores con `toMeetingError` (`:113-115`) | T01-4 |
| MODIFICAR | `src/infrastructure/api/endpoints.constant.ts` | `MEETINGS.NEXT: '/evaluations/meetings/next'` (T01-4); comentario de `SECRETARIA.PENDIENTES` (`:81`): ya existe (spec-003 v1.5.2, RF-ALR.f.5) (T01-3); `PROTOCOLS.BASE` ya existe (`:14`) | T01-3, T01-4 |
| MODIFICAR | `src/index.html` | `lang="es"` (hoy `lang="en"`, `:2`) | T01-8 |
| MODIFICAR | `eslint.config.js` | Bloques `layers` para `pendientes` y `protocolos` (§6) | T01-8 |

### 2.2 `src/features/pendientes/`

| Capa | Acción | Archivo | Contenido | Tarea |
|---|---|---|---|---|
| domain | CREAR | `domain/pendiente.model.ts` | `FiltroPendientes = 'todos'\|'vencidos'\|'hoy'\|'semana'`; `EstadoPlazo`; `AccionPendiente = 'VALIDAR'\|'ASIGNAR'\|'REASIGNAR'`; `PendienteItem { protocolId, ceishCode: string \| null, title, estadoActual, etapa: Stage \| null, fechaPlazo: string \| null, estadoPlazo, accion: AccionPendiente \| null, accionTexto }`; `PendientesResumen { fechaReferencia, totales, items }` | T01-2 |
| domain | CREAR | `domain/pendientes.port.ts` | `abstract class PendientesPort { abstract obtener(filtro: FiltroPendientes): Observable<PendientesResumen> }` | T01-2 |
| domain | CREAR | `domain/plazo.rules.ts` + spec | `plazoChip(estadoPlazo, fechaFormateada \| null) → { tone: StatusTone, texto }` según spec-ui §5.2 (función pura; recibe la fecha ya formateada) | T01-5 |
| domain | CREAR | `domain/accion.rules.ts` + spec | `destinoAccion(accion, protocolId) → string[] \| null` (spec-ui §3.1.1); `null` si la acción es desconocida | T01-5 |
| infrastructure | CREAR | `infrastructure/pendientes.mapper.ts` + spec | Mapper estricto con `contract-readers`. `etapa` desconocida → `null` (no lanza); `accion` desconocida → `null`; `estadoPlazo` y `fechaReferencia` se validan (`oneOf`, `YYYY-MM-DD`) | T01-2 |
| infrastructure | CREAR | `infrastructure/pendientes-http.adapter.ts` + spec | `GET ENDPOINTS.SECRETARIA.PENDIENTES` con `{ filtro }`; quita el envoltorio; **propaga** el error (sin `catchError(() => of(...))`) | T01-2 |
| raíz | CREAR | `pendientes.providers.ts` | `PENDIENTES_PROVIDERS = [{ provide: PendientesPort, useClass: PendientesHttpAdapter }]` | T01-2 |
| application | CREAR | `application/mis-pendientes.facade.ts` + spec | `@Injectable()` (se provee en la página). Signals: `filtro`, `pendientes` (`{ estado: 'cargando'\|'listo'\|'error', datos, mensaje }`), `reunion` (mismo patrón, con `datos: NextMeeting \| null`). Métodos: `iniciar()`, `cambiarFiltro(f)`, `reintentarPendientes()`, `reintentarReunion()`. Cada bloque se carga por separado (`switchMap` para que un filtro nuevo cancele el anterior) | T01-5 |
| presentation | CREAR | `presentation/mis-pendientes.page.{ts,html,scss}` + spec | Encabezado (spec-ui §3.1, zona 2), tarjeta, filtros (`ButtonGroup`), tabla; foco al `h1` | T01-5 |
| presentation | CREAR | `presentation/components/proxima-reunion-card/*` + spec | Tarjeta con sus tres estados (spec-ui §3.1, zona 3, y §5.5) | T01-5 |
| presentation | CREAR | `presentation/components/pendientes-table/*` + spec | Tabla con `StatusChip` de plazo, chip de etapa, botón con borde y `aria-label`; vacíos por filtro | T01-5 |

### 2.3 `src/features/protocolos/`

| Capa | Acción | Archivo | Contenido | Tarea |
|---|---|---|---|---|
| domain | CREAR | `domain/protocol-list-item.model.ts` | `ProtocolListItem { id: number \| string, ceishCode: string \| null, title, etapa: Stage \| null, principalInvestigator: { id, fullName } \| null }`; `ProtocolListQuery { search?, year?, etapa?: StageCode, page, limit }`; `ProtocolListResult { items, total, page, limit, totalPages }` | T01-6 |
| domain | CREAR | `domain/protocolos-list.port.ts` | `abstract class ProtocolosListPort { abstract listar(q: ProtocolListQuery): Observable<ProtocolListResult> }` | T01-6 |
| domain | CREAR | `domain/protocol-list-query.rules.ts` + spec | `queryDesdeUrl(params)`: valida `etapa` contra `Stage.all()`, `year` entero 2000–2100, `page` entero ≥ 1, `search` recortado ≤ 100; descarta lo inválido; `limit` fijo en 20 | T01-6 |
| infrastructure | CREAR | `infrastructure/protocol-list.mapper.ts` + spec | Mapper estricto; `ceishCode` nullable; `principalInvestigator` null u objeto con `fullName` string; `etapa` desconocida → `null`. Lee solo los campos que usa (los demás campos existentes se ignoran) | T01-6 |
| infrastructure | CREAR | `infrastructure/protocolos-http.adapter.ts` + spec | `GET ENDPOINTS.PROTOCOLS.BASE` con `search`, `year`, `etapa`, `page`, `limit` (omite los vacíos); **propaga** el error | T01-6 |
| raíz | CREAR | `protocolos.providers.ts` | `PROTOCOLOS_PROVIDERS = [{ provide: ProtocolosListPort, useClass: ProtocolosHttpAdapter }]` | T01-6 |
| application | CREAR | `application/protocolos.facade.ts` + spec | `@Injectable()`. Recibe el `ProtocolListQuery`; signal de estado (`cargando`/`listo`/`error`); `switchMap` cancela la petición anterior | T01-7 |
| presentation | CREAR | `presentation/protocolos.page.{ts,html,scss}` + spec | Lee y escribe la URL (`ActivatedRoute.queryParamMap`, `Router.navigate` con `queryParamsHandling: 'merge'`); `ButtonGroup` de etapas; `FilterBar` (`viewKey 'protocolos'`) con año; debounce de 300 ms; `Pager` | T01-7 |
| presentation | CREAR | `presentation/components/protocolos-table/*` + spec | Columnas Protocolo, Investigador principal y Etapa; sin "›"; vacío con `Limpiar filtros` | T01-7 |

### 2.4 Contador del menú (`src/features/shell/`)

| Acción | Archivo | Cambio | Tarea |
|---|---|---|---|
| MODIFICAR | `infrastructure/pending-count-http.adapter.ts` | `countRows` (`:21-25`, espera un arreglo) se reemplaza: lee `data.totales.todos` (número finito ≥ 0, con o sin envoltorio de transporte); si no, error. Llama con `filtro=todos` | T01-3 |
| CREAR | `infrastructure/pending-count-http.adapter.spec.ts` | Con `HttpTestingController` | T01-3 |
| BORRAR | `infrastructure/pending-count-mock.adapter.ts` + `.spec.ts` (2 pruebas) | Mock retirado: ya existe el endpoint | T01-3 |
| MODIFICAR | `src/app/app.config.ts` | `{ provide: PendingCountPort, useClass: PendingCountHttpAdapter }` en root (junto a `:73-76`) | T01-3 |
| MODIFICAR | `src/app/app.config.shell.spec.ts` | Las pruebas de `:13` ("sin mock, emite null") y `:34` ("ningún registro provee PendingCountPort") se invierten: `appConfig` provee `PendingCountPort` con `PendingCountHttpAdapter` | T01-3 |

`shell` no puede importar `features/pendientes` (regla R4, `eslint.config.js:24-27` y `:60-64`): el adapter del contador lee el número por su cuenta. Es una lectura de un solo campo, no un mapper duplicado.

## 3. Registro de providers (angular-di)

| Token | Dónde | Por qué |
|---|---|---|
| `PendientesPort` | `providers` de la ruta `/pendientes` (`PENDIENTES_PROVIDERS`) | Decisión de F01 y README §2.2.6: el port de la sección se registra en su ruta |
| `ProtocolosListPort` | `providers` de la ruta `/protocolos` (`PROTOCOLOS_PROVIDERS`) | Igual |
| `IMeetingRepositoryPort` | root (`app.config.ts:72`, sin cambios) | No es un port nuevo: F01 le agrega `next()` (§3.1) |
| `PendingCountPort` | root (`app.config.ts`) | Lo usa el AppShell, fuera de la ruta `/pendientes`; `GetPendingCountUseCase` es `providedIn: 'root'` y solo ve el inyector raíz (`get-pending-count.use-case.ts:6-8`) |
| `MisPendientesFacade`, `ProtocolosFacade` | `providers` del componente de la página | Una instancia por visita, como `SecretariatDashboardService` en `dashboard-secretaria.page.ts:23` |

Todo con `inject()`; sin inyección por constructor en código nuevo.

### 3.1 Próxima reunión: `next()` en `IMeetingRepositoryPort` (y no un port propio)

- El repo usa **un port por recurso del backend**: `IMeetingRepositoryPort` cubre `/evaluations/meetings` (`endpoints.constant.ts:72-79`), y `GET /meetings/next` es del mismo `MeetingsController` (RF-ALR.f.7).
- `MeetingApiAdapter` ya es estricto y es el patrón a seguir: quita el envoltorio (`meeting-api.adapter.ts:99-107`), normaliza errores (`:113-121`) y usa los lectores de `meeting.mapper.ts:152-215`. Un port propio duplicaría todo eso.
- El tipo del lugar es propio (`NextMeetingPlace`, claves en español del contrato B) porque `MeetingPlace` usa `name`, `isVirtual` y `meetingLink` (`meeting.entity.ts:11-17`).
- Consecuencia: el port queda en root y no en la ruta. Los dobles de prueba con `jasmine.createSpyObj` (por ejemplo `calls-management.page.spec.ts:73`) no cambian, porque solo listan los métodos que usan.

### 3.2 Protocolos: port nuevo (y no un método en `IProtocolRepositoryPort`)

- `ProtocolApiAdapter` traga los errores (`getAll`, `protocol-api.adapter.ts:142-150`; `getProtocolsByStatusId`, `:474-484`) y tolera formas viejas del contrato (`RawProtocolData`, `:69-112`). Un método nuevo allí convive con ese estilo y queda en root.
- Un port de la sección (`ProtocolosListPort`) con su adapter estricto propaga el error, se registra en la ruta y deja `getAll()` intacto.

## 4. Rutas

### 4.1 T01-0: bandeja "Estratificación de Riesgo" (antes de reemplazar `/pendientes`)

Hoy la bandeja vive en `DashboardSecretariaPage`, pestaña `PEERS`, que se abre con `?tab=peers` (`dashboard-secretaria.page.ts:172-176`). El único enlace que la usa es `AssignmentPage` (`assignment.page.ts:29`), que navega a `/dashboard/home?tab=peers` y llega a `/pendientes?tab=peers` (D11, `dashboard/routes.ts:112`).

- CREAR `src/features/dashboard/presentation/utils/pending-peer-protocol.util.ts` + spec: la conversión de `dashboard-secretaria.page.ts:120-169` (respuesta del endpoint → `PendingPeerAssignmentProtocol[]`) como función pura. Se extrae para no duplicarla.
- MODIFICAR `dashboard-secretaria.page.ts`: el `computed` usa la función extraída. Mismo comportamiento; `DashboardSecretariaPage` se sigue usando en `dashboard-home.page.ts:12,49` y no se borra.
- CREAR `src/features/dashboard/presentation/pages/peer-risk-pending/peer-risk-pending.page.{ts,html,scss}` + spec: `PageHeader` "Estratificación de Riesgo", `LoadPendingPeerAssignmentProtocolsUseCase` (`load-pending-peer-assignment-protocols.use-case.ts:7-12`), la función extraída, `PeerRiskPendingTableComponent` (`peer-risk-pending-table.component.ts:244-245`; al emitir `assignmentCompleted` se recarga) y `LoadingState`/`ErrorState`/`EmptyState`.
- MODIFICAR `src/app/app.routes.ts`, `SECRETARIA_ROUTES`: nueva entrada `estratificacion-riesgo` (lazy), `canActivate: [RoleGuard, AuthGuard]`, `data: { roles: ['SECRETARIA'], permissions: ['EVALUATORS_ASSIGN', 'EVALUATORS_SUGGEST', 'EVALUACION_ASIGNAR'], permissionStrategy: 'any' }` (los permisos de `evaluations/routes.ts:18-21`). Queda bajo el AppShell y en el respaldo sin layout, como las demás. **No** entra al menú.
- MODIFICAR `src/features/evaluations/presentation/pages/assignment/assignment.page.ts:29`: `navigate(['/estratificacion-riesgo'])`.

### 4.2 `/pendientes` y `/protocolos` (T01-5 y T01-7)

En `SECRETARIA_ROUTES` (`app.routes.ts:12-35`):

| Ruta | Cambia | No cambia |
|---|---|---|
| `pendientes` (`:14-21`) | `loadComponent` → `MisPendientesPage`; se agrega `providers: PENDIENTES_PROVIDERS` | `path`, `canActivate: [RoleGuard, AuthGuard]`, `data: { roles: ['SECRETARIA'] }` |
| `protocolos` (`:22-35`) | `loadComponent` → `ProtocolosPage`; se agrega `providers: PROTOCOLOS_PROVIDERS`; se borra el comentario "Temporal hasta F01" | `path`, `canActivate`, `data` (roles y permisos actuales) |

- `providers` es la única clave nueva, por la decisión de §3. Una prueba compara `path`, `canActivate` y `data` antes y después.
- Como `SECRETARIA_ROUTES` se usa en el padre del AppShell (`app.routes.ts:99`) y en el respaldo sin layout (`:112`), el criterio 4 de F00 sigue igual.
- `ROLE_HOME` (`role-home.ts:8-13`) y `redirectKeepingQuery` (`role-home.guard.ts:42-44`) no cambian.
- `ProtocolValidationListPage` sigue en `/dashboard/protocols/validation/list` (`protocols/routes.ts:67-76`).

### 4.3 Destinos de las acciones (verificados)

| `accion` | Ruta | Evidencia |
|---|---|---|
| `VALIDAR` | `['/dashboard/protocols/workspace', protocolId, 'validation']` | `protocols/routes.ts:23-36`; mismo enlace en `protocol-validation-list.page.ts:151` y `protocol-workspace.component.ts:626` |
| `ASIGNAR` | `['/dashboard/evaluations/assignment']` → `/estratificacion-riesgo` (tras T01-0) | `evaluations/routes.ts:15-22`; `assignment.page.ts:29`. No abre el protocolo (Duda D1) |
| `REASIGNAR` | `['/dashboard/evaluations/reassignment', protocolId]` | `evaluations/routes.ts:24-31`; `reassignment.page.ts:83` lee `protocolId` (o `id`) |

Las tres existen, así que se muestran los tres botones. `/dashboard/...` se carga dentro del AppShell de la Secretaría (`dashboard/routes.ts:51-57` y `:111-115`; `app.routes.ts:100-104`).

## 5. Mapa de equivalencias (búsqueda del Paso 0)

Clasificación del README §6.2: (a) no había nada, (b) lo nuevo lo reemplaza (con su tarea de retiro), (c) se reutiliza.

| Pieza nueva | Búsqueda | Resultado | Clase |
|---|---|---|---|
| `ProtocolListItem`, `NextMeeting`, `PendienteItem` | `grep -rn "ProtocolListItem\|NextMeeting\|PendingItem" src` | Sin coincidencias | (a) |
| Port y adapter de pendientes | `grep -rn "pendientes\|/secretaria/" src` | Solo `PendingCountHttpAdapter` (cuenta filas) y `ENDPOINTS.SECRETARIA.PENDIENTES` | (a); el contador se ajusta (§2.4) |
| Próxima reunión | `grep -rn "meetings/next" src` | Sin coincidencias. `IMeetingRepositoryPort` existe | (c) se amplía el port |
| Listado de protocolos | `ProtocolApiAdapter.getAll` (`:142-150`); `ProtocolListPage` en `/dashboard/protocols/list` (`protocols/routes.ts:17-21`); `SecretariatDashboardService` (filtra en el cliente, `secretariat-dashboard.service.ts:33-47`) | Sin paginación ni etapa; tragan errores | (b) `ProtocolListPage` (retiro T01-R3); `getAll` no se toca |
| Fechas en Ecuador | `grep -rn "Guayaquil\|timeZone" src` sin coincidencias; `DateService.formatDate` (es-EC, sin zona, `date.service.ts:10-27`); `date-format.pipe.ts` (0 bytes) | Ninguna fija la zona | (b) `DateService` (retiro T01-R2) |
| Lectores estrictos | `meeting.mapper.ts:152-215` (privados, lanzan `MeetingContractError`) | No exportados | (b) unificar en T01-R1 |
| Tabla | `DataTable` (`data-table.component.ts:9-15`): `value` solo devuelve texto | No admite celdas de dos líneas, chips de etapa junto al texto ni botones | (c) estados y `StatusChip`; las tablas de F01 son propias (§10) |
| Paginador | `MatPaginator` en `audit-logs.page.ts` y `workflow-table.component.ts`; `pagination.model.ts` (0 bytes) | Sin paginador en `shared/ui` | (a) `Pager` nuevo en `shared/ui` |
| Filtros, botones, estados, encabezado | `shared/ui/{filter-bar,button-group,states,page-header,status-chip}` | Existen | (c) |
| Etapa | `stage.vo.ts:1-41` | Existe | (c) |
| Bandeja de pares | `DashboardSecretariaPage` pestaña PEERS | Existe | (c) se mueve a una ruta propia (T01-0) |

## 6. Regla de capas en eslint (T01-8)

En `eslint.config.js`, junto a los bloques R1–R4 (`:57-85`), con la misma forma `layers(files, patterns)`:

```js
const noOtherFeatures = (name) => ({
  regex: `(^@features/(?!${name}(/|$)))|(^|/)features/(?!${name}(/|$))`,
  message: `Capas: ${name} no importa otras secciones.`,
});
// F01: pendientes y protocolos (una línea por feature)
layers([`src/features/${f}/presentation/**/*.ts`, `src/features/${f}/application/**/*.ts`], [NO_HTTP, NO_INFRASTRUCTURE, noOtherFeatures(f)]),
layers([`src/features/${f}/domain/**/*.ts`], [NO_ANGULAR, NO_INFRASTRUCTURE, noOtherFeatures(f)]),
layers([`src/features/${f}/infrastructure/**/*.ts`, `src/features/${f}/*.ts`], [noOtherFeatures(f)]),
// utilidad compartida
layers(["src/shared/utils/fecha-ecuador.util.ts"], [NO_ANGULAR, NO_HTTP, NO_INFRASTRUCTURE, NO_FEATURES]),
```

- `src/shared/ui/pager/**` ya cae en R1 (`eslint.config.js:58`).
- Los ports de `domain` usan `Observable` de `rxjs` (no es `@angular`), como `pending-count.port.ts:1-6`.
- "Hecho cuando" incluye una mutación: un `import { HttpClient }` en una página de F01 debe dar error.

## 7. Seguridad (angular-security)

- Sin `innerHTML`, `outerHTML`, `DomSanitizer` ni `bypassSecurityTrust*` en F01. Hoy el único `[innerHTML]` del repo es `ai-assistant.component.html:70` (escapa antes, `ai-assistant.component.ts:222-249`); no se copia.
- Mappers estrictos con `contract-readers`: un texto que no es string lanza `ContractError` y el bloque muestra `ErrorState`. Nunca `[object Object]`.
- `enlaceReunion`: `safeHttpUrl` en el mapper; en la plantilla `[href]` + `target="_blank"` + `rel="noopener noreferrer"`.
- Parámetros de la URL validados en `protocol-list-query.rules.ts` antes de enviarlos.

## 8. Lo que no cambia y deuda anotada

- `DashboardSecretariaPage` sigue viva para `DashboardHomePage` (`dashboard-home.page.ts:12,49,52`). Su retiro es de T14 de F00 ("la rama SECRETARIA de DashboardHomePage, cuando /pendientes tenga su pantalla de F01", `specs/F00-base/tasks.md:26`).
- `getAll()` de `ProtocolApiAdapter` no se toca.
- Deuda sin tarea en F01: 18 `window.open(...downloadUrl, '_blank')` sin validar ni `noopener`; `BaseApiService.handleError` (`base-api.service.ts:41-53`); `ErrorInterceptor` pierde el código de estado (`error.interceptor.ts:153-155`); colores ESPOCH de `_variables.scss:3-6` sin unificar con los tokens.
- Un 403 de `GET /secretaria/pendientes` hace que el interceptor navegue a `RoleHome` (`error.interceptor.ts:123-126`), que para SECRETARIA es la misma `/pendientes`. Se espera que el router ignore la navegación a la misma URL; lo cubre una prueba de T01-5.

## 9. Pruebas

Jasmine + Karma: `npx ng test --watch=false --browsers=ChromeHeadless` (y `--include=<spec>` para las mutaciones).

| Capa | Cómo |
|---|---|
| domain (`plazo.rules`, `accion.rules`, `protocol-list-query.rules`), `fecha-ecuador.util`, `contract-readers` | Unitarias puras, sin TestBed. Fechas con ISO fijos (resultado igual en cualquier zona del navegador) |
| mappers | Unitarias puras: contrato completo, cada campo con otro tipo (debe lanzar), `etapa`/`accion` desconocidas (no lanzan), `enlaceReunion` `https:`, `http:`, `javascript:`, `data:`, texto no URL |
| adapters | `TestBed` + `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`: URL y parámetros, quitar envoltorio, el error llega al suscriptor |
| facades | `TestBed` con los ports sustituidos (`{ provide: PendientesPort, useValue: { obtener: jasmine.createSpy() } }`, `IMeetingRepositoryPort` igual): estados por bloque, error de un bloque sin afectar al otro, reintentar, cambio de filtro |
| componentes | `TestBed.createComponent` + `fixture.componentRef.setInput(...)` (como `data-table.component.spec.ts:29-40`): textos, tonos, `aria-pressed`, `aria-label`, `href`/`target`/`rel`, estados |
| páginas | `TestBed` con la fachada o los ports sustituidos; `Router` real con `provideRouter([])` para comprobar la URL (etapa, page, búsqueda con `fakeAsync` + `tick(300)`) |
| rutas | `app.routes.spec.ts` y `role-home.routes.spec.ts` (usan `appConfig.providers` + `provideHttpClientTesting()`, `app.routes.spec.ts:57-59`): criterio 4, `ROLE_HOME`, `?tab=peers` → `/pendientes?tab=peers`, `/estratificacion-riesgo`, y que `path`/`canActivate`/`data` de `pendientes` y `protocolos` no cambiaron |

Los providers de ruta (`PENDIENTES_PROVIDERS`) tienen prioridad sobre los de `TestBed`: en las pruebas de rutas, las peticiones van a `HttpTestingController`; en las de la página, se sustituye la fachada con `TestBed.overrideComponent`.

**Mutaciones** (README §6.4): por cada regla nueva se rompe el código y una prueba debe fallar; se revierte editando y se comprueba `git diff --stat`. Las mutaciones mínimas de cada tarea están en `tasks.md`.

**Verificación de cada tarea (dos veces):** `npx tsc -p tsconfig.app.json --noEmit`, `npx eslint <archivos cambiados>` (sin `--fix`; ningún archivo empeora y el total no pasa de 75 avisos), `npx ng test --watch=false --browsers=ChromeHeadless`, `npx ng build --configuration production`. Desde T01-5: prueba de humo en el navegador contra el backend local.

## 10. Duplicados temporales

| Duplicado | Por qué existe | Retiro |
|---|---|---|
| `contract-readers.ts` y los lectores privados de `meeting.mapper.ts:152-215` | F01 necesita lectores estrictos fuera de reuniones; los de reuniones lanzan `MeetingContractError` | T01-R1 |
| `fecha-ecuador.util.ts` y `DateService.formatDate` (`date.service.ts:10-27`, sin zona horaria) | `DateService` lo usan pantallas que no son de F01 | T01-R2 |
| `ProtocolosPage` (`/protocolos`) y `ProtocolListPage` (`/dashboard/protocols/list`) | `ProtocolListPage` sigue en el menú antiguo (`menu-ui.config.ts:63-107`) | T01-R3 (con T14 de F00) |
| Tablas propias de F01 y `DataTable` | `DataTable` solo admite celdas de texto | Cuando `DataTable` admita plantillas por columna (sección posterior); se anota en T01-R1 como revisión |
| Mis pendientes y la pestaña "Trámites Activos" de `DashboardSecretariaPage` | `DashboardHomePage` la sigue usando | T14 de F00 (`specs/F00-base/tasks.md:26`) |

## 11. Pantallas actuales a verificar en cada PR

Con SECRETARIA, después de cada tarea que toque rutas (T01-0, T01-5, T01-7):

1. Login → `/pendientes` dentro del AppShell, con el contador del menú.
2. `/dashboard/evaluations/assignment` → `/estratificacion-riesgo`: bandeja, asignar pares y recarga.
3. `/dashboard/protocols/workspace/:id/validation` (Validar) y `/dashboard/protocols/validation/list`.
4. `/dashboard/evaluations/reassignment/:protocolId` (Reasignar).
5. `/convocatorias`, `/reportes`, `/configuracion/usuarios`.
6. Cambio de rol con el selector (SECRETARIA ↔ otro rol) y vuelta a `/pendientes`.
7. Con INVESTIGADOR: `/pendientes`, `/protocolos` y `/estratificacion-riesgo` → su inicio con aviso.
