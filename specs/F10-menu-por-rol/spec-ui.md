# F10 · Menú lateral por rol activo — spec-ui

**Versión:** 0.3 · **Fecha:** 11/11/2026 · **Rama:** `feat/f10-t10-2-sidebar-por-rol`
**Historial:**
- 0.1 (10/11/2026) primer borrador desde el Paso 0 del menú (frontend `dev` `663d2cd`; backend en solo lectura, `dev`) y las decisiones de la usuaria del 10/11/2026 (D1–D8).
- 0.2 (10/11/2026) cambio de decisión de la usuaria: D4 pasa a 3 opciones para INVESTIGADOR, con Subsanaciones (bandeja que ya existe); el rediseño de esa bandeja y de Corregir queda fuera de F10 (T10-1b).
- 0.3 (11/11/2026) Paso 0 de T10-2 (frontend `dev` `64287c8`): D9 (investigador sin verificar) y su regla única en `AuthFacade`, aprobadas por la usuaria; EARS 9.

**Cubre:** spec-001 HU-001 (roles fijos; una persona puede tener más de un rol y trabaja con un rol activo) · spec-003 RF-ALR.f (solo el contador de "Mis pendientes" de la Secretaría, que ya existe).
**Depende de:** F00 (rol activo, `ROLE_HOME`, `RoleGuard`, AppShell). Actualiza F00 D1, §2, §4 y §10 (F00 v0.3).
**Canvas:** `specs/F09-investigador-borrador-envio/canvas/mis-protocolos-investigador.png` para el menú del investigador; para los demás roles, la tabla de opciones que dio la usuaria el 10/11/2026. Del canvas entra **solo** el menú lateral (opciones, orden, "Cerrar sesión" abajo y en gris). El resto de la pantalla no es alcance.

---

## 1. Alcance y roles

Que cada rol activo vea en el menú lateral **solo sus opciones**, que cada opción abra una pantalla que existe y que deja entrar a ese rol, y que el menú cambie al cambiar de rol.

**Hoy (Paso 0, 10/11/2026):**
- SECRETARIA usa el AppShell con un menú por rol activo (`MENU_ITEMS`, `src/features/shell/infrastructure/menu.config.ts:9-21`).
- PRESIDENTE, EVALUADOR e INVESTIGADOR usan `DashboardPage` con el menú viejo (`AuthFacade.menuConfig()`, `src/features/auth/facades/auth.facade.ts:37-114`, y `src/shared/constants/menu-ui.config.ts`). Ese menú se arma con los **permisos de todos los roles vigentes** (el backend los devuelve unidos, `auth.service.ts:191-266` del backend), no con el rol activo: no cambia al pasar de PRESIDENTE a EVALUADOR, muestra nombres técnicos ("Dashboard notif", por `toSentenceCase` en `auth.facade.ts:99-104`), lleva muchas opciones a `/dashboard/home` y tiene enlaces rotos (ver §8).

**Incluye:** la configuración única del menú de los 4 roles, el menú de `DashboardPage` leído de esa configuración, el retiro del menú viejo, íconos decorativos y "Cerrar sesión" en gris.

**No incluye:**
- pantallas nuevas (las opciones sin pantalla van a §8, Pendientes);
- contadores sin endpoint (los de Presidencia);
- pasar PRESIDENTE, EVALUADOR e INVESTIGADOR al AppShell y retirar `DashboardPage` (T10-5, igual que T14 de F00);
- el rediseño de la bandeja de Subsanaciones y de Corregir del investigador (canvas "Investigador · Subsanaciones"): spec aparte después de la reunión del 12/11/2026; tampoco entra en T10-2;
- corregir los guards de las rutas que no están en el menú (S-1 a S-3, después del menú).

## 2. Decisiones de esta spec (usuaria, 10/11/2026)

| # | Decisión |
|---|---|
| D1 | **SECRETARIA: 5 opciones**, sin cambios (F00 §4): Mis pendientes · Protocolos · Convocatorias · Reportes · Configuración. Seguimiento y Renovaciones van a Pendientes hasta que existan (F06/F07). |
| D2 | **PRESIDENTE: 2 opciones:** Sesiones del pleno (`/dashboard/resolutions/calls`) · Reportes (`/dashboard/reports/stats`). Se ocultan "Mis pendientes" (el inicio tiene números inventados, S-3) y "Generar resoluciones" (no está en el canvas; la Presidenta firma, no genera). "Por firmar" y "Asignar evaluadores" (reunión del 06/11/2026) van a Pendientes. |
| D3 | **EVALUADOR: 1 opción:** Mis evaluaciones (`/dashboard/evaluations/list`). No está en el canvas; se usa la pantalla que ya existe. |
| D4 | **INVESTIGADOR: 3 opciones:** Mis protocolos · Nuevo protocolo · Subsanaciones (`/dashboard/evaluacion-etica/subsanaciones`, la bandeja que ya existe). "Informes de seguimiento" va a Pendientes (no existe). *Cambio de decisión del 10/11/2026 (v0.2): reemplaza la versión 0.1, que quitaba Subsanaciones del menú.* |
| D5 | **Íconos:** se mantienen como en el AppShell, decorativos (`aria-hidden="true"`), con el texto siempre visible. |
| D6 | **"Cerrar sesión" en gris**, como en el canvas, con contraste ≥ 4.5:1 (`--c-text-2` `#475569` sobre blanco: 7,58:1). |
| D7 | **Regla a:** ninguna opción lleva a una página que no existe ni a `/dashboard/home` como relleno. Si la pantalla no existe, la opción no se muestra y queda en §8. **Regla b:** el menú se define en un solo lugar (`MENU_ITEMS`), no repartido por componentes ni calculado con permisos. |
| D8 | Mientras existan los dos layouts, el menú de `DashboardPage` lee la misma configuración por rol activo que el AppShell (T10-2). Pasar a un solo layout es T10-5. |
| D9 | **INVESTIGADOR sin verificar** (11/11/2026): con el rol activo INVESTIGADOR, si no puede entrar al área del investigador, el menú no muestra sus 3 opciones y en su lugar muestra el texto "Verifica tu correo para crear y ver tus protocolos." (texto, no enlace). La regla es **una sola** para el menú y para `VerificadoGuard`: se extrae de `verificado.guard.ts:25-33` a `AuthFacade.canEnterInvestigatorArea()`, con el mismo comportamiento de hoy (tiene SECRETARIA, PRESIDENTE o EVALUADOR entre **todos** sus roles vigentes, o `emailVerificado`). Consecuencia aceptada: un usuario INVESTIGADOR + EVALUADOR sin verificar ve sus opciones con INVESTIGADOR activo, igual que el guard lo deja pasar; revisarla es parte de S-2. |

## 3. Menú por rol activo

| Rol activo | Opción | Ruta | Pantalla | Guard de la ruta |
|---|---|---|---|---|
| SECRETARIA | Mis pendientes (con contador) | `/pendientes` | `MisPendientesPage` | `RoleGuard` [SEC] |
| | Protocolos | `/protocolos` | `ProtocolosPage` | `RoleGuard` [SEC] + `PROTOCOLOS_LISTAR` |
| | Convocatorias | `/convocatorias` | `CallsManagementPage` | `RoleGuard` [SEC] + `RESOLUCION_CONVOCATORIAS` |
| | Reportes | `/reportes` | `StatsDashboardPage` | `RoleGuard` [SEC] |
| | Configuración | `/configuracion` → `/configuracion/usuarios` | `UserManagementPage` | `RoleGuard` [SEC] + `USUARIOS_VER` |
| PRESIDENTE | Sesiones del pleno | `/dashboard/resolutions/calls` | `CallsManagementPage` ("Convocatorias y Actas") | `RoleGuard` [SEC, PRES] + `RESOLUCION_CONVOCATORIAS` (`resolutions/routes.ts:11-19`) |
| | Reportes | `/dashboard/reports/stats` | `StatsDashboardPage` | `RoleGuard` [SEC, PRES] (`reports/routes.ts:7-13`) |
| EVALUADOR | Mis evaluaciones | `/dashboard/evaluations/list` | `EvaluationListPage` | `AuthGuard` con permisos `any` (`evaluations/routes.ts:42-56`; EVALUADOR tiene `EVALUACION_RIESGO`) |
| INVESTIGADOR | Mis protocolos | `/dashboard/investigador/mis-protocolos` | `MisProtocolosPage` | `VerificadoGuard` + `RoleGuard` [INV, SEC] (`investigador.routes.ts:20-26`) |
| | Nuevo protocolo | `/dashboard/investigador/nuevo-protocolo` | `NuevoProtocoloPage` | `VerificadoGuard` + `RoleGuard` [INV, SEC] (`:11-17`) |
| | Subsanaciones | `/dashboard/evaluacion-etica/subsanaciones` | `SubsanacionPage` | `AuthGuard` con permiso `EVALUACION_SUBSANACIONES` (`evaluations/routes.ts:104-115`; INVESTIGADOR lo tiene en la matriz, `1880000000000-FixedRolesMatrix.ts:159` del backend); sin `RoleGuard` (S-2) |

En todos los roles: "Cerrar sesión" abajo, separado de las opciones, en gris (D6).

## 4. Estados

- **Sin rol activo:** no hay menú; `RoleHome` lleva a `/auth/login` con "Su cuenta no tiene un rol vigente." (F00 D12).
- **INVESTIGADOR sin verificar (D9):** en lugar de sus opciones, el texto "Verifica tu correo para crear y ver tus protocolos."; "Cerrar sesión" sigue abajo.
- **Contador de "Mis pendientes":** con `totales.todos = 0` o si la petición falla, no se muestra número (F01 criterio 17). Los demás roles no tienen contador.

## 5. Interacciones

- Al elegir una opción, se abre su pantalla; la opción queda resaltada con `--c-primary-soft` y `aria-current="page"`.
- Al cambiar de rol activo con el selector del avatar, el menú cambia al del nuevo rol sin recargar la página y se navega a `ROLE_HOME` del nuevo rol (`role-selector.component.ts:32-37`).
- Todo se usa con teclado (Tab y Enter); el foco es visible.

## 6. Endpoints

| Endpoint | Para qué | Estado |
|---|---|---|
| Sesión actual (`GET /auth/me`) | Roles vigentes, para el rol activo | Existe |
| `GET /secretaria/pendientes?filtro=todos` | Contador de "Mis pendientes" de la Secretaría (`totales.todos`) | Existe (`secretaria.controller.ts:28` del backend) |
| Pendientes de Presidencia ("Mis pendientes", "Por firmar") | Contadores del canvas | **FALTA** (no hay controlador de presidencia ni de actas por firmar) |

## 7. Criterios de aceptación (EARS)

1. El sistema debe definir las opciones del menú lateral de los 4 roles en una sola configuración (`MENU_ITEMS`).
2. Mientras el rol activo sea R, el menú lateral debe mostrar solo las opciones de R de §3, en ese orden, y "Cerrar sesión" abajo.
3. Cuando el usuario cambie de rol activo, el sistema debe mostrar el menú del nuevo rol sin recargar la página y navegar a `ROLE_HOME` del nuevo rol.
4. Si la pantalla de una opción no existe, entonces el sistema no debe mostrar la opción, y la opción debe quedar en §8 (Pendientes).
5. Cuando el usuario elija una opción del menú con su rol activo, el sistema debe abrir su pantalla sin el aviso "No tiene acceso a esta sección con el rol activo.".
6. Mientras una opción corresponda a la ruta actual, su enlace debe llevar `aria-current="page"` y el fondo `--c-primary-soft`.
7. El menú debe estar dentro de un `<nav>` con `aria-label`, usarse con Tab y Enter, tener foco visible y un alto mínimo de 44 px por opción; los íconos deben llevar `aria-hidden="true"` y el texto debe estar siempre visible.
8. Donde exista un endpoint de contador para la opción, el sistema debe mostrar el número; donde no exista, no debe mostrar ninguno.
9. Mientras el rol activo sea INVESTIGADOR y `AuthFacade.canEnterInvestigatorArea()` sea falso, el menú no debe mostrar las opciones del investigador y debe mostrar el texto "Verifica tu correo para crear y ver tus protocolos." (D9).

## 8. Pendientes

**Opciones sin pantalla (regla a):**

| Rol | Opción | Por qué no está | Cuándo |
|---|---|---|---|
| SECRETARIA | Seguimiento | F06 no está hecho (`/dashboard/follow-up` es solo el registro de eventos adversos) | F06 |
| SECRETARIA | Renovaciones | No existe bandeja (`/dashboard/renewals/request` es una solicitud) | F07 |
| PRESIDENTE | Mis pendientes | No hay pantalla ni endpoint; el inicio actual tiene números inventados (S-3) | Sección de Presidencia |
| PRESIDENTE | Por firmar | No hay pantalla ni endpoint | Sección de Presidencia |
| PRESIDENTE | Asignar evaluadores | Reunión del 06/11/2026. `/dashboard/evaluations/assignment` no tiene `RoleGuard` y PRESIDENTE no tiene `EVALUACION_ASIGNAR` en la matriz | Sección de Presidencia (decidir con F03) |
| PRESIDENTE | Protocolos | `/protocolos` y `protocols/list` son solo de SECRETARIA | Sección de Presidencia |
| INVESTIGADOR | Informes de seguimiento | No existe pantalla | F06 |

**Hallazgos del menú viejo (se resuelven al retirarlo, T10-2 y T10-3):**
- "Recepción Nueva" del investigador lleva a `/dashboard/protocols/reception/new`, que es solo SECRETARIA: rebota con aviso (`menu-ui.config.ts:51-55`, `protocols/routes.ts:77-85`).
- "Consolidación (Anexo 12)" de Presidencia lleva a `/dashboard/evaluations/consolidation` sin `:id`: la ruta no existe y cae en `**` (`menu-ui.config.ts:148-152`, `evaluations/routes.ts:87-103`).
- El evaluador nunca ve "Mis Evaluaciones": los permisos que la activan (`EVALUATION_FILL`, `EVALUACION_COMPLETAR_FORMULARIO`, `EVALUACION_VER_PROPIAS`) no están en la matriz del backend.
- "Resumen" o "Dashboard notif" según el orden de las filas del backend (sin `ORDER BY`); el orden de los módulos se pierde (`auth-api.adapter.ts:149`).

**Seguridad, después del menú (S-1 a S-3, en este orden; ver `tasks.md`):** ocultar una opción no es seguridad.
- S-1: `/dashboard/protocols/workspace/:id/*` solo tiene `AuthGuard` (`protocols/routes.ts:13-57`); con el hueco del backend en `GET /protocols/:id` permite ver protocolos ajenos.
- S-2: `AuthGuard` compara los permisos de todos los roles y deja pasar todo con `ADMIN_ALL` (`auth.guard.ts:29-35`; el rol ADMIN ya no existe); `follow-up`, `renewals` y `evaluations` no tienen `RoleGuard`.
- S-3: números inventados en el inicio (`dashboard-home.page.ts:762` y siguientes).
