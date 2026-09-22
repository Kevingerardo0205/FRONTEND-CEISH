# ❓ Preguntas y Puntos por Aclarar (Clarify)

Este documento recopila las dudas técnicas, arquitectónicas y de diseño de experiencia de usuario (UX) identificadas durante la planificación de la **Iteración 2**. Estas dudas deben resolverse para asegurar una implementación alineada con las expectativas del negocio.

---

## 🎨 1. Dudas sobre Experiencia de Usuario (UX/UI)

1. **Diseño del Diálogo de Conflicto de Concurrencia (HTTP 409):**
   * *Pregunta:* Cuando ocurra un conflicto de concurrencia al guardar una resolución, ¿es suficiente mostrar un modal informativo con un botón de "Aceptar y Recargar", o deberíamos intentar recargar los datos en segundo plano y notificar al usuario mediante un Toast interactivo?
   * *Recomendación:* Se propone un modal bloqueante que impida al usuario continuar con datos obsoletos, ofreciendo un botón prominente para "Recargar Expediente".

2. **Visualización de Documentos Históricos Inmutables:**
   * *Pregunta:* En la bandeja del investigador para la versión 2.0+, los archivos aprobados en V1.0 son de solo lectura. ¿Cómo deben visualizarse? ¿Se debe deshabilitar por completo el input de carga y mostrar un botón para descargar el archivo previamente aprobado, o simplemente ocultar la opción de carga?
   * *Recomendación:* Mantener la fila del documento visible, con un icono de candado verde o check de "Aprobado en V1.0", y un botón para visualizar/descargar el archivo existente.

3. **Interactividad de la Línea de Tiempo Histórica:**
   * *Pregunta:* Al hacer clic en un estado de versión anterior (ej. Estado `19` - Requiere Subsanación) en la línea de tiempo, ¿los detalles de observaciones y resoluciones pasadas se deben abrir en un modal lateral (Drawer), en un modal central, o expandirse como acordeón dentro de la misma línea de tiempo?

---

## 🛠️ 2. Inconsistencias de Modelos y Tipos de Datos

1. **Mapeo de Tipos de Resolución:**
   * *Duda:* El archivo `resolutions.service.ts` define `resolutionTypeId: number` (1 = Aprobado, 2 = Aprobado con Observaciones, 3 = Rechazado), mientras que la entidad de dominio `ResolutionEntity` utiliza `resolutionType: 'APPROVAL' | 'CONDITIONAL' | 'REJECTION' | 'EXEMPTION'`.
   * *Pregunta:* ¿El backend espera el ID numérico (`resolutionTypeId`) o el string tipado (`resolutionType`)? ¿Existe un mapeador (`resolution.mapper.ts`) que realice esta conversión antes del envío HTTP?

2. **Formato de Números de Versión:**
   * *Duda:* En la entidad del protocolo, `version` está definida como `number | string`.
   * *Pregunta:* ¿El backend maneja las versiones de forma numérica correlativa (`1`, `2`, `3`) o incluye prefijos/sufijos string (`"1.0"`, `"2.0"`)? Esto influye en la lógica de concatenación en las bandejas de visualización de secretaría.

---

## 🔌 3. Dudas sobre endpoints y APIs

1. **Endpoint de Carga de Subsanaciones (`POST /api/protocols/:id/upload-document`):**
   * *Pregunta:* ¿Este endpoint requiere parámetros adicionales como el número de versión actual del protocolo, o el backend asume la versión de forma automática basándose en el estado actual del expediente?
   * *Pregunta:* ¿Cuál es el formato esperado para el payload? (¿Multipart/form-data con clave `file` y `requirementCode` en el body, o campos JSON?).

2. **Estrategia de Mocking (Local Storage):**
   * *Pregunta:* Actualmente, la capa de infraestructura tiene repositorios que mockean datos en `localStorage`. ¿Debemos extender estos mocks locales para simular el ciclo de vida del versionamiento y la respuesta HTTP 409 para pruebas de desarrollo local?
