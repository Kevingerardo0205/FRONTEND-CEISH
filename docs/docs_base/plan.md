# 🗺️ Plan Tecnológico y Arquitectura de Software

Este documento define la pila tecnológica elegida y detalla la organización arquitectónica del frontend de **CEISH Espoch** para la implementación de la Iteración 2.

---

## 🛠️ 1. Pila Tecnológica Seleccionada (Tech Stack)

La aplicación frontend se basa en las siguientes tecnologías principales:

* **Core Framework:** **Angular 20.2.0**
  * *Justificación:* Ofrece una arquitectura robusta basada en componentes, inyección de dependencias de primer nivel y un sistema de renderizado altamente eficiente con soporte nativo de **Signals** para la gestión reactiva de la interfaz.
* **Lenguaje:** **TypeScript 5.9.2**
  * *Justificación:* Permite un tipado estricto que previene errores en tiempo de compilación, facilitando el mantenimiento en proyectos con alta lógica de negocio.
* **Diseño y Estilos:** **SCSS (Sass) + Angular Material 20.2.14**
  * *Justificación:* SCSS permite la reutilización de variables y layouts mediante mixins. Angular Material proporciona componentes UI accesibles y listos para producción (como modales, tablas y selectores).
* **Gestión del Estado:** **RxJS 7.8 + Signals**
  * *Justificación:* RxJS maneja la comunicación asíncrona mediante observables en servicios e infraestructura. Signals simplifica el estado de los componentes visuales reduciendo re-renderizados innecesarios.
* **Generación de Reportes:** **jsPDF 2.5 + jsPDF-AutoTable**
  * *Justificación:* Requerido para la generación en caliente de cartas de resolución y dictámenes éticos desde el cliente.
* **Visualizaciones:** **Chart.js 4.5 + ng2-charts 5.0**
  * *Justificación:* Proporciona gráficos interactivos para el dashboard administrativo y de secretaría.

---

## 🏛️ 2. Arquitectura del Proyecto (DDD + Clean Architecture)

La base del código se organiza siguiendo los principios de la Arquitectura Limpia para desacoplar la interfaz de usuario de las fuentes de datos y las reglas del negocio.

```
ceish-espoch-frontend/
├── src/
│   ├── app/                    # Configuración inicial, rutas raíz y layouts
│   │   ├── app.config.ts       # Proveedores globales de Angular (routing, HTTP, etc.)
│   │   ├── app.routes.ts       # Enrutamiento principal del sistema
│   │   └── app.component.ts    # Componente raíz del proyecto
│   ├── domain/                 # Reglas de negocio puras (independientes del framework)
│   │   ├── entities/           # Entidades (ProtocolEntity, ResolutionEntity)
│   │   ├── ports/              # Interfaces de acceso a datos (Repository Ports)
│   │   └── enums/              # Enumeraciones de dominio (ProtocolStatus, ProtocolType)
│   ├── infrastructure/         # Detalles técnicos e integraciones
│   │   ├── repositories/       # Implementaciones de Repositorios (Http e InMemory)
│   │   ├── mappers/            # Conversión DTO <-> Entidad
│   │   └── guards/             # Control de accesos y seguridad (AuthGuard)
│   ├── features/               # Módulos del negocio organizados por dominio funcional
│   │   ├── protocols/          # Gestión de Protocolos de investigación
│   │   ├── resolutions/        # Gestión de Resoluciones del comité
│   │   └── dashboard/          # Panel principal del usuario según su rol
│   ├── shared/                 # Componentes UI, directivas y pipes reutilizables
│   └── styles/                 # Estilos globales y tokens de diseño SCSS
```

### 🧩 Patrones Clave de Implementación

1. **Lazy Loading (Carga Perezosa):**
   Cada característica en `src/features/` expone un archivo `routes.ts` que se carga bajo demanda en `app.routes.ts`. Esto optimiza el tamaño inicial de descarga de la aplicación.
2. **Inyección por Tokens (Dependency Inversion):**
   Los casos de uso de Angular solicitan dependencias mediante tokens de TypeScript que representan interfaces de Dominio, configuradas en `app.config.ts`:
   ```typescript
   export const PROTOCOL_REPOSITORY_TOKEN = new InjectionToken<ProtocolRepositoryPort>('ProtocolRepositoryPort');
   // En app.config.ts
   providers: [
     { provide: PROTOCOL_REPOSITORY_TOKEN, useClass: ProtocolHttpRepository }
   ]
   ```
3. **Mappers de Datos:**
   Evitan que los cambios en el formato JSON del backend rompan las plantillas HTML del frontend. La capa de infraestructura (`mappers/`) traduce la respuesta de la API a entidades de dominio limpias antes de entregarlas a los casos de uso.
