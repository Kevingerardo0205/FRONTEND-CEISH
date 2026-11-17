# F08 · Configuración — spec-ui

**Versión:** 0.2 · **Fecha:** 17/11/2026 · **Rama:** `feat/f08-cf1-formatos`
**Historial:**
- 0.1 (17/11/2026) Paso 0 de CF1 (frontend `dev` `685914a`, con C5 de F09 mergeada; backend en solo lectura, `dev` `e0c5dec`, leído con `git show dev:<ruta>`) y decisiones de la usuaria del 17/11/2026: D1 (ruta `/configuracion/formatos` y la vieja redirige), D2 (`ButtonGroup` `Usuarios · Formatos`), D3 (nombre y subtítulo), D4 (lista de formatos), D5 (subir o cambiar el archivo), D6 (descargar con la función compartida), D7 (nuevo formato y código repetido), D8 (lo que se quita), D9 (la descarga de `subsanacion`), D10 (lo que espera al backend). La tarea CF1 venía anotada en `specs/F09-investigador-borrador-envio/tasks.md` (Paso 0 de C5) y pasa a esta spec.
- 0.2 (17/11/2026) CF1 hecha. Ajustes del `code-review` dentro de D2, D5 y D7: el botón de secciones vuelve a la página abierta si la navegación no se completa; después de subir o crear, la fila cambia en la lista a la vista antes de la recarga; el cursor del código no se mueve al pasar a mayúsculas.

**Cubre:** la sección `Configuración` de la Secretaría (`specs/README.md` §4, F08): por ahora solo `Formatos` (CF1). Plazos y reportes quedan para otras tareas de F08.
**Depende de:** F00 (tokens, `AppShell`, `PageHeader`, `ButtonGroup`, `StatusChip`, estados) y F10 (menú por rol: `Configuración` ya está en el menú de la SECRETARIA).
**Canvas:** el canvas `Configuracion` del proyecto solo trae, en `Listas`, la entrada `Plantillas de cartas y oficios` con su cantidad; no hay diseño de la pantalla por dentro. No está en el repo. La referencia es la descripción de D4 a D8.

---

## 1. Alcance y roles

Que la Secretaría encuentre los formatos desde `Configuración`, vea cuáles tienen archivo, suba o cambie el `.docx` de cada uno, lo descargue con la sesión iniciada y registre un formato nuevo.

**Solo rol activo `SECRETARIA` con el permiso `CONFIG_PLANTILLAS`** (el backend se lo da solo a la SECRETARIA: `1880000000000-FixedRolesMatrix.ts:123`; el PRESIDENTE no tiene ningún `CONFIG_*`). Se trabaja sobre la pantalla que ya existe (`TemplateManagementPage`, `src/features/dashboard/presentation/pages/template-management/`), sin crear una sección nueva en `src/features/`.

**No incluye:**
- activar o desactivar un formato: el backend no tiene endpoint (D10);
- validar en el backend el tipo, el tamaño o el código repetido (D10, tarea del backend en `tasks.md`);
- un límite de tamaño en el frontend (decisión de la usuaria: el backend no tiene);
- plazos, reportes y el rediseño de `Usuarios` (solo recibe el `ButtonGroup` de D2).

## 2. Decisiones de esta spec

| # | Decisión | Estado |
|---|---|---|
| D1 | **Ruta.** `/configuracion/formatos`, hija de `configuracion` (`app.routes.ts`), con `canActivate: [RoleGuard, AuthGuard]` y `data: { roles: ['SECRETARIA'], permissions: ['CONFIG_PLANTILLAS'] }`, como `/configuracion/usuarios`. `/dashboard/admin/templates` redirige a `/configuracion/formatos`. `/configuracion` sigue redirigiendo a `/configuracion/usuarios`. El menú no cambia: `Configuración` sigue siendo una sola entrada | Decidida (usuaria, 17/11/2026) |
| D2 | **Secciones.** Un `ButtonGroup` `Usuarios · Formatos` (`aria-label` `Secciones de Configuración`) arriba de las dos páginas (`UserManagementPage` incluida); el botón de la página abierta queda activo y el otro navega a su ruta. En `UserManagementPage` no cambia nada más | Decidida (usuaria, 17/11/2026) |
| D3 | **Nombre.** `PageHeader` con el título `Formatos` y el subtítulo `Documentos que el investigador descarga desde su lista de requisitos.` | Decidida (usuaria, 17/11/2026) |
| D4 | **Lista de formatos** (`GET /documents/templates`, solo los activos). Tabla con encabezados de columna `Código`, `Nombre`, `Archivo` y `Acciones`. `Archivo`: `StatusChip` verde `Con archivo` si el formato trae `filePath`, gris `Sin archivo` si no. **Estados:** cargando → `LoadingState` `Cargando los formatos…`; error → `ErrorState` `No pudimos cargar los formatos.` con `Reintentar`; vacía → `EmptyState` `Todavía no hay formatos.`. Después de subir un archivo o crear un formato la lista se vuelve a pedir sin quitar la que está a la vista | Decidida (usuaria, 17/11/2026) |
| D5 | **Subir o cambiar el archivo.** Botón `Subir archivo` (sin archivo) o `Cambiar archivo` (con archivo), con `aria-label` `Subir archivo de {nombre}` / `Cambiar archivo de {nombre}`; mientras sube dice `Subiendo…` y queda deshabilitado. Solo se acepta un nombre que termina en `.docx` (sin importar mayúsculas); si no, `El archivo debe estar en formato Word (.docx).` en la fila, sin ninguna petición. La subida usa `UploadTemplateFileUseCase` (URL firmada, `PUT` al almacenamiento y `POST /documents/templates/:code/file`). Si falla, o termina sin respuesta: `No pudimos subir el archivo. Intente de nuevo.`. Si sale bien: `Archivo de {nombre} actualizado.` en un `role="status"`. Los errores de la fila van en un `role="alert"` unido al botón con `aria-describedby`. Sin límite de tamaño | Decidida (usuaria, 17/11/2026) |
| D6 | **Descargar.** Botón `Descargar` solo si el formato tiene archivo (`aria-label` `Descargar {nombre}`), con `Descargando…` mientras espera. Usa la función compartida `abrirEnPestana` (`src/shared/utils/descarga-en-pestana.util.ts`) con `IDocumentRepositoryPort.downloadTemplate`: la misma técnica de F09 D28 (pestaña abierta en el clic antes de pedir la URL, `opener = null`, solo `https:` o `http:` con `localhost`/`127.0.0.1`, la pestaña se cierra si falla la petición o la comprobación, la URL nunca se guarda). Textos: 404 → `Este formato no está disponible.`; cualquier otro error, una URL que no pasa la comprobación o una pestaña que el navegador no abre → `No pudimos descargar el formato. Intente de nuevo.`. No se muestra el mensaje del backend. **La función compartida** reemplaza el código de C5 en `nuevo-protocolo` (F09 D28), que pasa a usarla sin cambiar lo que comprueban sus pruebas. Se quitan los dos `window.open` al backend sin token | Decidida (usuaria, 17/11/2026) |
| D7 | **Nuevo formato.** Botón `Nuevo formato` (con `aria-expanded`) que abre un formulario debajo de la lista, sin modal: `Código` (obligatorio, solo `A-Z`, `0-9` y `_`, se pasa a mayúsculas; ayuda `Solo mayúsculas, números y guion bajo (_).`; máximo 100 caracteres, el largo de la columna `codigo`), `Nombre` (obligatorio, máximo 200, la columna `nombre`) y `Archivo (.docx, opcional)`. Botones `Guardar formato` (`Guardando…` mientras guarda) y `Cancelar` (cierra y vacía el formulario). Errores de los campos: `El código es obligatorio.`, `Solo mayúsculas, números y guion bajo (_).`, `El nombre es obligatorio.`, `El archivo debe estar en formato Word (.docx).`. **Código repetido:** antes de llamar al backend se compara con la lista cargada; si ya existe, `Ya existe un formato con el código {código}.` y no se hace ninguna petición (el backend cambiaría el nombre sin avisar, `documents.service.ts:108-119`). Se crea con `CreateTemplateUseCase` (solo los metadatos) y, si se eligió archivo, se sube después con `UploadTemplateFileUseCase`. Éxito: `Formato {nombre} guardado.` (`role="status"`); error al crear: `No pudimos guardar el formato. Intente de nuevo.`; creado pero falla la subida: `Guardamos el formato {nombre}, pero no pudimos subir el archivo. Súbalo desde la lista.` (los dos últimos textos de éxito y de subida fallida son propuesta de Claude dentro de D7) | Decidida (usuaria, 17/11/2026) |
| D8 | **Se quita:** las 3 tarjetas de números, el buscador, la columna de la ruta interna del archivo, el arrastrar y soltar, la miga propia (`Administración / Plantillas`), la mención a Cloudflare R2, los snackbars con emoji, los gradientes, las animaciones, los colores fijos, Bootstrap y los estilos en línea. La página pasa a `.html` y `.scss` propios con `OnPush` y solo los tokens de F00 | Decidida (usuaria, 17/11/2026) |
| D9 | **Subsanación** (`subsanacion.page.ts`): el `<div (click)>` de `Formato de Respuestas a Evaluadores` pasa a `<button type="button">` con la descarga de D6 (código `RESPUESTA_OBSERVACIONES`) y su error en la misma tarjeta (`role="alert"` unido al botón). No cambia nada más de esa página | Decidida (usuaria, 17/11/2026) |
| D10 | **Espera al backend** (tarea `Por hacer` en `tasks.md`): DTO de validación al crear formatos (hoy `{ code, name }` sin validar), 409 por código repetido, tipo `.docx` y tamaño máximo al subir (`POST /storage/upload-url` solo pide `key` y `contentType`), y activar o desactivar un formato (el campo `activo` existe, sin endpoint) | Decidida (usuaria, 17/11/2026) |

## 3. Pantallas y navegación

- `/configuracion` → `/configuracion/usuarios` (`UserManagementPage`, `USUARIOS_VER`), sin cambios salvo el `ButtonGroup` de D2.
- `/configuracion/formatos` → `TemplateManagementPage` (`CONFIG_PLANTILLAS`), D1 a D8.
- `/dashboard/admin/templates` → redirige a `/configuracion/formatos`.

## 4. Estados de cada pantalla

| Pantalla | Cargando | Vacío | Error | Éxito |
|---|---|---|---|---|
| Formatos, lista (D4) | `LoadingState` `Cargando los formatos…` (solo si todavía no hay lista) | `EmptyState` `Todavía no hay formatos.` | `ErrorState` `No pudimos cargar los formatos.` con `Reintentar` | la tabla |
| Formatos, fila (D5, D6) | `Subiendo…` / `Descargando…` | — | `role="alert"` en la fila | `Archivo de {nombre} actualizado.` (`role="status"`) |
| Formatos, nuevo (D7) | `Guardando…` | — | errores de los campos; `Ya existe un formato con el código {código}.`; `No pudimos guardar el formato. Intente de nuevo.` | `Formato {nombre} guardado.` |
| Subsanación, formato de respuesta (D9) | `Descargando…` | — | `role="alert"` en la tarjeta | la pestaña con el archivo |

## 5. Interacciones y acción principal

- Acción principal: `Subir archivo` / `Cambiar archivo` de cada fila; `Nuevo formato` abre el formulario.
- La descarga abre la pestaña en el mismo clic (D6); el navegador no la bloquea.
- Un segundo clic mientras sube, descarga o guarda no hace otra petición (botón deshabilitado).

## 6. Endpoints

| Endpoint | Estado | Evidencia (backend `dev` `e0c5dec`) |
|---|---|---|
| `GET /documents/templates` | existe | `documents.controller.ts:38-42`; solo sesión; solo los activos (`documents.service.ts:48-50`); campos `id`, `code`, `name`, `filePath`, `isActive`, `createdAt`, `updatedAt` (`document-template.entity.orm.ts`) |
| `POST /documents/templates` | existe, sin validación | `documents.controller.ts:59-66`, `CONFIG_PLANTILLAS`; `{ code, name }` sin DTO; con un código que ya existe cambia el nombre (`documents.service.ts:108-119`); columnas de 100 y 200 caracteres |
| `POST /storage/upload-url` | existe, sin validación de tipo ni tamaño | `storage.controller.ts:23-44`; solo sesión; pide `key` y `contentType` |
| `POST /documents/templates/:code/file` | existe | `documents.controller.ts:69-79`, `CONFIG_PLANTILLAS`; 404 si el formato no existe o está inactivo |
| `GET /documents/templates/:code/download` | existe | `documents.controller.ts:44-57`; `{ downloadUrl }` (900 s) dentro de `{ data }`; 404 sin archivo |
| activar o desactivar | **FALTA** | sin endpoint (D10) |

## 7. Criterios de aceptación (EARS)

- **F08-1 (D1, D2):** **cuando** la SECRETARIA con `CONFIG_PLANTILLAS` abra `/configuracion/formatos`, la pantalla **debe** mostrar `Formatos` con el `ButtonGroup` `Usuarios · Formatos`; **si** no tiene `CONFIG_PLANTILLAS`, **no debe** entrar; `/dashboard/admin/templates` **debe** llevar a `/configuracion/formatos`.
- **F08-2 (D4):** cada formato **debe** mostrar su código, su nombre y `Con archivo` o `Sin archivo`; la pantalla **no debe** mostrar la ruta interna del archivo.
- **F08-3 (D5):** **si** el archivo elegido no termina en `.docx`, la pantalla **no debe** hacer ninguna petición y **debe** mostrar `El archivo debe estar en formato Word (.docx).` en la fila.
- **F08-4 (D6):** `Descargar` **debe** abrir la pestaña en el clic antes de pedir la URL, con `opener` en `null`, y llevarla solo a una URL `https:` (o `http:` local); **si** falla, **debe** cerrar la pestaña y mostrar el texto de D6. Ninguna pantalla **debe** abrir `/documents/templates/{code}/download` sin la sesión.
- **F08-5 (D7):** **si** el código ya está en la lista, la pantalla **debe** mostrar `Ya existe un formato con el código {código}.` y **no debe** llamar al backend.
- **F08-6 (D9):** en Subsanación, `Formato de Respuestas a Evaluadores` **debe** ser un `<button type="button">` que descarga con D6.

## 8. Pendientes

| # | Qué | Estado |
|---|---|---|
| P1 | Validaciones y activar o desactivar en el backend (D10) | Tarea del backend `Por hacer` en `tasks.md` |
| P2 | Plazos y reportes de F08 | Sin tarea todavía |
