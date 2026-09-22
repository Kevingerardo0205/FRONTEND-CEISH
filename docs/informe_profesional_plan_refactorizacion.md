# Informe Profesional del Plan de Refactorización y Corrección

## Proyecto

**Sistema:** CEISH Espoch Frontend  
**Tecnología:** Angular 20, TypeScript 5.9, RxJS, Angular Material y Jasmine/Karma  
**Fecha del informe:** 24 de agosto de 2026  
**Documento base:** Plan de Alineación con Controles de Calidad Obligatorios  
**Alcance:** Frontend Angular, con dependencias de integración del backend NestJS

---

## 1. Resumen ejecutivo

El proyecto cuenta con los principales flujos funcionales de autenticación, registro de protocolos, control documental, evaluación por pares y emisión de resoluciones. Sin embargo, el análisis técnico identificó riesgos de arquitectura, seguridad, mantenibilidad y cobertura de pruebas que deben ser corregidos antes de la presentación final.

Los hallazgos principales son:

- Inyección directa de repositorios de dominio en componentes visuales.
- Persistencia insegura de archivos PDF como Base64 en `localStorage`.
- Datos mockeados dentro de páginas que deberían consumir el backend.
- Componentes con exceso de responsabilidad y tamaño.
- Uso extendido de `any` en entidades, formularios, servicios y respuestas HTTP.
- Falta de manejo uniforme de conflictos de concurrencia HTTP 409.
- Necesidad de completar los flujos de subsanación V2.0 e historial de versiones.
- Cobertura y pruebas automatizadas insuficientes para el código existente.
- Advertencias de tamaño de bundle, estilos y dependencias CommonJS.

La refactorización se ejecutará por fases. Cada cambio deberá superar obligatoriamente:

1. **4.1 Pruebas unitarias:** cobertura mínima del 80% en código nuevo o refactorizado.
2. **4.2 Métricas estáticas:** tipado estricto, formato, revisión arquitectónica y control de complejidad.
3. **4.3 QA:** compilación, pruebas funcionales, regresión, seguridad y revisión de cambios.

---

## 2. Estado actual del proyecto

### 2.1 Situación de la Fase 1

La Fase 1 de seguridad de archivos y CV se encuentra completada en el frontend.

Se implementó:

- Eliminación del almacenamiento Base64 del CV en `localStorage`.
- Carga del archivo mediante URL firmada hacia S3/R2.
- Persistencia únicamente de metadatos del archivo.
- Descarga mediante URL temporal.
- Limpieza automática de datos heredados.
- Validación de tipo PDF, archivo vacío y tamaño máximo de 5 MB.
- Servicio independiente y testeable para la lógica del CV.

Archivos relacionados:

- `src/features/dashboard/presentation/pages/profile/profile.page.ts`
- `src/features/dashboard/application/services/profile-cv.service.ts`
- `src/features/dashboard/application/services/profile-cv.service.spec.ts`

Resultados de calidad obtenidos:

- 12 pruebas unitarias exitosas.
- Cobertura del nuevo servicio: 100% en sentencias, ramas, funciones y líneas.
- Compilación de producción exitosa.
- TypeScript estricto aprobado.
- Formato de los archivos nuevos aprobado.

Limitación pendiente: la eliminación actual retira la referencia local del CV. Para eliminar físicamente el archivo remoto se requiere un endpoint backend de eliminación segura en S3/R2.

### 2.2 Hallazgos que permanecen

La finalización de la Fase 1 no elimina los siguientes problemas, que serán tratados en las fases posteriores:

- Bypass de la arquitectura limpia desde las páginas hacia los repositorios.
- Mocks de protocolos en la capa de presentación.
- Componentes grandes y con múltiples responsabilidades.
- Uso de `any` en diferentes features.
- Ausencia de una estrategia uniforme para HTTP 409.
- Inconsistencias en estados de subsanación y documentos inmutables.
- Falta de una cobertura global mínima para las páginas críticas.

---

## 3. Objetivos de la refactorización

### 3.1 Objetivo general

Preparar el frontend CEISH Espoch para una presentación final estable, segura, mantenible y alineada con Clean Architecture, controles de calidad obligatorios y los flujos funcionales definidos para protocolos, resoluciones, evaluación y subsanación.

### 3.2 Objetivos específicos

- Separar la interfaz de usuario de los repositorios y adaptadores.
- Centralizar la lógica de negocio en casos de uso y servicios de aplicación.
- Eliminar la persistencia insegura de archivos en el navegador.
- Implementar tipado estricto en las áreas intervenidas.
- Garantizar el manejo de concurrencia optimista.
- Corregir la lógica de subsanación V2.0.
- Incorporar historial de versiones y observaciones.
- Reducir el tamaño y la complejidad de los componentes.
- Establecer pruebas automatizadas reproducibles.
- Definir puertas de calidad para cada entrega.

---

## 4. Fases de trabajo

## Fase 1. Seguridad de archivos y CV

**Estado:** Completada.

### Alcance

Corregir la persistencia de archivos PDF y CV en `localStorage`.

### Implementación

- Servicio `ProfileCvService`.
- Carga binaria mediante URL firmada.
- Metadatos separados por investigador.
- Limpieza de claves antiguas.
- Descarga mediante URL temporal.
- Validaciones de formato, tamaño y archivo vacío.

### Archivos afectados

- `profile.page.ts`
- `profile-cv.service.ts`
- `profile-cv.service.spec.ts`

### Criterios de aceptación

- No se guarda ningún archivo como Base64.
- Un archivo inválido no genera una llamada de carga.
- Un archivo superior a 5 MB es rechazado.
- Los metadatos se guardan solamente después de una carga exitosa.
- La descarga utiliza una URL firmada.
- Los datos heredados se eliminan automáticamente.

---

## Fase 2. Modelos de dominio y servicios de infraestructura

**Estado:** Pendiente.

### Objetivo

Alinear las entidades del frontend con el modelo de protocolos, versiones y resoluciones utilizado por el backend.

### Actividades

- Revisar `ProtocolEntity`.
- Incorporar `ProtocolVersionEntity`.
- Completar `ResolutionEntity`.
- Agregar campos de observaciones mayores y menores.
- Agregar procedimiento de subsanación.
- Crear o actualizar mappers DTO → dominio.
- Tipar respuestas de resolución.
- Implementar `FrontendResolutionsService`.
- Implementar creación y consulta de resoluciones por protocolo.

### Archivos y módulos previstos

- `src/domain/entities/protocol.entity.ts`
- `src/domain/entities/resolution.entity.ts`
- `src/infrastructure/mappers/`
- `src/infrastructure/services/frontend-resolutions.service.ts`
- `src/features/resolutions/`

### Pruebas obligatorias

- Mapeo de respuestas válidas.
- Mapeo de respuestas incompletas.
- Creación de resolución.
- Consulta por protocolo.
- Errores HTTP 400, 401, 403, 404 y 409.

### Criterios de aceptación

- Las páginas no manipulan respuestas DTO directamente.
- Las entidades no dependen de Angular ni de HttpClient.
- El servicio cuenta con interfaces de entrada y salida.
- Cobertura mínima del 80% en código creado o modificado.

---

## Fase 3. Emisión de resoluciones

**Estado:** Pendiente.

### Objetivo

Corregir el formulario de emisión de resoluciones y eliminar estados obsoletos o inconsistentes.

### Actividades

- Eliminar la opción de resolución tipo 4.
- Mantener tipos 1, 2 y 3.
- Implementar validaciones condicionales para el tipo 2.
- Hacer obligatorias las observaciones mayores.
- Hacer obligatorio el procedimiento de subsanación.
- Mantener observaciones menores como campo opcional.
- Separar formulario, servicio y caso de uso.
- Mostrar mensajes de error claros.

### Archivo prioritario

- `src/features/resolutions/presentation/pages/resolution-generator/resolution-generator.page.ts`

### Componentes y servicios previstos

- `CreateResolutionUseCase`.
- `FrontendResolutionsService`.
- `ConflictDialogComponent`.
- Componente de formulario de resolución.

### Pruebas obligatorias

- Renderizado de campos para tipo 1.
- Renderizado de campos para tipo 2.
- Renderizado de campos para tipo 3.
- Validación de campos requeridos.
- Envío de payload válido.
- Rechazo de payload incompleto.

---

## Fase 4. Concurrencia optimista y HTTP 409

**Estado:** Pendiente y dependiente del backend.

### Objetivo

Evitar que un usuario sobrescriba cambios realizados por otro usuario sobre el mismo protocolo o resolución.

### Frontend

- Actualizar `error.interceptor.ts`.
- Detectar respuestas HTTP 409.
- Convertir el error a `CONCURRENCY_ERROR`.
- Mostrar diálogo bloqueante.
- Informar que el registro fue actualizado por otro usuario.
- Deshabilitar el guardado hasta recargar la información.

### Backend requerido

- Agregar `@VersionColumn()` en la entidad de protocolo.
- Validar la versión recibida por el cliente.
- Lanzar `ConflictException` cuando exista conflicto.
- Agregar pruebas Jest y Supertest.

### Archivos frontend

- `src/infrastructure/interceptors/error.interceptor.ts`
- `src/features/resolutions/`
- `src/features/protocols/`
- `src/shared/components/`

### Pruebas obligatorias

- Interceptor ante HTTP 409.
- Modal de conflicto.
- Bloqueo del formulario.
- Mensaje de recarga.
- Recuperación después de actualizar los datos.

---

## Fase 5. Subsanación V2.0

**Estado:** Pendiente.

### Objetivo

Permitir la carga de nuevos documentos únicamente en los requisitos observados o no presentados.

### Reglas funcionales

- Un requisito aprobado debe permanecer inmutable.
- Un requisito validado debe permanecer inmutable.
- Un requisito `NO_APLICA` no debe permitir carga.
- Un documento con URL válida debe permanecer bloqueado aunque su estado sea `PRESENTADO`.
- Solamente los requisitos `NO_PRESENTADO` deben habilitar carga.

### Actividades

- Detectar fase de subsanación.
- Mostrar etiqueta de nueva versión.
- Bloquear documentos aprobados.
- Habilitar requisitos observados.
- Validar que todos los pendientes estén cargados antes del envío.
- Conectar el upload con `/api/protocols/:id/upload-document`.
- Enviar `requirementCode` y archivo.

### Archivos prioritarios

- `src/features/evaluations/presentation/pages/subsanacion/subsanacion.page.ts`
- `src/features/investigador/presentation/pages/detalle-protocolo/`
- `src/features/investigador/presentation/components/upload-documentos/`
- `src/infrastructure/adapters/protocol-api.adapter.ts`
- `src/features/investigador/application/services/protocolo.service.ts`

### Pruebas obligatorias

- Requisito aprobado no editable.
- Requisito no aplicable bloqueado.
- Requisito observado editable.
- Requisito sin documento habilitado.
- Carga multipart correcta.
- Envío bloqueado si faltan documentos.

---

## Fase 6. Bandejas de Secretaría y control documental

**Estado:** Pendiente.

### Objetivo

Mostrar correctamente los protocolos en control documental y diferenciar sus versiones.

### Actividades

- Incluir estado `EN_CONTROL_DOCUMENTAL` en la bandeja.
- Mostrar número de versión.
- Diferenciar V1.0, V2.0 y posteriores.
- Actualizar filtros.
- Mostrar estado real de requisitos.
- Mantener consistencia entre lista y detalle.

### Archivos prioritarios

- `src/features/protocols/presentation/pages/protocol-validation-list/`
- `src/features/protocols/presentation/pages/protocol-validation-detail/`
- `src/features/dashboard/`
- `src/shared/utils/protocol-ui.util.ts`

### Pruebas obligatorias

- Filtro por estado.
- Filtro por versión.
- Visualización de protocolos en subsanación.
- Consistencia de datos entre bandeja y detalle.

---

## Fase 7. Historial y trazabilidad de versiones

**Estado:** Pendiente.

### Objetivo

Permitir consultar el historial completo de versiones y las observaciones asociadas a cada una.

### Actividades

- Consumir el arreglo `versions`.
- Crear o mejorar la línea de tiempo.
- Mostrar cambios de estado.
- Permitir seleccionar versiones históricas.
- Mostrar observaciones mayores, menores y procedimiento.
- Mostrar fecha y número de versión.

### Componentes previstos

- `TimelineComponent`.
- `HistoricalObservationsDialogComponent`.
- `ProtocolVersionCardComponent`.

### Pruebas obligatorias

- Renderizado de versiones.
- Orden cronológico.
- Selección de estado 19.
- Apertura del diálogo histórico.
- Versión sin observaciones.

---

## Fase 8. Desacoplamiento arquitectónico

**Estado:** Pendiente.

### Problema

Las páginas visuales inyectan directamente puertos de repositorio y llaman métodos de infraestructura. Esto dificulta las pruebas, aumenta el acoplamiento y contradice la separación de capas definida en el proyecto.

### Objetivo

Aplicar el flujo:

```text
Componente visual → Caso de uso → Puerto de dominio → Adaptador HTTP
```

### Actividades

- Crear casos de uso por operación.
- Retirar inyecciones directas de repositorios en componentes.
- Mover lógica de negocio fuera de las páginas.
- Aplicar `takeUntilDestroyed()`.
- Centralizar manejo de errores.
- Mantener Signals únicamente para estado visual.

### Páginas prioritarias

- `protocol-list.page.ts`.
- `protocol-validation-detail.page.ts`.
- `resolution-generator.page.ts`.
- `profile.page.ts`.
- `subsanacion.page.ts`.
- `peer-risk-assessment.page.ts`.
- `evaluation-form.page.ts`.
- `template-management.page.ts`.

### Casos de uso previstos

- `GetProtocolsUseCase`.
- `GetProtocolDetailUseCase`.
- `UpdateRequirementStatusUseCase`.
- `FinalizeProtocolValidationUseCase`.
- `CreateResolutionUseCase`.
- `UploadProtocolDocumentUseCase`.
- `GetProtocolHistoryUseCase`.

### Criterios de aceptación

- Ninguna página nueva inyecta directamente un repositorio.
- Cada operación de negocio tiene un caso de uso identificable.
- Cada caso de uso tiene pruebas unitarias.
- Las páginas solo coordinan estado y presentación.

---

## Fase 9. Eliminación progresiva de `any`

**Estado:** Pendiente.

### Objetivo

Aplicar tipado estricto a las áreas intervenidas y evitar respuestas HTTP sin contrato.

### Áreas prioritarias

- Protocolos.
- Resoluciones.
- Requisitos documentales.
- Evaluaciones.
- Subsanaciones.
- Usuarios y permisos.
- Servicios HTTP.

### Interfaces previstas

- `ProtocolDocument`.
- `ProtocolRequirement`.
- `ResolutionPayload`.
- `ResolutionResponse`.
- `EvaluationAssignment`.
- `ProtocolVersion`.
- `SubsanationRequirement`.

### Criterios de aceptación

- No se agrega ningún `any` nuevo.
- Las respuestas HTTP tienen interfaces.
- Los mappers validan datos externos.
- El código refactorizado supera TypeScript estricto.

---

## Fase 10. Modularización de componentes grandes

**Estado:** Pendiente.

### Objetivo

Reducir el tamaño, acoplamiento y complejidad de las páginas grandes.

### Componentes prioritarios

- `protocol-validation-detail.page.ts`.
- `resolution-generator.page.ts`.
- `profile.page.ts`.
- `subsanacion.page.ts`.
- `template-management.page.ts`.
- `evaluation-form.page.ts`.

### Extracciones previstas

- Encabezados.
- Tablas.
- Formularios.
- Cargadores de archivos.
- Diálogos.
- Estadísticas.
- Generación de PDF.
- Línea de tiempo.
- Acciones de validación.

### Ejemplo de descomposición

Para `protocol-validation-detail.page.ts`:

- `ValidationHeaderComponent`.
- `ValidationChecklistComponent`.
- `ValidationSummaryComponent`.
- `ValidationHistoryComponent`.
- `ValidationActionsComponent`.
- `ProtocolValidationFacade`.

### Criterios de aceptación

- Componentes visuales con responsabilidad única.
- Menor cantidad de lógica de negocio en templates.
- Estilos extraídos cuando corresponda.
- Pruebas independientes para componentes críticos.

---

## Fase 11. Métricas estáticas y optimización

**Estado:** Pendiente.

### Actividades

- Configurar ESLint para Angular.
- Agregar `npm run lint`.
- Validar Prettier.
- Detectar `any`.
- Detectar inyección directa de repositorios.
- Detectar uso de `FileReader` y Base64 para archivos.
- Detectar suscripciones sin limpieza.
- Revisar imports no utilizados.
- Medir tamaño de componentes.
- Revisar bundle inicial.
- Revisar dependencias CommonJS.

### Advertencias actuales

- El bundle inicial supera el presupuesto de 500 kB.
- Existen estilos de componentes por encima del presupuesto de 8 kB.
- Se utilizan dependencias CommonJS como `jspdf-autotable`, `html2canvas`, `dompurify` y `canvg`.

Estas advertencias deben quedar registradas y priorizadas, aunque no bloqueen por sí solas la compilación actual.

---

## Fase 12. QA final y preparación de presentación

**Estado:** Pendiente.

### Pruebas unitarias

- Casos de uso.
- Servicios de infraestructura.
- Mappers.
- Interceptores.
- Componentes críticos.
- Carga y descarga de documentos.
- Manejo de errores.
- Flujos de subsanación.

### QA funcional

- Inicio y cierre de sesión.
- Roles y permisos.
- Registro de protocolo.
- Carga documental.
- Validación por Secretaría.
- Asignación de evaluadores.
- Evaluación por pares.
- Emisión de resolución.
- Subsanación V2.0.
- Historial de versiones.
- Error HTTP 409.
- Descarga de documentos.

### QA técnico

```powershell
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npx tsc --noEmit -p tsconfig.spec.json
npx prettier --check src
npm run lint
```

### Revisión previa a presentación

- Revisión de cambios por otro desarrollador.
- Validación de criterios de aceptación.
- Confirmación de que no existen datos mockeados en flujos productivos.
- Confirmación de que no se almacenan archivos en Base64.
- Confirmación de que los errores 409 son visibles para el usuario.
- Confirmación de que la documentación se encuentra actualizada.

---

## 5. Matriz de controles obligatorios

| Fase | 4.1 Unit Testing | 4.2 Métricas estáticas | 4.3 QA |
|---|---|---|---|
| Fase 1 | Servicio CV al 100% | Sin Base64 funcional, tipado estricto | Build y pruebas exitosas |
| Fase 2 | Entidades, mappers y servicios | Contratos DTO tipados | Integración HTTP simulada |
| Fase 3 | Formulario y caso de uso | Sin lógica de negocio en template | Emisión de resolución |
| Fase 4 | Interceptor y diálogo 409 | Error tipado | Prueba multiusuario |
| Fase 5 | Reglas de subsanación | Estados explícitos | Carga documental completa |
| Fase 6 | Filtros y bandejas | Modelos de versión tipados | Regresión Secretaría |
| Fase 7 | Timeline y diálogo histórico | Componentes desacoplados | Consulta de trazabilidad |
| Fase 8 | Casos de uso | Clean Architecture | Regresión de flujos |
| Fase 9 | Interfaces y mappers | Reducción de `any` | Compilación estricta |
| Fase 10 | Componentes extraídos | Tamaño y complejidad | Regresión visual |
| Fase 11 | Validaciones automatizadas | Lint, formato y bundle | Puertas de calidad |
| Fase 12 | Suite completa | Métricas consolidadas | Certificación final |

Ninguna fase se considerará terminada si falla alguno de los tres controles obligatorios.

---

## 6. Riesgos y medidas de mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambios de contrato backend | Alto | Usar DTOs, mappers y pruebas HTTP simuladas |
| Conflictos de concurrencia | Alto | Versionamiento optimista y manejo de HTTP 409 |
| Pérdida de documentos | Alto | URLs firmadas, metadatos y endpoint de eliminación remoto |
| Refactorización de componentes grandes | Medio | Cambios incrementales con pruebas por módulo |
| Uso extendido de `any` | Medio | Interfaces por feature y prohibición de nuevos `any` |
| Regresiones visuales | Medio | Pruebas de componentes y QA manual |
| Bundle sobredimensionado | Medio | Lazy loading, revisión de dependencias y división de componentes |
| Cobertura insuficiente | Alto | Bloqueo de fase si no se alcanza 80% |

---

## 7. Dependencias backend necesarias

Las siguientes actividades no pueden cerrarse únicamente desde el frontend:

- Endpoint seguro para eliminar archivos remotos.
- Versionamiento optimista con `@VersionColumn()`.
- Respuestas HTTP 409 ante conflictos.
- Persistencia de versiones del protocolo.
- Transición transaccional de requisitos durante subsanación.
- Endpoint de historial y observaciones históricas.
- Validación backend del tipo y tamaño de archivos.
- Registro de auditoría de cambios.

Estas dependencias deben coordinarse con el equipo backend antes del cierre de las fases 4, 5 y 7.

---

## 8. Orden recomendado de ejecución

1. Fase 1: seguridad de archivos y CV — completada.
2. Fase 2: entidades, mappers y servicios.
3. Fase 3: emisión de resoluciones.
4. Fase 4: concurrencia HTTP 409.
5. Fase 5: subsanación V2.0.
6. Fase 6: bandejas de Secretaría.
7. Fase 7: historial y trazabilidad.
8. Fase 8: casos de uso y desacoplamiento.
9. Fase 9: eliminación progresiva de `any`.
10. Fase 10: modularización de componentes.
11. Fase 11: métricas estáticas y optimización.
12. Fase 12: QA final y presentación.

---

## 9. Criterio de cierre del proyecto

El proyecto estará listo para presentación final cuando:

- Las funcionalidades críticas estén conectadas al backend real.
- No existan archivos persistidos como Base64.
- Las páginas no llamen directamente a repositorios.
- Los casos de uso críticos tengan pruebas.
- El código nuevo o refactorizado alcance mínimo 80% de cobertura.
- El manejo HTTP 409 esté implementado.
- La subsanación V2.0 respete la inmutabilidad documental.
- El historial de versiones sea consultable.
- No se incorporen nuevos usos de `any`.
- La compilación de producción sea exitosa.
- Las advertencias restantes estén documentadas y justificadas.
- Se haya completado la revisión funcional y técnica final.

---

## 10. Conclusión

La Fase 1 resolvió el riesgo inmediato de seguridad y cuota de almacenamiento relacionado con el CV. Las siguientes fases deben concentrarse en completar el modelo de resoluciones y versiones, estabilizar la subsanación V2.0, implementar concurrencia optimista, desacoplar la presentación de los repositorios y reducir la complejidad de los componentes principales.

El plan propuesto permite ejecutar la refactorización de forma controlada, medible y verificable. Cada fase cuenta con entregables técnicos, pruebas y criterios de aceptación que permiten demostrar el avance ante una revisión académica, institucional o de presentación final.
