# F03 · Asignación de evaluadores por la Presidenta — tareas

**Rama:** `feat/asignacion-presidenta` (desde `dev` con EP1b, `444c49f`). Se fusiona junto con TSK-002-N52 del backend.
**Línea base (19/11/2026, `444c49f`):** `tsc` app y spec exit 0; `npx ng test --watch=false` cuatro veces: `2 FAILED, 1476 SUCCESS`, `1478 SUCCESS`, `1478 SUCCESS`, `1 FAILED, 1477 SUCCESS` (fallo intermitente anotado en F00 `tasks.md`); `npx ng build --configuration production` exit 0; `npx eslint "src/**/*.ts"` `✖ 68 problems (0 errors, 68 warnings)`.
**Verificación:** `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -p tsconfig.spec.json --noEmit` · `npx ng test --watch=false` tres veces · `npx ng build --configuration production` · `npx eslint` (ningún aviso nuevo).

| # | Capa | Tarea | Archivos | Terminado cuando… | Estado |
|---|---|---|---|---|---|
| AP1 | todas | Asignación por la Presidenta (D1 a D10), retiro de la asignación de la Secretaría y perfil Bioético | `plan.md` §1 | EARS 1 a 12 con pruebas; mutaciones M1 a M13 detectadas; verificación limpia | Hecho (código y pruebas `03422bc`; spec v0.2 `c80be7b`; pendiente de revisión en el navegador y del PR junto con TSK-002-N52) |

**Mutaciones previstas (AP1):**

| # | Qué se rompe |
|---|---|
| M1 | `BIOETICO` fuera de `PEER_EVALUATOR_PROFILES` |
| M2 | mínimo de 1 evaluador en lugar de 2 |
| M3 | sin la regla «al menos uno que no sea de Sociedad Civil» |
| M4 | sin la regla «al menos uno de Sociedad Civil» |
| M5 | se permiten personas repetidas |
| M6 | la fila de Sociedad Civil se puede quitar en la expedita |
| M7 | aparece la fila de un perfil sin miembros |
| M8 | se vuelve a enviar `{ evaluatorIds }` (código anterior) |
| M9 | texto genérico en lugar del mensaje del backend |
| M10 | `ASSIGN_EVALUATORS: ['SECRETARIA']` |
| M11 | sin la opción del menú de PRESIDENTE, o las rutas con `roles: ['SECRETARIA']` |
| M12 | vuelve la pestaña «Estratificación de Riesgo» de la Secretaría |
| M13 | en pleno, el perfil viene elegido por defecto |

## Resultados de AP1 (19/11/2026, `03422bc`)

**Verificación:**
- `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`: exit 0 las dos.
- `npx ng test --watch=false` tres veces: `1 FAILED, 1517 SUCCESS` · `1 FAILED, 1517 SUCCESS` · `1518 SUCCESS` (línea base 1478; 40 pruebas más). Fallaron, una vez cada una, «NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c) nuevo diseño (D15, C2d) con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra» (corrida 1) y «DialogComponent al abrir, el foco entra al diálogo y queda atrapado» (corrida 2). Las dos son de foco y fallan también en la línea base: tres corridas completas en un worktree de `444c49f` dieron `2 FAILED, 1476 SUCCESS` (las dos), `1 FAILED, 1477 SUCCESS` (NuevoProtocoloPage) y `2 FAILED, 1476 SUCCESS` (las dos). Anotadas en F00 `tasks.md`; no se corrigen en F03.
- `npx ng build --configuration production`: exit 0.
- `npx eslint "src/**/*.ts"`: `✖ 65 problems (0 errors, 65 warnings)` (línea base 68). Ningún archivo empeora (comparado archivo por archivo contra `444c49f`); los 3 avisos menos son los de `assign-peers-modal` (2, borrado) y `dashboard-secretaria.page.ts` (1). Los archivos nuevos no tienen avisos.
- CRLF en todos los archivos nuevos y cambiados; sin colores hexadecimales en los `.scss` de la lista y del formulario (EARS 12).

**Mutaciones** (rompe, corre solo las pruebas de la regla con `--include`, revierte editando):

| # | Qué se rompió | Prueba que falla | Línea | Resultado |
|---|---|---|---|---|
| M1 | `BIOETICO` fuera de `PEER_EVALUATOR_PROFILES` (en tiempo de ejecución) | «LoadAssignmentMembersUseCase (F03 D8) cruza evaluators/active con los perfiles del dashboard y reconoce Bioético» (y 4 más) | `TOTAL: 5 FAILED, 20 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M2 | mínimo de 1 evaluador en lugar de 2 | «PeerAssignmentFormPage (F03 D3 a D7) expedita (D3) solo Sociedad Civil: «Asigne al menos 2 evaluadores.»» (y 2 más) | `TOTAL: 3 FAILED, 37 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M3 | sin la regla «al menos uno que no sea de Sociedad Civil» | «PeerAssignmentFormPage (F03 D3 a D7) en pleno (D4) solo Sociedad Civil incluida: «Incluya al menos un evaluador que no sea de Sociedad Civil.»» (y 1 más) | `TOTAL: 2 FAILED, 38 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M4 | sin la regla «al menos uno de Sociedad Civil» | «PeerAssignmentFormPage (F03 D3 a D7) expedita (D3) sin miembros de Sociedad Civil no hay su fila y el motivo lo dice (§4)» (y 1 más) | `TOTAL: 2 FAILED, 38 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M5 | se permiten personas repetidas | «PeerAssignmentFormPage (F03 D3 a D7) expedita (D3) una persona en dos filas: «… está en más de una fila; cada persona entra una sola vez.»» (y 1 más) | `TOTAL: 2 FAILED, 38 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M6 | la fila de Sociedad Civil se puede quitar en la expedita (sin la guarda y con el botón) | «PeerAssignmentFormPage (F03 D3 a D7) expedita (D3) la fila de Sociedad Civil no se puede quitar; las demás sí y vuelven con «Agregar {perfil}»» | `TOTAL: 1 FAILED, 25 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M7 | aparece la fila de un perfil sin miembros | «peer-assignment-composition (F03 D3 a D5, D8) expeditedRowProfiles (D3) la fila de un perfil sin miembros no aparece» y «PeerAssignmentFormPage (F03 D3 a D7) expedita (D3) una fila por perfil con miembros, en orden; sin la fila de Bioético, que no tiene miembros» (y 11 más, que arman la expedita sin quitar la fila de Bioético) | `TOTAL: 13 FAILED, 27 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M8 | se vuelve a enviar `{ evaluatorIds }` (código anterior) | «EvaluationApiAdapter (Infrastructure) assignPeerEvaluators (F03 D6, N52) envía { reviewType, evaluators } (nunca evaluatorIds) y traduce la respuesta del backend» | `TOTAL: 1 FAILED, 8 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M9 | texto genérico en lugar del mensaje del backend | «PeerAssignmentFormPage (F03 D3 a D7) errores del envío (D6) 400 del backend: se muestra tal cual en role="alert" y el formulario se conserva» (y 1 más) | `TOTAL: 2 FAILED, 24 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M10 | `ASSIGN_EVALUATORS: ['SECRETARIA']` | «ProtocolWorkspaceComponent - acciones contextuales Asignar Pares exige la aceptación de tiempos; sin ella, PRESIDENTE ve el aviso y SECRETARIA no (F10 D20 (3))» (y 10 más) | `TOTAL: 11 FAILED, 58 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M11a | sin la opción «Asignar evaluadores» del menú de PRESIDENTE | «AppShellComponent (T13b) Menú de PRESIDENTE, EVALUADOR e INVESTIGADOR (trasladadas en T10-5b) al cambiar de PRESIDENTE a EVALUADOR el menú cambia sin recrear el componente» (y 4 más) | `TOTAL: 5 FAILED, 93 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M11b | rutas de asignación con `roles: ['SECRETARIA']` | «EVALUATION_ROUTES (Routing Architecture) assignment/:protocolId: solo PRESIDENTE con EVALUACION_ASIGNAR, carga perezosa (F03 D1)» (y 6 más) | `TOTAL: 7 FAILED, 61 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M12 | vuelve la pestaña «Estratificación de Riesgo» de la Secretaría, con la carga de pares | «DashboardSecretariaPage (F03 D10 (2)) muestra solo la bandeja de trámites: sin la pestaña «Estratificación de Riesgo» ni la carga de pares» | `TOTAL: 1 FAILED, 0 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |
| M13 | en pleno, el perfil viene elegido si la persona tiene uno solo | «PeerAssignmentFormPage (F03 D3 a D7) en pleno (D4) una fila por persona; el perfil no viene elegido aunque haya uno solo; sin perfiles: «Sin perfil asignado»» (y 1 más) | `TOTAL: 2 FAILED, 24 SUCCESS` | Detectada; `git diff --stat` vacío al revertir |

**Notas:**
- Paso A (revisión del código sin commitear contra la spec): `GET /evaluations/profiles` del backend `dev` devuelve solo el catálogo (`findProfiles`), sin miembros; se confirma D8. El parseo de perfiles del dashboard pasó al dominio (`profileCodesFromNames`, `dashboardMemberProfiles`), compartido con la reasignación, sin duplicados.
- `route-roles.spec.ts` (T13a) exigía que ninguna ruta de evaluación declarara `data.roles`; F03 D1 cambia eso solo para `assignment` y `assignment/:protocolId`, y la prueba ahora lo fija.
- `workspace-routes.spec.ts`: la prueba «SECRETARIA abre info desde ASIGNAR de Mis pendientes» pasa a comprobar que ASIGNAR no tiene destino (D10 (5)).
- En el espacio del protocolo, la recarga del mismo `:id` (F10 D14) ya no la dispara «Asignar Pares», que ahora navega: las pruebas de recarga llaman a `reload()`, que siguen usando «Reintentar».


## Segunda verificación de AP1 (19/11/2026, noche, sobre `c7a0ac2`)

Se repitió todo para tener la salida propia; el árbol quedó limpio (`git status --short` vacío).

- `tsc` app y spec: exit 0 las dos.
- `npx ng test --watch=false` tres veces: `2 FAILED, 1516 SUCCESS` · `2 FAILED, 1516 SUCCESS` · `1 FAILED, 1517 SUCCESS` (1518 pruebas, como en la primera verificación). Fallaron solo las dos pruebas de foco ya anotadas: «NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c) nuevo diseño (D15, C2d) con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra» (corridas 1 y 2) y «DialogComponent al abrir, el foco entra al diálogo y queda atrapado» (las tres). En un worktree de `444c49f`, tres corridas: `2 FAILED, 1476 SUCCESS` (las dos) · `1 FAILED, 1477 SUCCESS` (DialogComponent) · `1478 SUCCESS`. Difiere de la primera verificación solo en cuántas veces falla cada una; siguen siendo intermitentes y de la línea base.
- `npx ng build --configuration production`: exit 0 (los avisos son de `canvg`/`core-js` no ESM, de terceros).
- `npx eslint "src/**/*.ts"`: `✖ 65 problems (0 errors, 65 warnings)`; línea base `444c49f` 68. Comparado archivo por archivo, solo cambian `assign-peers-modal.component.ts` (2 → borrado) y `dashboard-secretaria.page.ts` (1 → 0); ninguno empeora.
- CRLF: los archivos nuevos y cambiados de `03422bc` (19/11/2026) ya estaban en CRLF en el árbol de trabajo (contado por bytes: `\r\n` en todas las líneas); el índice guarda LF (`core.autocrlf=true`).
- Los borrados de D10 (1) (`assign-peers-modal`, `peer-risk-pending-table`, la página `peer-risk-pending`, `pending-peer-protocol.util`, `AssignmentPage` y sus specs) quedaron en `c80be7b`, un commit `docs(spec-f03)`, y no en `03422bc`. No se reescribe el historial; se menciona en el PR.

**Mutaciones, segunda vez** (cada una aplicada con un script que exige el texto exacto, corre solo sus specs con `--include`, restaura los bytes originales y comprueba `git diff --stat` vacío; todas restauradas así):

| # | Prueba que falla (principal) | Total | ¿Igual a la primera? |
|---|---|---|---|
| M1 | «LoadAssignmentMembersUseCase (F03 D8) cruza evaluators/active con los perfiles del dashboard y reconoce Bioético» y 4 de `peer-evaluation.entity.spec.ts` | `5 FAILED, 20 SUCCESS` | Sí |
| M2 | «… expedita (D3) solo Sociedad Civil: «Asigne al menos 2 evaluadores.»» y 2 de la composición | `3 FAILED, 37 SUCCESS` | Sí |
| M3 | «… en pleno (D4) solo Sociedad Civil incluida: …» y «compositionBlockReason (7) todos de Sociedad Civil» | `2 FAILED, 38 SUCCESS` | Sí |
| M4 | «… expedita (D3) sin miembros de Sociedad Civil no hay su fila y el motivo lo dice (§4)» y «compositionBlockReason (6) sin Sociedad Civil» | `2 FAILED, 38 SUCCESS` | Sí |
| M5 | «… expedita (D3) una persona en dos filas: …» y «compositionBlockReason (4) personas repetidas» | `2 FAILED, 38 SUCCESS` | Sí |
| M6 | «… expedita (D3) la fila de Sociedad Civil no se puede quitar; las demás sí y vuelven con «Agregar {perfil}»» | `1 FAILED, 25 SUCCESS` | Sí |
| M7 | «expeditedRowProfiles (D3) la fila de un perfil sin miembros no aparece» y «… una fila por perfil con miembros, en orden; sin la fila de Bioético …» (y 11 más) | `13 FAILED, 27 SUCCESS` | Sí |
| M8 | «EvaluationApiAdapter … assignPeerEvaluators (F03 D6, N52) envía { reviewType, evaluators } (nunca evaluatorIds) …» | `1 FAILED, 8 SUCCESS` | Sí |
| M9 | «… errores del envío (D6) 400 del backend: …» y «409 del interceptor: …» | `2 FAILED, 24 SUCCESS` | Sí |
| M10 | «… acciones contextuales Asignar Pares exige la aceptación de tiempos; sin ella, PRESIDENTE ve el aviso y SECRETARIA no (F10 D20 (3))» (y 10 más) | `11 FAILED, 58 SUCCESS` | Sí |
| M11a | «AppShellComponent (T13b) … al cambiar de PRESIDENTE a EVALUADOR el menú cambia sin recrear el componente» (y 4 más: AppShell con PRESIDENTE, `StaticMenuConfigAdapter` etiquetas y orden, íconos, `GetMenuForRoleUseCase` PRESIDENTE) | `5 FAILED, 92 SUCCESS` | Fallos sí; aciertos 92, no 93: al quitar la entrada, `menu-routes.spec.ts` genera una prueba menos (una por entrada). Con `roles: []` en vez de quitarla: `6 FAILED, 92 SUCCESS` (falla también «asigna exactamente un rol a cada entrada») |
| M11b | «EVALUATION_ROUTES … assignment/:protocolId: solo PRESIDENTE con EVALUACION_ASIGNAR, carga perezosa (F03 D1)» (y 6 más) | `7 FAILED, 61 SUCCESS` | Sí |
| M12 | «DashboardSecretariaPage (F03 D10 (2)) muestra solo la bandeja de trámites: …» | `1 FAILED, 0 SUCCESS` | Sí |
| M13 | «… en pleno (D4) una fila por persona; el perfil no viene elegido aunque haya uno solo; …» y «… «Quitar» saca a la persona …» | `2 FAILED, 24 SUCCESS` | Sí |
