# F08 · Configuración — tareas

**Ramas:** cada tarea en su propia rama desde `dev`, con su PR a `dev`.

| Tarea | Rama |
|---|---|
| CF1 | `feat/f08-cf1-formatos` |

Ciclo de cada tarea: README §6 y skill `ciclo-tarea-ceish`. Claude hace el Paso 0, el código, revisa el diff con `code-review`, corre las mutaciones (se revierte editando y se comprueba con `cmp`), la verificación doble con build de producción y los commits; `impeccable` solo como revisión final.

**Verificación de cada tarea, dos veces:** `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -p tsconfig.spec.json --noEmit` · `npx eslint "src/**/*.ts"` y `npx eslint <archivos cambiados>` (sin `--fix`; ningún archivo peor que en `dev`) · `npx ng test --watch=false --browsers=ChromeHeadless` · `npx ng build --configuration production`; salidas en archivos con fecha.

| # | Capa | Tarea | Requisitos | Archivos | Pruebas | Mutaciones | Hecho cuando… | Estado |
|---|---|---|---|---|---|---|---|---|
| CF1 | presentation + shared + rutas | `Configuración · Formatos` de la Secretaría (venía de F09, Paso 0 de C5) | F08-1 a F08-6 (D1 a D10) | CREAR `src/shared/utils/descarga-en-pestana.util.ts` + spec (`abrirEnPestana`, `esUrlDeDescargaValida`; sale de `nuevo-protocolo.page.ts`), `template-management.page.{html,scss,spec.ts}`, un componente de secciones de Configuración en `features/dashboard/presentation/components/`; MODIFICAR `template-management.page.ts`, `user-management.page.ts` (+ spec), `app.routes.ts` (+ `app.routes.spec.ts`), `dashboard/routes.ts`, `route-roles.spec.ts`, `nuevo-protocolo.page.ts` (usa la función compartida), `subsanacion.page.ts` (+ spec) | Lista con `Con archivo`/`Sin archivo`, sin la ruta interna; estados de la lista; `.docx` sin petición si no lo es; subida con éxito y con error; descarga con la función compartida en las tres pantallas; código repetido no llama al backend; nuevo formato con y sin archivo; el botón de subsanación es un `<button>`; la ruta vieja redirige; solo `CONFIG_PLANTILLAS` entra; las pruebas de C5 siguen pasando sin cambiar lo que comprueban | Por regla nueva: código repetido, `.docx`, `opener = null`, pestaña antes de la petición, `https`, `<button>` en subsanación, redirect, permiso de la ruta, descarga sin la función compartida. Cada una revertida editando y comprobada con `cmp` | Commit de docs antes del código; `code-review`; mutaciones; verificación doble con build de producción; commit de código y docs de cierre; revisión `impeccable` al final | En curso (17/11/2026) |

## Tareas del backend de las que depende F08

| TSK | Qué | Bloquea | Estado |
|---|---|---|---|
| (sin número) | **Formatos, validaciones y estado** (D10): DTO de validación en `POST /documents/templates` (`code` con `^[A-Z0-9_]+$` y hasta 100 caracteres, `name` obligatorio y hasta 200); 409 si el código ya existe (hoy cambia el nombre sin avisar, `documents.service.ts:108-119`); tipo `.docx` y tamaño máximo al subir (`POST /storage/upload-url` solo pide `key` y `contentType`, `storage.controller.ts:23-44`); endpoint para activar o desactivar un formato (el campo `activo` existe en `document-template.entity.orm.ts:23-24`, sin endpoint; `GET /documents/templates` solo lista los activos) | Activar o desactivar en la pantalla; quitar la comprobación del código repetido del frontend cuando llegue el 409 | Por hacer |

## Notas

- **CF1, Paso 0 (17/11/2026, `dev` `685914a` con C5 mergeada; backend en solo lectura, `dev` `e0c5dec`):** línea base en `%TEMP%\...\scratchpad\cf1-base-20261117-0746`: `tsc` app y spec exit 0; `npx eslint "src/**/*.ts"` 0 errores y 68 avisos; `ng test` completo `TOTAL: 1360 SUCCESS`; `ng build --configuration production` exit 0 con 19 avisos. Aviso previo en los archivos de CF1: `subsanacion.page.ts:41` (`ProtocolDocumentHistoryEntry` sin usar). `TemplateManagementPage` (1499 líneas, plantilla y estilos en el `.ts`, sin `OnPush`) no tenía prueba propia (solo `route-roles.spec.ts:90`); tenía 57 colores hexadecimales, gradientes, animaciones, Bootstrap y estilos en línea, y dos `window.open` al backend sin token (`template-management.page.ts:1491,1495`), como `subsanacion.page.ts:1450,1458`. No hay canvas de la pantalla en el repo. Formatos en la base: `RESPUESTA_OBSERVACIONES` (`1795000000000-CreateDocumentTemplatesTable.ts:18`) y los 9 de los requisitos (`1950000000000`).
