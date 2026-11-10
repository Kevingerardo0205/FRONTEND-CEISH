# F09 · Investigador: borrador y envío a la Secretaría — plan

**Versión:** 0.1 · **Fecha:** 10/11/2026 · **Spec:** `spec-ui.md` 0.1
**Patrón:** cambio mínimo sobre las pantallas actuales del investigador (README §3 regla 5 y skill `ciclo-tarea-ceish`: se trabaja sobre lo que ya funciona, sin duplicar). No se crea `src/features/<sección>/`: el flujo vive hoy en `features/investigador`, `features/evaluations` (subsanación), `features/protocols` (espacio actual), `shared/utils` e `infrastructure/interceptors`, y se corrige ahí.
**Forma de trabajo:** Codex escribe el código de cada T## con el brief que prepara Claude; Claude hace el Paso 0, revisa el diff (con `code-review`), corre las mutaciones, la verificación doble y los commits. Codex no ejecuta git ni toca `specs/`, `package*.json`, `src/environments/` ni `.env*`.

---

## 1. Archivos por capa

| Capa | Acción | Archivo | Qué | Tarea |
|---|---|---|---|---|
| infrastructure | MODIFICAR | `src/infrastructure/interceptors/error.interceptor.ts` + spec | Rama del 409 (`:129-137`): `error.error?.message` → `this.nestedErrorMessage(error.error)` (`:189-198`, ya une arreglos con `"; "`, `:195`) → texto genérico actual. Conserva `type: 'CONCURRENCY_ERROR'` y `status: 409` (los leen `evaluation-form.page.ts:1925,2089` y `resolution-generator.page.ts:595`) | T09-1 |
| shared/utils | MODIFICAR | `src/shared/utils/protocol-ui.util.ts`; CREAR `protocol-ui.util.spec.ts` | Etiquetas de los valores del backend que no están en `EstadoCatalog`, consultadas **antes** de `resolveEstado`: `BORRADOR` → `Borrador` (`pending`); `EVALUACION_SUBSANACIONES` → `Correcciones sin enviar` (`pending`). No se toca `estado.alias.ts` (el alias `BORRADOR → INICIADO` lo siguen usando `canSubirCorrecciones` y las acciones del espacio) | T09-2 |
| presentation | MODIFICAR | `nuevo-protocolo.page.ts`, `nuevo-protocolo.page.html`, `nuevo-protocolo.page.spec.ts` | `onEnviarFinal` (`.ts:478-523`): aviso `Protocolo enviado a la Secretaría.` sin código (quita `:505-509`), navega a `/dashboard/investigador/mis-protocolos` (`:513`), en error muestra `extractApiErrorMessage(err, 'No se pudo enviar el protocolo a la Secretaría.')` (`shared/utils/api-error-message.util.ts:13-25`). Botón: `Enviar a la Secretaría` (`.html:330`) | T09-3 |
| presentation | MODIFICAR | `mis-protocolos.page.ts`; CREAR `mis-protocolos.page.spec.ts` | Botón `Continuar` solo si `p.estado === 'BORRADOR'`, `aria-label="Continuar borrador: {título}"`, `routerLink` a `/dashboard/investigador/nuevo-protocolo` con `queryParams: { borrador: p.id }` | T09-4 |
| presentation | MODIFICAR | `nuevo-protocolo.page.ts` (+ `.html` si hace falta) y su spec | `?borrador={id}` (entero > 0): no llama a `guardarProtocoloInicial`; fija `protocolId`, carga `getChecklist(id)` y `processRequirements`, marca el paso 1 como completado y no editable y abre el paso 2. Error al cargar: aviso con `extractApiErrorMessage` y vuelta a Mis protocolos | T09-4 |
| presentation | MODIFICAR | `protocol-workspace.component.ts` (`:548-553`), `tabs/protocol-detail-tab.component.ts` (`isEditable`, `:569-580`); CREAR los specs mínimos de esas dos condiciones | Sin `EDIT_PROTOCOL` / `Completar / Editar Datos` cuando `p.status` es `BORRADOR` (D4). INCOMPLETO y REQUIERE_SUBSANACION_DOC sin cambios (su ruta rota es P5 de la spec) | T09-4 |
| presentation | MODIFICAR | `subsanacion.page.ts` (`:1271-1276`) + `subsanacion.page.spec.ts` | Aviso de error con `extractApiErrorMessage(err, '❌ Error al enviar la subsanación final.')` | T09-5 |
| application (servicio actual) | MODIFICAR | `protocolo.service.ts` (`:318`, y `:42-56` tipo `RawBackendProtocol.version`); CREAR `protocolo.service.spec.ts` | `versionNumber` desde `versionNumber` numérico o, si no, desde `version` `"N.0"` → `N`; texto no numérico → 1. Tipo de `version`: `string \| number` | T09-6 |
| presentation + infra | — | `editar-protocolo.page.ts`, `protocolo.service.ts:472-477` | `PUT` → `PATCH` y edición solo en borrador | T09-7 (bloqueada, TSK-001.14) |
| presentation | — | `mis-protocolos.page.ts`, `nuevo-protocolo.page.ts` | `Se elimina el…`, `Descartar borrador`, `Nuevo protocolo` deshabilitado con un borrador abierto | T09-8 (bloqueada, TSK-001.11) |

## 2. Rutas

Sin rutas nuevas. `?borrador={id}` es un query param de la ruta existente `nuevo-protocolo` (`investigador.routes.ts:11-18`, `RoleGuard` con `INVESTIGADOR` y `SECRETARIA`). El backend comprueba la propiedad en `submit` (`protocol.controller.ts:263-268`) y el checklist del investigador usa `/protocols/checklist/:id` con su JWT (`protocolo.service.ts:155-157`).

## 3. Mapa de equivalencias (Paso 0, 10/11/2026)

| Pieza | Equivalente existente | Clasificación |
|---|---|---|
| Envío del borrador | `ProtocoloService.finalizarProtocolo` (`protocolo.service.ts:270-279`), ya usado por `nuevo-protocolo.page.ts:502` y `submit-subsanacion.use-case.ts:10` | (c) se reutiliza; no se crea otro servicio ni port |
| Lector del mensaje del backend en el interceptor | `nestedErrorMessage` (`error.interceptor.ts:189-198`) | (c) se reutiliza en la rama del 409 |
| Mensaje de error en una pantalla | `extractApiErrorMessage` (`shared/utils/api-error-message.util.ts:13-25`), ya usado en `modal-reasignacion.component.ts` y `reassignment.page.ts` | (c) se reutiliza |
| Etiqueta del estado | `ProtocolUI` (`protocol-ui.util.ts:27-38`) y pipes `protocolStatusLabel`/`protocolStatusClass` | (c) se extiende |
| Paso de documentos y envío | paso 2 de `nuevo-protocolo` (`.html:157-340`) | (c) se reutiliza para `Continuar` (D4); no se crea pantalla nueva |
| Edición del borrador | `editar-protocolo.page.ts` con `PUT` | se corrige en T09-7 |
| Código muerto (spec-ui P3) | — | tarea de retiro aparte (D1) |

## 4. Seguridad (angular-security)

- Todos los mensajes del backend se muestran como texto en `MatSnackBar` (sin `innerHTML`).
- `?borrador` se convierte con `Number()` y se acepta solo un entero > 0; cualquier otro valor se trata como ausente (flujo normal de creación).
- No se guarda nada nuevo en `localStorage`.

## 5. Accesibilidad (ui-ux-pro-max / impeccable; manda el repo cuando choca)

- El chip lleva el texto del estado; el color no es la única señal (F09-1).
- `Continuar` tiene nombre accesible que empieza por el texto visible (`Continuar borrador: {título}`).
- El aviso de error no se cierra solo antes de poder leerlo (se mantiene `duration` de 5000 ms o más, o el botón `Cerrar`).

## 6. Pruebas

| Capa | Archivo | Qué prueba |
|---|---|---|
| infrastructure | `error.interceptor.spec.ts` | 409 con el cuerpo real del backend (mensaje literal de `protocols.service.ts:117`), con arreglo, sin mensaje y el cuerpo plano actual (`:172-184`) |
| shared/utils | `protocol-ui.util.spec.ts` (nuevo) | `BORRADOR`, `EVALUACION_SUBSANACIONES`, y que `INICIADO`, `PENDIENTE_SUBSANACION`, `EN_REVISION_SECRETARIA` y `undefined` no cambian |
| presentation | `nuevo-protocolo.page.spec.ts` | Envío: aviso, navegación, error con el mensaje del backend, texto del botón; `?borrador`: no crea, carga el checklist, abre el paso 2 |
| presentation | `mis-protocolos.page.spec.ts` (nuevo) | Chip `Borrador`; `Continuar` solo en borrador y con su enlace |
| presentation | specs de `protocol-workspace` y `protocol-detail-tab` (nuevos, mínimos) | Sin `Completar / Editar` en `BORRADOR`; con `INCOMPLETO` sigue |
| presentation | `subsanacion.page.spec.ts` | Error del envío con el mensaje del backend |
| application | `protocolo.service.spec.ts` (nuevo) | `misProtocolos` con `version: "1.0"` → `versionNumber: 1`; `"2.0"` → 2; sin versión → 1 |

## 7. Pantallas actuales a verificar en cada PR

1. INVESTIGADOR: crear un protocolo, subir los documentos obligatorios y enviar → aviso `Protocolo enviado a la Secretaría.` y Mis protocolos con `Revisión Secretaría`.
2. INVESTIGADOR: crear un protocolo y salir después del paso 1 → Mis protocolos con `Borrador` y `Continuar` (desde T09-2/T09-4).
3. INVESTIGADOR: enviar dos veces el mismo protocolo (dos pestañas) → la segunda muestra el mensaje del backend `El protocolo no se puede enviar en su estado actual…` (desde T09-3).
4. INVESTIGADOR con una subsanación en curso → chip `Correcciones sin enviar` y `Subir correcciones` (desde T09-2).
5. SECRETARIA: `/pendientes` y `/protocolos` siguen igual (el borrador no aparece; RF-02.3 b).

## 8. Duplicados temporales

Ninguno: F09 no crea piezas que dupliquen otras. El código muerto anotado en `spec-ui.md` P3 va a la tarea de retiro (D1).
