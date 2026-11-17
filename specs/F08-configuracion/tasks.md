# F08 · Configuración — tareas

**Ramas:** cada tarea en su propia rama desde `dev`, con su PR a `dev`.

| Tarea | Rama |
|---|---|
| CF1 | `feat/f08-cf1-formatos` |

Ciclo de cada tarea: README §6 y skill `ciclo-tarea-ceish`. Claude hace el Paso 0, el código, revisa el diff con `code-review`, corre las mutaciones (se revierte editando y se comprueba con `cmp`), la verificación doble con build de producción y los commits; `impeccable` solo como revisión final.

**Verificación de cada tarea, dos veces:** `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -p tsconfig.spec.json --noEmit` · `npx eslint "src/**/*.ts"` y `npx eslint <archivos cambiados>` (sin `--fix`; ningún archivo peor que en `dev`) · `npx ng test --watch=false --browsers=ChromeHeadless` · `npx ng build --configuration production`; salidas en archivos con fecha.

| # | Capa | Tarea | Requisitos | Archivos | Pruebas | Mutaciones | Hecho cuando… | Estado |
|---|---|---|---|---|---|---|---|---|
| CF1 | presentation + shared + rutas | `Configuración · Formatos` de la Secretaría (venía de F09, Paso 0 de C5) | F08-1 a F08-6 (D1 a D10) | CREAR `src/shared/utils/descarga-en-pestana.util.ts` + spec (`abrirEnPestana`, `esUrlDeDescargaValida`; sale de `nuevo-protocolo.page.ts`), `template-management.page.{html,scss,spec.ts}`, un componente de secciones de Configuración en `features/dashboard/presentation/components/`; MODIFICAR `template-management.page.ts`, `user-management.page.ts` (+ spec), `app.routes.ts` (+ `app.routes.spec.ts`), `dashboard/routes.ts`, `route-roles.spec.ts`, `nuevo-protocolo.page.ts` (usa la función compartida), `subsanacion.page.ts` (+ spec) | Lista con `Con archivo`/`Sin archivo`, sin la ruta interna; estados de la lista; `.docx` sin petición si no lo es; subida con éxito y con error; descarga con la función compartida en las tres pantallas; código repetido no llama al backend; nuevo formato con y sin archivo; el botón de subsanación es un `<button>`; la ruta vieja redirige; solo `CONFIG_PLANTILLAS` entra; las pruebas de C5 siguen pasando sin cambiar lo que comprueban | Por regla nueva: código repetido, `.docx`, `opener = null`, pestaña antes de la petición, `https`, `<button>` en subsanación, redirect, permiso de la ruta, descarga sin la función compartida. Cada una revertida editando y comprobada con `cmp` | Commit de docs antes del código; `code-review`; mutaciones; verificación doble con build de producción; commit de código y docs de cierre; revisión `impeccable` al final | Hecha (17/11/2026): docs `6f02f42`, código `4044371`; resultados en Notas |

## Tareas del backend de las que depende F08

| TSK | Qué | Bloquea | Estado |
|---|---|---|---|
| (sin número) | **Formatos, validaciones y estado** (D10): DTO de validación en `POST /documents/templates` (`code` con `^[A-Z0-9_]+$` y hasta 100 caracteres, `name` obligatorio y hasta 200); 409 si el código ya existe (hoy cambia el nombre sin avisar, `documents.service.ts:108-119`); tipo `.docx` y tamaño máximo al subir (`POST /storage/upload-url` solo pide `key` y `contentType`, `storage.controller.ts:23-44`); endpoint para activar o desactivar un formato (el campo `activo` existe en `document-template.entity.orm.ts:23-24`, sin endpoint; `GET /documents/templates` solo lista los activos) | Activar o desactivar en la pantalla; quitar la comprobación del código repetido del frontend cuando llegue el 409 | Por hacer |

## Notas

- **CF1, resultados (17/11/2026):** `ng test` completo `TOTAL: 1408 SUCCESS` (1360 de la línea base y 48 nuevas: 9 de la función compartida, 29 de Formatos, 1 de Usuarios, 5 de Subsanación y 4 de `app.routes.spec.ts`; las 17 de C5 en `nuevo-protocolo.page.spec.ts` sin cambios). Verificación dos veces (`%TEMP%\...\scratchpad\cf1-ver1-20261117` y `cf1-ver2-20261117`): `tsc` app y spec exit 0; `npx eslint "src/**/*.ts"` 0 errores y 68 avisos, como la línea base; en los archivos cambiados solo los avisos que ya estaban en `dev` (`subsanacion.page.ts` `ProtocolDocumentHistoryEntry` y `user-management.page.ts` `any`); build de producción exit 0 con 19 avisos, como la línea base. Todo en CRLF.
- **CF1, mutaciones** (`scratchpad\cf1-mut-20261117`; cada una revertida editando y comprobada con `cmp`; `git diff --stat` igual antes y después). M3 y M8 no se revirtieron en la primera corrida (el texto de vuelta no era único): se restauraron editando con `cmp` igual y se repitieron con un texto único. M6 se repitió sin `[disabled]` en el `<div>` para reproducir el código anterior.

| Mutación | Qué se rompió | Pruebas que fallan | Resultado |
|---|---|---|---|
| M1 | sin la comprobación del código repetido | `un código que ya está en la lista no llama al backend` | 1 FAILED, 28 SUCCESS |
| M2 | sin la comprobación `.docx` de la fila | `un archivo que no es .docx no hace ninguna petición…` | 1 FAILED, 28 SUCCESS |
| M3 | sin `opener = null` | las pruebas de pestaña de la función compartida, Formatos, Subsanación y C5 | 4 FAILED, 167 SUCCESS |
| M4 | la URL se pide antes de abrir la pestaña | `abre la pestaña antes de pedir la URL…` y 2 más de la función compartida | 3 FAILED, 6 SUCCESS |
| M5 | sin la comprobación `https` | `URL que no es https…` (Formatos) y 2 de la función compartida | 3 FAILED, 35 SUCCESS |
| M6 | Subsanación vuelve al `<div (click)>` | `es un <button type="button">`, `Descargando… y deshabilitado mientras espera` | 2 FAILED, 10 SUCCESS |
| M7 | `admin/templates` no lleva a Formatos | `/dashboard/admin/templates lleva a /configuracion/formatos` | 1 FAILED, 54 SUCCESS |
| M8 | Formatos con `USUARIOS_VER` | las 4 de `F08 D1: /configuracion/formatos` | 4 FAILED, 51 SUCCESS |
| M9 | Formatos descarga sin la función compartida (`window.open(url)` después de la respuesta) | 4 de `descargar con la función compartida` | 4 FAILED, 25 SUCCESS |
| M10 | lo mismo en Subsanación | 3 de `F08 D9` | 3 FAILED, 9 SUCCESS |
| M11 | lo mismo en `nuevo-protocolo` (C5) | 15 de C5 | 15 FAILED, 106 SUCCESS |
| M12 | la fila no cambia después de subir | `si la recarga falla después de subir…` | 1 FAILED, 28 SUCCESS |
| M13 | el botón de secciones no vuelve si la navegación falla | `si la navegación no se completa, Formatos vuelve a quedar marcado` | 1 FAILED, 28 SUCCESS |

- **CF1, `code-review` (medium, 7 hallazgos):** corregidos 4. El botón de secciones quedaba marcado si la navegación fallaba (`linkedSignal`, M13). Si la recarga fallaba después de subir o crear, la fila no reflejaba el aviso (la fila cambia en la lista a la vista, M12). El cursor saltaba al final al pasar el código a mayúsculas. `subir()` usa operadores de rxjs. Descartados 3. Las secciones sin mirar el permiso: la matriz de roles es fija y la SECRETARIA tiene `USUARIOS_VER` y `CONFIG_PLANTILLAS` (`1880000000000-FixedRolesMatrix.ts:114,123`). El código repetido con una lista vieja: es el límite de D7, cubierto por el 409 de la tarea del backend. La pestaña bloqueada con el texto genérico: lo fija D6. El código ya no quita los caracteres no permitidos como el `onCodeInput` viejo: se muestra el error del patrón (D7).
- **CF1, Paso 0 (17/11/2026, `dev` `685914a` con C5 mergeada; backend en solo lectura, `dev` `e0c5dec`):** línea base en `%TEMP%\...\scratchpad\cf1-base-20261117-0746`: `tsc` app y spec exit 0; `npx eslint "src/**/*.ts"` 0 errores y 68 avisos; `ng test` completo `TOTAL: 1360 SUCCESS`; `ng build --configuration production` exit 0 con 19 avisos. Aviso previo en los archivos de CF1: `subsanacion.page.ts:41` (`ProtocolDocumentHistoryEntry` sin usar). `TemplateManagementPage` (1499 líneas, plantilla y estilos en el `.ts`, sin `OnPush`) no tenía prueba propia (solo `route-roles.spec.ts:90`); tenía 57 colores hexadecimales, gradientes, animaciones, Bootstrap y estilos en línea, y dos `window.open` al backend sin token (`template-management.page.ts:1491,1495`), como `subsanacion.page.ts:1450,1458`. No hay canvas de la pantalla en el repo. Formatos en la base: `RESPUESTA_OBSERVACIONES` (`1795000000000-CreateDocumentTemplatesTable.ts:18`) y los 9 de los requisitos (`1950000000000`).
