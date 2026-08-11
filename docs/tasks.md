# 📋 Lista de Tareas Paso a Paso (Tasks)

Este documento detalla la planificación y la ruta de desarrollo paso a paso para completar la implementación de la **Iteración 2** en el frontend de CEISH Espoch.

---

## 📅 Fase 1: Actualización de Modelos y Servicios de Infraestructura

* [ ] **Tarea 1.1: Revisión y Alineación de Entidades**
  * Verificar que `src/domain/entities/protocol.entity.ts` contenga `ProtocolVersionEntity` y los campos de versión necesarios.
  * Modificar `src/domain/entities/resolution.entity.ts` para adaptarlo a la simplificación de estados (tipo 1, 2, 3) y observaciones divididas.
* [ ] **Tarea 1.2: Implementación de Mapeadores de Red (Mappers)**
  * Crear o adaptar el mapper correspondiente para convertir el payload JSON del backend a la entidad de dominio `ResolutionEntity` e integrar los campos de observaciones mayores/menores y procedimiento de subsanación.
* [ ] **Tarea 1.3: Actualización del Servicio Angular (`FrontendResolutionsService`)**
  * Añadir en la capa de infraestructura o servicio de feature la interfaz `CreateResolutionPayload` con los atributos definidos en el plan de integración.
  * Implementar los métodos HTTP `createResolution(payload)` y `getResolutionsByProtocol(protocolId)`.

---

## 🖋️ Fase 2: Componente de Emisión de Resoluciones (Comité/Secretaría)

* [ ] **Tarea 2.1: Depuración del Selector de Tipo de Resolución**
  * En la vista de creación de resolución, eliminar la opción `4` (`PENDIENTE_SUBSANACION`) de todos los selectores.
* [ ] **Tarea 2.2: Campos Condicionales de Observación**
  * Implementar lógica reactiva para que, al seleccionar el tipo `2` (`APROBADO_CON_OBSERVACIONES`), se muestren y validen dinámicamente los campos:
    * Observaciones Mayores (Textarea con validación de campo requerido).
    * Observaciones Menores (Textarea).
    * Procedimiento de Subsanación (Textarea con validación de campo requerido).
* [ ] **Tarea 2.3: Control de Errores de Concurrencia (HTTP 409)**
  * Agregar bloque `catchError` o lógica de error en la suscripción del guardado de resolución.
  * Si el código de estado HTTP retornado es `409`, disparar un modal UI informando que el protocolo ha sido versionado o modificado concurrentemente y deshabilitar el botón de guardar hasta recargar la vista.

---

## 🧑‍🔬 Fase 3: Detalle del Investigador y Carga de Subsanaciones (V2.0+)

* [ ] **Tarea 3.1: Detección del Estado de Subsanación en Vistas**
  * Implementar una directiva o helper de vista para detectar si un protocolo cumple la condición de subsanación:
    * Estado del protocolo = `21` (`EN_CONTROL_DOCUMENTAL`).
    * Estado de recepción asociada = `9` (`INICIADO`).
  * Mostrar una etiqueta prominente en la interfaz que diga: **"Fase de Carga de Nueva Versión (Subsanación V2.0)"**.
* [ ] **Tarea 3.2: Bloqueo de Requisitos Aprobados (Inmutabilidad)**
  * Recorrer el listado de requisitos y condicionar la visualización del control de subida de archivos (Drag & Drop o input file).
  * Si un documento tiene estado `APROBADO` o `NO_APLICA`, deshabilitar la edición e impedir una nueva subida, mostrando únicamente un botón para descargar el archivo previamente aprobado.
* [ ] **Tarea 3.3: Habilitación de Requisitos Observados**
  * Para documentos que se encuentren en estado `NO_PRESENTADO` tras el reseteo, renderizar activamente el control de carga.
* [ ] **Tarea 3.4: Llamada de Red para Envío de Archivo**
  * Conectar el control de carga al endpoint `POST /api/protocols/:id/upload-document` enviando el `requirementCode` y el archivo correspondiente.

---

## 🏢 Fase 4: Bandejas de Entrada y Control Documental (Secretaría)

* [ ] **Tarea 4.1: Actualización de Filtros del Dashboard**
  * Configurar la bandeja de entrada para que los protocolos en estado `21` (`EN_CONTROL_DOCUMENTAL`) se listen en la sección de pendientes de validación de la secretaria.
* [ ] **Tarea 4.2: Visualizador del Número de Versión**
  * Renderizar la versión del protocolo en la lista del dashboard y en la cabecera del detalle para diferenciar visualmente expedientes en V1.0 de aquellos en V2.0+.

---

## ⏳ Fase 5: Trazabilidad y Línea de Tiempo Histórica

* [ ] **Tarea 5.1: Renderizado del Historial de Versiones**
  * Consumir el array `versions` del protocolo en el componente de línea de tiempo (`TimelineComponent`).
* [ ] **Tarea 5.2: Apertura de Observaciones de Versiones Anteriores (Estado 19)**
  * Capturar el evento click sobre los hitos de la línea de tiempo que representen un estado `19` (`REQUIERE_SUBSANACION_VERSION`).
  * Levantar un modal o panel lateral que recupere y renderice las observaciones mayores, menores y el procedimiento de subsanación que fueron registrados en esa versión histórica específica.
