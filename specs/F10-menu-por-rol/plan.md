# F10 · Menú lateral por rol activo — plan

**Versión:** 0.1 · **Fecha:** 10/11/2026
**Base:** Paso 0 del 10/11/2026 (frontend `dev` `663d2cd`; backend en solo lectura, `dev`). Spec: `spec-ui.md` 0.1.

No se crea una sección nueva en `src/features/`: el menú por rol ya existe en `features/shell` (F00) y se extiende.

---

## 1. Archivos por capa

| Capa | Archivo | Qué cambia | Tarea |
|---|---|---|---|
| domain | `src/domain/entities/menu-item.entity.ts` | Sin cambios en T10-1. En T10-4, campo `icon` (D5) | T10-4 |
| domain | `src/domain/ports/menu-config.port.ts` | Sin cambios (clase abstracta usada como token de DI) | — |
| application | `src/features/shell/application/get-menu-for-role.use-case.ts` | Sin cambios (filtra por `item.roles.includes(role)`) | — |
| application | `src/features/shell/application/active-role.facade.ts` | Sin cambios (rol activo y cambio de rol) | — |
| infrastructure | `src/features/shell/infrastructure/menu.config.ts` | `MENU_ITEMS` con los 4 roles (§3 de spec-ui) | T10-1 |
| presentation | `src/features/dashboard/presentation/components/sidebar/sidebar.component.{ts,html,scss}` | Lista plana desde `GetMenuForRoleUseCase(rol activo)`, `nav` con `aria-label`, `aria-current`, foco visible, 44 px, "Cerrar sesión" en gris | T10-2 |
| presentation | `src/features/shell/presentation/app-shell/app-shell.component.{ts,html,scss}` | Ícono desde la configuración (sin `getIcon`, `:118-133`) y "Cerrar sesión" en gris | T10-4 |
| — (retiro) | `src/shared/constants/menu-ui.config.ts`, `AuthFacade.menuConfig` (`auth.facade.ts:37-114`) y su `SubMenuItem` | Se borran cuando nadie los use, con `git grep` como prueba | T10-3 |

**DI (angular-di):** no hacen falta tokens nuevos. `MenuConfigPort` ya se registra con `useClass: StaticMenuConfigAdapter` en `app.config.ts:78`, y `GetMenuForRoleUseCase` y `ActiveRoleFacade` son `providedIn: 'root'`. El sidebar los obtiene con `inject()`.

**Capas:** el sidebar (presentation de `dashboard`) importará `GetMenuForRoleUseCase` y `ActiveRoleFacade` de `@features/shell/application`. Hoy `dashboard.page.ts:22-23` ya importa `RoleSelectorComponent` y `ActiveRoleFacade` de `shell`, así que no es una excepción nueva. Comprobar en T10-2 con `npx eslint` (regla `no-restricted-imports` de F00 T15).

## 2. Rutas

No cambia ninguna ruta en T10-1 a T10-4. Las rutas del menú y sus guards están en spec-ui §3. T10-5 (un solo layout) cambia `app.routes.ts:104-131` y `dashboard/routes.ts:122-129`; T10-5a no cambia rutas (solo el aspecto del AppShell), las cambian T10-5b a T10-5d.

## 3. Mapa de equivalencias (Paso 0, 10/11/2026)

| Pieza | Qué existe | Clase | Acción |
|---|---|---|---|
| Configuración del menú por rol | `MENU_ITEMS` + `StaticMenuConfigAdapter` (`menu.config.ts:9-28`) | (c) reutilizar | Se le agregan los otros 3 roles (T10-1) |
| Filtro por rol | `GetMenuForRoleUseCase` (`get-menu-for-role.use-case.ts:10-12`) | (c) reutilizar | — |
| Menú por permisos | `AuthFacade.menuConfig()` + `menu-ui.config.ts` + `sidebar` | (b) reemplazado | T10-2 deja de usarlo; T10-3 lo retira |
| Íconos | `AppShellComponent.getIcon(id)` (`app-shell.component.ts:118-133`), `switch` por id | (b) reemplazado | T10-4: el ícono va en la configuración |
| Contador | `PendingCountHttpAdapter` (`pending-count-http.adapter.ts:24-26`) | (c) reutilizar | Solo SECRETARIA |
| Prueba de rutas reales | `start()` de `src/app/app.routes.spec.ts:39-80` | (c) patrón | Se copia en `src/app/menu-routes.spec.ts` (T10-1) |

## 4. Seguridad (angular-security)

- El menú **no es seguridad**: cada ruta tiene su guard. T10-1 agrega una prueba que navega a cada opción con su rol activo, con el router y los guards reales, y comprueba que no rebota (EARS 5).
- Las rutas del menú de §3 tienen `RoleGuard` con el rol correcto, salvo `/dashboard/evaluations/list`, que solo tiene permisos (S-2).
- Huecos que no son del menú: S-1 a S-3 en `tasks.md`.

## 5. Accesibilidad (ui-ux-pro-max / impeccable; manda el repo cuando choca)

| Punto | AppShell hoy | Menú viejo hoy | Objetivo |
|---|---|---|---|
| `nav` con `aria-label` | Sí (`app-shell.component.html:11`) | No | Sí (T10-2) |
| `aria-current="page"` | Sí (`:20`) | No | Sí (T10-2) |
| Foco visible | `:focus-visible` 2 px (`app-shell.component.scss:127-130`) | Material por defecto | Igual que el AppShell (T10-2) |
| Alto mínimo | 44 px (`:83`) | Ítem de Material | 44 px (T10-2) |
| Teclado | `<a>` y `<button>` nativos | Acordeón: hay que abrir el panel antes | Lista plana (T10-2) |
| Íconos | `mat-icon` (Material pone `aria-hidden="true"`) | Igual | Decorativos, texto visible (D5) |
| Contraste | Inactivo 7,58:1 · activo 7,50:1 · contador 6,87:1 · "Cerrar sesión" rojo `#DC2626` 4,83:1 | — | "Cerrar sesión" gris `#475569`, 7,58:1 (D6) |

Fuera de F10 (anotado): mover el foco al contenido al cambiar de ruta; texto para lector de pantalla en el número del contador; menú fijo sin `@media` (F01 C8 no aprobado). La regla `empty-nav-state` de ui-ux-pro-max (explicar en vez de ocultar) no se aplica: manda la regla a (D7).

## 6. Pruebas

| Tarea | Prueba |
|---|---|
| T10-1 | `menu.config.spec.ts`: labels exactos y en orden por rol; un solo rol por entrada; ninguna ruta es `/dashboard/home`. `src/app/menu-routes.spec.ts`: con router y guards reales, cada opción de PRESIDENTE, EVALUADOR e INVESTIGADOR abre su ruta sin aviso; INVESTIGADOR en `/dashboard/resolutions/calls` rebota con aviso (control) |
| T10-2 | `sidebar.component.spec.ts`: opciones del rol activo, cambio de rol sin recargar, `aria-current`, `nav` con `aria-label`; `dashboard.page.spec.ts` sigue verde |
| T10-3 | Sin pruebas nuevas: `git grep` sin usos y suite completa verde |
| T10-4 | `app-shell.component.spec.ts`: el ícono sale de la configuración; "Cerrar sesión" sin la clase roja |

## 7. Pantallas actuales a verificar en cada PR

Con cada rol (la usuaria, sin contraseñas en los prompts): el menú que sale, que cada opción abre su pantalla, y con la Presidenta (PRESIDENTE + EVALUADOR) que al cambiar de rol cambia el menú. También Mis pendientes y Protocolos de la Secretaría (F01) y Mis protocolos y Nuevo protocolo del investigador (F09).

## 8. Duplicados temporales

| Duplicado | Por qué | Retiro |
|---|---|---|
| `MENU_ITEMS` y el menú viejo (`AuthFacade.menuConfig()` + `menu-ui.config.ts`) | Hasta T10-2 el sidebar de `DashboardPage` sigue con el viejo | T10-3 |
| `getIcon` del AppShell y el campo `icon` | Hasta T10-4 | T10-4 |
| Dos layouts (AppShell y `DashboardPage`) | F00 D1 | T10-5a a T10-5d (D16): T10-5a aspecto, T10-5b PRESIDENTE y EVALUADOR, T10-5c INVESTIGADOR, T10-5d retiro (igual que T14 de F00) |
