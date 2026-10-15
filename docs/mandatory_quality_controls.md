# 🛡️ Requisitos y Controles de Calidad Obligatorios (Full-Stack CEISH)

Este documento establece las normas y estándares de calidad técnica, seguridad, arquitectura y pruebas que deben cumplir de forma obligatoria tanto el frontend (**Angular 20**) como el backend (**NestJS 11**) del proyecto CEISH Espoch. 

---

## 🏛️ 1. Estándares y Capas en el Backend (NestJS 11 + TypeORM)

El backend debe mantener estrictamente la separación de responsabilidades y la seguridad criptográfica de los datos de los investigadores y protocolos.

### 1.1 Arquitectura Hexagonal y Desacoplamiento ORM
* **Domain (`src/modules/*/domain/`):** Aloja las entidades de negocio puras, los enums y los puertos de repositorio (interfaces abstractas).
  * **Regla de Oro:** Queda estrictamente prohibido importar decoradores del ORM (`@Entity`, `@Column`, `@ManyToOne`) en esta capa. Las reglas de negocio deben permanecer totalmente aisladas de las librerías externas.
* **Application (`src/modules/*/application/`):** Contiene los casos de uso, servicios, DTOs y mappers.
  * **Regla de Oro:** Toda lógica de negocio debe delegarse a esta capa. Los controladores de la API deben limitarse a recibir peticiones, llamar a los servicios y retornar las respuestas estandarizadas.
* **Infrastructure (`src/modules/*/infrastructure/`):** Contiene los controladores NestJS (`*.controller.ts`), las entidades de la base de datos ORM (`*.entity.orm.ts`) y las implementaciones de los repositorios que heredan de los puertos (`*.typeorm.repository.ts`).

### 1.2 Seguridad de Datos Criptográficos y Auditoría (PII Security)
* **Encriptación de PII:** La información personal identificable (nombres, cédula, teléfono, correos) debe encriptarse en tránsito y reposo en PostgreSQL (AES-256-CBC) utilizando `EncryptionService` y el decorator `@Encrypt()` en las columnas ORM correspondientes.
* **Auditoría Sistemática:** Todo cambio de estado en los expedientes de investigación (recepción, validación, emisión de resoluciones) debe decorarse con `@Audit('ACCION')` para alimentar automáticamente las bitácoras de auditoría en la base de datos mediante el `AuditInterceptor` global.

### 1.3 Protección perimetral (DoS Protection)
* **Doble Capa Throttler (app.module.ts):**
  * *Capa Burst:* Límite de 5 peticiones por segundo por dirección IP.
  * *Capa Normal:* Límite de 100 peticiones por minuto.
* **DosDefenseMiddleware:** Middleware global registrado para interceptar cualquier ataque automatizado rápido de denegación de servicio a nivel de red antes de que las peticiones consuman recursos de base de datos.
* **Respuesta de Exceso de Tráfico:** El filtro `ThrottleExceptionFilter` debe estructurar el error con los encabezados RFC 6585 (`Retry-After`) para regular el tráfico del cliente.

---

## 💻 2. Estándares y Desacoplamiento en el Frontend (Angular 20)

El frontend debe alinearse al desacoplamiento arquitectónico para evitar la acumulación de lógica compleja en las plantillas visuales.

### 2.1 Desacoplamiento UI a Repositorio
* **Prohibición de Inyección Directa:** Queda prohibida la inyección directa de los puertos de repositorio en los componentes visuales (`private protocolRepo = inject(IProtocolRepositoryPort);`).
* **Llamadas a Casos de Uso:** Toda interacción con el servidor o lógica de negocio en el cliente debe orquestarse a través de clases de **Casos de Uso** (ej: `SubmitProtocolUseCase.execute()`).
* **Tipado Estricto (No `any`):** Reemplazar señales o variables declaradas con tipo `any` (ej: `protocol = signal<any>(null)`) por interfaces específicas de dominio (`ProtocolEntity`, `ResolutionEntity`) mapeadas desde el backend.

### 2.2 Gestión de Archivos y LocalStorage
* **Eliminar Carga de Archivos en LocalStorage:** Queda prohibido serializar archivos PDF u hojas de vida (CV) como cadenas Base64 dentro del `localStorage` (como ocurre en la edición de perfil del investigador). Esto causa bloqueos en la aplicación por errores `QuotaExceededError`.
* **Subida HTTP Segura:** Toda carga de documentos debe realizarse mediante peticiones multipart utilizando el adapter de red (`POST /api/protocols/:id/upload-document`) para que el backend lo almacene en AWS S3.

### 2.3 Modularización de Componentes Gigantes
* **Component Bloat:** Descomponer archivos de componentes que superen las 500 líneas o 15KB (ej: `protocol-validation-detail.page.ts` de 41KB y `resolution-generator.page.ts` de 37KB) en componentes sin estado (Presentational / Dumb Components) y servicios dedicados de vista.

---

## 🔄 3. Alineación e Integración de Cambios (Full-Stack Alignment)

La integración entre ambos sistemas debe cumplir con las siguientes directrices para evitar fallos de concurrencia o incongruencias en el flujo:

### 3.1 Control de Concurrencia Optimista (HTTP 409)
* **Backend:** Agregar la columna `@VersionColumn()` en la entidad `ProtocolOrmEntity` de TypeORM para gestionar el versionamiento optimista nativo. Capturar los errores y lanzar un `ConflictException` (HTTP 409) ante cualquier intento de actualización concurrente sobre un estado obsoleto.
* **Frontend:** El `ErrorInterceptor` interceptará el error de red 409 y propagará un error tipado `CONCURRENCY_ERROR`. La vista desplegará un modal informativo bloqueante obligando a recargar la página.

### 3.2 Sincronización de Estados en Subsanación (V2.0+)
* **Mapeo de Requisitos en Transición:** Cuando el backend emite una resolución tipo 2 y cambia el estado de los requisitos a `PRESENTADO` (para mantener el archivo existente de V1) y los observados a `NO_PRESENTADO`:
  * El frontend no debe guiarse ciegamente por el estado `PRESENTADO` para habilitar controles. Debe validar si el archivo ya tiene una URL válida asignada para mantenerlo bloqueado e **inmutable**.
  * Solo los requisitos que se encuentren en estado `NO_PRESENTADO` tras el reseteo transaccional del backend tendrán activados los controles de subida para la subsanación.

---

## 🧪 4. Control de Pruebas Automatizadas y Cobertura de Código

Ambos proyectos deben establecer métricas de cobertura de pruebas automáticas en la integración continua (CI) para impedir la entrada de código sin validar:

### 4.1 Backend (Jest)
* **Tests Unitarios:** Implementar Jest unit tests (`*.spec.ts`) para cada servicio de aplicación, controlador y mapper de datos.
  * **Métrica Obligatoria:** Cobertura de código mínima del **80%** en la capa de aplicación e infraestructura.
* **Tests de Integración (Supertest):** Pruebas de integración E2E para el ciclo de autenticación y transacciones críticas de cambio de versión en `ResolutionsService`.

### 4.2 Frontend (Jasmine/Karma)
* **Tests de Casos de Uso:** Implementar pruebas unitarias para cada caso de uso y página enrutable.
* **Aislamiento:** Emplear `HttpClientTestingModule` y espías de Jasmine (`jasmine.createSpyObj`) para mockear las peticiones HTTP y no depender del estado del servidor durante la ejecución del comando `ng test`.
  * **Métrica Obligatoria:** Cobertura de código mínima del **80%** en el código nuevo o refactorizado.
wha