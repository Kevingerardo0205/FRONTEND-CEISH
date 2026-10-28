# specs/ del frontend — Rediseño CEISH-ESPOCH

**Repositorio:** `D:\Frontend-CEISH\ceish-espoch-frontend` (Angular 20)
**Fecha:** 28/10/2026 · **Estado:** borrador para revisión

Esta carpeta es el **SDD del frontend**: describe **cómo se ve y cómo se construye** cada sección del rediseño.
**No define reglas de negocio.** Esas viven en un solo lugar: el spec del backend.

---

## 1. Fuente de verdad

| Qué | Dónde | Versión vigente |
|---|---|---|
| Reglas generales, etapas, parámetros, roles | `C:\Users\Usuario\Desktop\8vo\API II\CEISH-ESPOCH\specs\001-flujo-mvp\spec.md` | 3.4.x |
| Asignación, riesgo, reasignación, reportes | `...\specs\002-flujo-mvp\spec.md` | 1.2.x |
| Convocatorias, sesión, seguimiento, pendientes | `...\specs\003-flujo-mvp\spec.md` | 1.5.x |
| Constitución del CEISH | `...\docs\doc_base\constitution_v2.md` | v2 |
| Arquitectura (ADR-001) | "Diseño arquitectónico de la aplicación" (proyecto) | — |
| Diseño visual de las pantallas | Canvas "Pantallas Secretaría — CEISH-ESPOCH" (claude.ai) | 28/10/2026 |

> Cuando el backend suba la versión de un spec, revisa las secciones F0x que lo citan.

---

## 2. Arquitectura: capas + Clean Architecture

El proyecto usa el estilo **híbrido** del ADR-001: **arquitectura en capas + Clean/Hexagonal + patrones estratégicos**, igual en el backend y en el frontend.

### 2.1 Capas de cada sección (feature)

```text
presentation   → páginas, componentes, rutas de la sección (Angular)
     ↓ usa
application    → casos de uso (*.use-case.ts), fachadas, estrategias
     ↓ usa
domain         → entidades, value objects, reglas de presentación del dominio, ports (interfaces)
     ↑ implementa
infrastructure → adapters HTTP (*-http.repository.ts), mappers DTO↔entidad
```

### 2.2 Reglas de dependencia (obligatorias)

1. `domain` no importa nada de Angular, HttpClient, RxJS de infraestructura ni de otras capas.
2. `application` depende solo de `domain` (de sus **ports**, nunca de adapters concretos).
3. `infrastructure` implementa los ports del `domain`. Es la única capa que conoce URLs y DTOs del backend.
4. `presentation` solo llama a casos de uso o fachadas de `application`. Nunca llama a HttpClient ni a un adapter directo.
5. Una sección (feature) no importa el interior de otra. Lo común va en `shared/` o `core/`.
6. La inyección se hace con tokens de Angular: el port se registra con su adapter en el `providers` de la ruta de la sección.

### 2.3 Pruebas por capa (adaptado del ADR, con Jasmine/Karma)

| Capa | Tipo de prueba | Cobertura objetivo |
|---|---|---|
| domain | Unitarias puras, sin TestBed | 100 % |
| application | Unitarias con ports simulados | 90 % |
| infrastructure | Mapper + adapter con `HttpTestingController` | 80 % |
| presentation | Componente con TestBed: estados y acción principal | 70 % de los flujos críticos |

---

## 3. Reglas de uso de esta carpeta

1. **Una regla de negocio que no está en el spec del backend primero se agrega allí.** Nunca se escribe solo en el frontend.
2. Cada `spec-ui.md` declara los **RF que cubre, con su versión**, y no copia su texto: lo cita.
3. Se trabaja **una sección a la vez**, en su propia rama (`feat/f00-base`, `feat/f01-pendientes-protocolos`…). Se hace merge a `dev` antes de empezar la siguiente.
4. Si un endpoint **falta en el backend**, se anota en `spec-ui.md` → "Endpoints" con estado `FALTA` y la sección usa un adapter temporal (mock) detrás del mismo port. No se inventan reglas para cubrir el hueco.
5. Al reemplazar una pantalla vieja, en el mismo PR se borran sus archivos y sus pruebas, y se escriben las nuevas.
6. Las tareas de frontend que hoy están en el backend (`specs/002-flujo-mvp/plan/frontend-*-asignacion.md`, `tasks_fron.md`) se mueven aquí en el PR de limpieza.

---

## 4. Secciones

| Sección | Contenido | Depende de |
|---|---|---|
| **F00-base** | Tokens, AppShell (menú), StageBar, componentes compartidos, rutas y guards por rol | — |
| F01-pendientes-y-protocolos | Mis pendientes; Protocolos con un botón por etapa | F00 |
| F02-recepcion | Checklist de requisitos, aprobar recepción u observar | F00, F01 |
| F03-asignacion | Asignar evaluadores, tipo de revisión, reasignar | F00, F01 |
| F04-convocatoria-y-sesion | Convocatoria, sesión, tomar lista, resultados, corregir decisión | F00, F03 |
| F05-resolucion | Emitir resolución, aprobado con condición | F00, F04 |
| F06-seguimiento | Calendario, control del informe, evento adverso | F00, F05 |
| F07-renovacion | Etapa 7: solicitud, pares, pleno, resolución | F00, F06 |
| F08-configuracion-y-reportes | Plazos, usuarios (roles fijos), reportes | F00 |

---

## 5. Plantilla de cada sección

Cada carpeta `F0x-*` tiene exactamente estos tres archivos:

- **`spec-ui.md`** — Qué ve y hace el usuario.
  1. Alcance y roles
  2. RF que cubre (spec del backend + versión)
  3. Pantallas (tablero del canvas) y navegación
  4. Estados de cada pantalla: cargando, vacío, error, éxito
  5. Interacciones y acción principal
  6. Endpoints (existe / FALTA)
  7. Criterios de aceptación (verificables)
  8. Pendientes
- **`plan.md`** — Cómo se construye, por capa: domain, application, infrastructure y presentation. Incluye rutas, qué se reutiliza o retira del código actual, y pruebas.
- **`tasks.md`** — Tareas pequeñas en orden, cada una con su capa, archivos y criterio de terminado.
