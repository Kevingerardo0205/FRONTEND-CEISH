# EP2c · Espacio de trabajo integral del protocolo

**Versión:** 0.1 · **Fecha:** 22/11/2026 · **Estado:** pendiente de aprobación

## 1. Alcance

EP2c evoluciona el espacio de trabajo del protocolo CEISH-ESPOCH para convertirlo en un expediente integral, navegable y trazable.

El alcance de esta especificación es el frontend. No se modifican el backend, la base de datos, los contratos API, los guards existentes ni los permisos.

La implementación debe conservar EP2b: el formulario de asignación sigue siendo el de F03 (`PeerAssignmentFormPage`), en modo espacio, en la ruta:

`/dashboard/protocols/workspace/:id/assignment`

La asignación continuará reutilizando `PeerAssignmentFormPage`, sus casos de uso, validaciones y restricciones.

`/dashboard/protocols/workspace/:id/assignment` es el FORMULARIO de asignación (guards: PRESIDENTE con `EVALUACION_ASIGNAR`). `/dashboard/protocols/workspace/:id/assignment-history` es el HISTORIAL de asignaciones (`ProtocolAssignmentHistoryPage`), con los roles de consulta (SECRETARIA, PRESIDENTE, INVESTIGADOR). Flujo: listado de protocolos de la PRESIDENTE → «Asignar» → `workspace/:id/assignment`; «Asignar Pares» del encabezado lleva a la misma ruta. La ruta vieja `/dashboard/evaluations/assignment/:id` redirige a `workspace/:id/assignment`, para que haya un solo formulario (decisión de la usuaria, 24/11/2026).

## 2. Requerimientos funcionales

### EP2c-RF-01 · Navegación por las seis etapas

Las seis etapas del expediente deben poder seleccionarse desde el espacio de trabajo únicamente para los roles que ya tienen autorización de acceso al workspace:

1. Recepción.
2. Asignación.
3. Evaluación.
4. Resolución.
5. Seguimiento.
6. Renovación.

Una etapa cuyo estado individual sea pendiente, en curso o completada no debe quedar inaccesible únicamente por ese estado. EP2c no amplía automáticamente los roles autorizados ni modifica guards o permisos.

La selección debe actualizar el contenido dentro del mismo workspace y conservar el identificador del protocolo.

### EP2c-RF-02 · URL y recarga

La URL debe representar el protocolo y el apartado seleccionado. La navegación debe ser compatible con recarga directa del navegador.

La ruta debe permitir reconstruir:

- el protocolo mediante `:id`;
- la etapa seleccionada mediante el segmento del apartado;
- el contexto de retorno de EP2b únicamente cuando corresponda.

La navegación no debe iniciar ni completar transiciones del proceso.

### EP2c-RF-03 · Consulta de etapas pendientes

Al ingresar a una etapa cuyo estado individual esté confirmado como pendiente por una fuente real, se debe mostrar, con datos reales:

- nombre de la etapa;
- estado de la etapa, únicamente si una fuente real lo respalda;
- información disponible;
- requisitos o prerrequisitos conocidos, únicamente si una fuente real los respalda;
- actividades todavía no realizadas;
- información que aún no existe;
- operaciones disponibles y operaciones restringidas.

Las restricciones deben explicarse contextualmente. Una etapa pendiente confirmada es consultable, aunque sus operaciones puedan estar deshabilitadas o ausentes. Si no existe información suficiente para determinar el estado individual, se debe mostrar `Estado no determinado` o `Información no disponible`; nunca se debe inferir `pendiente` desde la etapa actual del protocolo.

### EP2c-RF-04 · Consulta histórica de etapas completadas

Una etapa completada debe permitir consultar los datos disponibles, documentos, versiones, fechas, responsables, resultados y actividades registradas, únicamente cuando una fuente real confirme la finalización o entregue dichos registros.

Los registros formalizados se muestran en modo de consulta. No se habilitan modificaciones directas no autorizadas.

Las correcciones, subsanaciones o nuevas entregas deben utilizar los mecanismos de versionamiento existentes. EP2c no crea un mecanismo alternativo de edición histórica.

### EP2c-RF-05 · Operaciones controladas

La disponibilidad de una operación se determina separadamente de la navegación. Debe considerar:

- rol activo;
- permisos existentes;
- estado general del protocolo;
- etapa actual del proceso;
- estado particular de la etapa seleccionada;
- prerrequisitos y reglas de negocio.

Ingresar a un apartado no concede permisos ni habilita por sí mismo aprobar, rechazar, validar, asignar, modificar, resolver o registrar información.

### EP2c-RF-06 · Recepción

Se reutilizarán los componentes y casos de uso existentes de consulta y validación documental. La consulta deberá mostrar únicamente la información disponible actualmente, incluyendo documentos, requisitos, resultados, fechas y versiones cuando existan.

Las operaciones de validación permanecen controladas por la autorización existente.

### EP2c-RF-07 · Asignación

Se reutilizará íntegramente la implementación de EP2b:

- `PeerAssignmentFormPage`;
- `ProtocolWorkspaceComponent`;
- `ProtocolWorkspaceService`;
- casos de uso de asignación;
- validaciones existentes;
- guards, permisos y reglas de retorno.

No se duplicará la pantalla ni su lógica. «Asignar Pares» navega al formulario del espacio (`/dashboard/protocols/workspace/:id/assignment`, id numérico) conservando el origen para el retorno. La ruta `workspace/:id/assignment-history` solo consulta: muestra los datos que entreguen los casos de uso y adaptadores existentes.

La pestaña Asignación es visible para quien ya la tenía aunque el investigador no haya aceptado los tiempos; en ese caso el botón «Asignar Pares» aparece deshabilitado con su motivo.

### EP2c-RF-08 · Evaluación

Se reutilizarán los casos de uso, repositorios y componentes existentes para consultar evaluaciones, resultados, observaciones, dictámenes y documentos.

Cuando no existan registros, se mostrará un estado vacío contextualizado. No se crearán evaluaciones, responsables, fechas ni dictámenes ficticios.

Las acciones de completar, consolidar o descargar documentos seguirán dependiendo de sus permisos y condiciones actuales.

### EP2c-RF-09 · Resolución

El apartado debe consultar decisiones, actas, documentos, fechas, responsables y antecedentes únicamente si existe una fuente frontend disponible.

La auditoría de Paso 0 identificó que existen funcionalidades operativas de resolución, pero no una vista consolidada de resolución por protocolo integrada al workspace. En esta fase no se agregará un contrato API nuevo ni se inferirá información desde otras pantallas.

Mientras no exista una fuente de consulta compatible, el apartado deberá explicar que no hay información consultable disponible para este expediente y mantener protegidas las operaciones de resolución.

### EP2c-RF-10 · Seguimiento

El apartado debe consultar actividades, informes, incidencias, documentos, fechas y responsables asociados al protocolo, solo cuando esos datos provengan de una fuente real.

La implementación actual de eventos adversos contiene datos locales no asociados al protocolo. No se reutilizará como fuente del expediente ni se presentarán esos datos como información real.

Sin un origen compatible, se mostrará un estado de información no disponible o vacío contextualizado, sin simular actividad ni éxito de operaciones.

### EP2c-RF-11 · Renovación

El apartado debe consultar solicitudes, versiones, documentos, estados, antecedentes, fechas y responsables cuando exista información real.

La funcionalidad separada de renovaciones no constituye por sí sola una consulta histórica por protocolo. No se inventarán solicitudes ni estados.

Si no existe información para el protocolo, se mostrará un estado vacío contextualizado que indique que la etapa aún no registra actividad.

## 3. Separación de conceptos y estado

EP2c debe modelar y mantener separados los siguientes conceptos.

### 3.1. Etapa actual del proceso

Es la etapa real del protocolo calculada y enviada por el backend.

El frontend la consume como dato de solo lectura. Navegar entre apartados no la modifica.

Puede cambiar únicamente cuando una transición legítima del proceso sea ejecutada por una operación autorizada y el frontend reciba posteriormente el nuevo estado desde el backend.

El frontend no debe calcularla a partir del apartado seleccionado ni mutarla como efecto de navegación. `header.stage` identifica únicamente la etapa actual del proceso; no permite, por sí solo, determinar el estado individual de cada una de las seis etapas.

### 3.2. Etapa seleccionada

Es el apartado que el usuario está consultando. Debe derivarse de la URL o del estado de navegación del router.

Puede ser distinta de la etapa actual y puede representar una etapa pendiente, actual o completada.

La selección no genera efectos de dominio ni transiciones.

### 3.3. Disponibilidad de operaciones

Es el resultado de una política de autorización y reglas de negocio para la etapa seleccionada.

No debe representarse con la etapa actual ni con la etapa seleccionada. Una etapa puede ser navegable y tener todas sus operaciones restringidas.

### 3.4. Estado individual de cada etapa

El estado de una etapa es un dato independiente de `etapaActualProtocolo` y `etapaSeleccionada`. Debe proceder de una fuente real comprobada para esa etapa.

Los estados visuales `pendiente`, `en curso` y `completada` solo pueden mostrarse cuando una fuente real los respalde. Si no existe información suficiente, se debe mostrar `Estado no determinado` o `Información no disponible` y no inferir el estado por el orden de la etapa, el estado general del protocolo, `header.stage` o la existencia de una ruta.

**Excepción aprobada (usuaria, 24/11/2026): estados «derivados de la etapa actual».** Es la única inferencia permitida y solo se calcula con `header.stage` (etapa actual enviada por el backend) y el código de estado del protocolo. Si `header.stage` es nulo, no se deriva nada y todas las etapas quedan en `Estado no determinado`. La barra no presenta estos estados como confirmados por una fuente propia de cada etapa.

Regla de derivación, en el orden de las seis etapas:

| Situación | Etapas anteriores a la actual | Etapa actual | Etapas posteriores |
|---|---|---|---|
| Protocolo en curso | `COMPLETADA` | `EN_CURSO` | `PENDIENTE` |
| Protocolo `RECHAZADO` (estado 18) o `ARCHIVADO_VENCIMIENTO` (estado 12) | `COMPLETADA` | `CERRADA` (etapa donde se detuvo) | `NO_APLICA` |
| `SEGUIMIENTO` y `RENOVACION` mientras no existan | `no disponible` | `no disponible` | `no disponible` |

Precedencia: primero la fila de protocolo cerrado (RECHAZADO o ARCHIVADO_VENCIMIENTO); si no aplica, `SEGUIMIENTO` y `RENOVACION` quedan siempre `no disponible` y las cuatro primeras etapas siguen la primera fila. `NO_APLICA` y `CERRADA` son valores nuevos de `WorkspaceStageStatus`; `no disponible` es el estado `unavailable` de `WorkspaceStageState`.

### 3.6. Pestañas por etapa y formulario en el espacio (decisión de la usuaria, 24/11/2026)

Las pestañas inferiores del workspace dependen de la etapa seleccionada en la barra:

| Etapa seleccionada | Pestañas |
|---|---|
| RECEPCIÓN | Resumen y Validación Técnica (con sus roles de EP2: la PRESIDENTE en solo lectura). |
| ASIGNACIÓN | Solo Asignación: el formulario de asignación para la PRESIDENTE mientras no haya asignación activa (protocolo en COMPLETO); el historial en los demás casos y para los demás roles. |
| SEGUIMIENTO | Su pestaña cuando existe (protocolo aprobado); mientras tanto, ninguna. |
| EVALUACIÓN, RESOLUCIÓN y RENOVACIÓN | Ninguna todavía; la página muestra el estado «no disponible» de EP2c. |

- Al abrir el espacio (entrada por defecto en Resumen), la etapa seleccionada es la etapa actual del protocolo: si no es RECEPCIÓN, el espacio pasa a la primera pestaña de esa etapa sin añadir una entrada al historial.
- Resumen y Validación Técnica pertenecen a RECEPCIÓN: abrirlas selecciona RECEPCIÓN. Sin etapa seleccionada, vale la etapa actual del backend; sin ninguna, se conservan todas las pestañas de siempre.
- Formulario dentro del espacio: sin «Revisar documentación» (la documentación está en Recepción → Validación Técnica) y sin «Volver a la lista». Antes de elegir el tipo de revisión solo se ve el título, el código y título del protocolo y «Tipo de revisión: Expedita / En pleno»; el botón «Asignar evaluadores» y su motivo aparecen después de elegir el tipo, debajo de las filas de evaluadores.
- «Asignar Pares» del encabezado no se muestra (ni su aviso de tiempos) cuando la pestaña Asignación ya está abierta.

Criterios EARS: F11-28 a F11-34 (`spec-ui.md` §7b).

### 3.7. Protocolo ya asignado e INVESTIGADOR en Asignación (decisión de la usuaria, 24/11/2026)

**Evaluadores ya asignados.** Asignar no cambia el estado (sigue COMPLETO hasta fijar el riesgo, N52), así que la condición no es el estado sino las asignaciones activas: `GET /evaluations/protocol/:id/active-assignments` (SECRETARIA y PRESIDENTE). Con al menos una asignación activa:

- la pestaña de la etapa Asignación muestra el historial, nunca el formulario;
- «Asignar Pares» no se muestra;
- si la PRESIDENTE abre `workspace/:id/assignment` por URL, ve «Este protocolo ya tiene evaluadores asignados.» con el enlace al historial, sin formulario ni botón;
- si falla la consulta, el formulario muestra el estado de error con «Reintentar» y nunca el formulario por defecto; mientras consulta, la carga.

La consulta la hace el espacio solo para quien puede asignar y con el protocolo en COMPLETO, y el formulario la reutiliza (una petición por protocolo). Tras asignar, el estado se refresca y la pestaña pasa al historial.

**Lista de asignación de la PRESIDENTE.** `GET /evaluations/protocols/pending-peer-assignment` no trae asignaciones activas ni su conteo; marcar o quitar «Asignar» obligaría a una consulta por fila, y no se hace. **Pendiente del backend:** que la lista excluya los protocolos con asignación activa (TSK-002-N54). Mientras tanto el control está en el aviso del formulario y en el 409 del backend, que el formulario muestra tal cual.

**INVESTIGADOR en Asignación.** Puede abrir la etapa (sin rebote al inicio ni aviso de acceso denegado), pero no ve evaluadores: en lugar del historial ve «La asignación de evaluadores es reservada del comité. Podrá ver el avance de su protocolo en la barra de etapas.». En esa pestaña no se hace ninguna petición de asignaciones activas ni de reasignaciones, así que no llegan ni se muestran nombres, ids ni correos de evaluadores (F11: el investigador no ve nombres). Para la SECRETARIA no cambia: ve el historial.

Criterios EARS: F11-35 a F11-40 (`spec-ui.md` §7c).

### 3.8. Etapas posteriores a la actual (decisión de la usuaria, 24/11/2026)

Una etapa **posterior a la etapa actual** del protocolo (estado «pendiente»; también SEGUIMIENTO y RENOVACION cuando son posteriores a la actual) todavía no se puede abrir. La regla es única (`isStageNotReached`, dominio) y la usan la barra y el espacio. Sin etapa del backend no se bloquea nada.

- **Clic en la barra:** no navega. Muestra un aviso flotante con el servicio de avisos que ya usan los guards (`NotificationService`, tipo «info», se cierra solo): «El protocolo aún no está en la etapa {nombre}. Podrá verla cuando llegue a ella.».
- **Barra:** esas etapas se anuncian con texto oculto «etapa pendiente, aún no disponible» y no tienen `aria-current` ni enlace (son un botón que solo muestra el aviso).
- **Navegables, como hasta ahora:** etapas completadas, cerradas y la etapa actual.
- **Protocolo cerrado (RECHAZADO, ARCHIVADO_VENCIMIENTO), decisión del 24/11/2026:** las etapas «no aplica» tampoco se abren. El clic no navega y avisa «El protocolo se cerró en la etapa {etapa}; esta etapa no aplica.» (la etapa donde se cerró, no la clicada); por URL se redirige a la etapa cerrada (`replaceUrl`) con el mismo aviso. La barra las sigue anunciando «no aplica» y deja de darles enlace y `aria-current`.
- **URL:** abrir por URL una etapa posterior a la actual redirige a la etapa actual (`replaceUrl`) y muestra el mismo aviso, una sola vez por intento. Si el backend no manda etapa, no se bloquea nada.
- **Etapa alcanzada sin pantalla:** si el protocolo ya está en Evaluación o Resolución (o en otra etapa cuya pantalla aún no existe), el espacio se mantiene en la página con otro mensaje: «Esta sección todavía no está disponible en el sistema.», para no confundirlo con «aún no llega».
- **Roles:** aplica a SECRETARIA, PRESIDENTE e INVESTIGADOR. El EVALUADOR sigue redirigido a «Mis evaluaciones» (sin cambio).

Criterios EARS: F11-41 a F11-48 (`spec-ui.md` §7d).

### 3.5. Estado de información

Cada apartado debe diferenciar explícitamente:

- `Carga en curso`: existe una consulta iniciada y todavía no termina.
- `Sin registros`: la fuente consultada respondió correctamente y confirmó que no existe actividad o registros.
- `Fuente no disponible`: no existe un mecanismo compatible de consulta para ese apartado o dato.
- `Error de consulta`: existe una fuente compatible, pero la carga falló.

`Error de consulta` y `Fuente no disponible` no deben presentarse como `Sin registros`. Un estado vacío solo es válido cuando la fuente confirmó la ausencia de actividad.

## 4. Arquitectura prevista

### 4.1. Workspace

Se conservará `ProtocolWorkspaceComponent` como shell persistente del expediente. Mantendrá:

- carga del protocolo;
- encabezado persistente;
- contexto del `:id`;
- outlet de contenido;
- acciones generales existentes;
- compatibilidad con EP2b.

La configuración de navegación se ampliará para representar los seis apartados sin convertir el estado de la etapa en un guard de consulta.

### 4.2. Barra de etapas

`StageBarComponent` evolucionará de indicador visual a navegación accesible. Deberá recibir o derivar explícitamente:

- etapa actual;
- etapa seleccionada;
- estado visual de cada etapa;
- destino de navegación.

Debe distinguir visualmente etapa actual y etapa seleccionada con texto, estructura, foco y atributos accesibles; no únicamente mediante color.

### 4.3. Rutas

Se mantendrá la compatibilidad con las rutas existentes de EP2b y F11. Los nombres de apartados nuevos deberán mapearse a contenidos existentes cuando sea seguro hacerlo, sin duplicar páginas.

Las rutas no deben conceder operaciones. Los guards y permisos seguirán siendo la barrera de autorización existente.

### 4.4. Datos

Cada apartado debe declarar explícitamente qué fuentes reales utiliza. Los requisitos, prerrequisitos, responsables, fechas, resultados y estados deben mostrarse únicamente cuando exista una fuente real que los respalde.

Si una fuente no existe, no es compatible o no entrega un dato, la interfaz debe mostrar `Fuente no disponible`, `Estado no determinado` o `Información no disponible`, según corresponda. No se deben inferir datos desde la etapa actual, el estado general, el orden de la barra, la ruta o la ausencia de registros. La única excepción es la derivación de estados de la barra descrita en §3.4 (estados «derivados de la etapa actual»), que no aplica a requisitos, responsables, fechas ni resultados.

No se modifican contratos API en EP2c.

### 4.5. Historial e inmutabilidad

La consulta histórica usará las versiones, documentos, auditoría y casos de uso disponibles. Los documentos anteriores no se sobrescriben desde el frontend.

Las operaciones autorizadas de subsanación, corrección o nueva entrega deben continuar creando o consultando versiones mediante sus mecanismos existentes.

El historial debe distinguir entre una fuente que confirmó `Sin registros`, una fuente no disponible y un error de consulta. La ausencia de historial no puede deducirse únicamente porque la etapa no sea la etapa actual.

## 5. Requerimientos no funcionales

- Mantener Angular standalone y la separación Domain, Application, Infrastructure y Features.
- Mantener OnPush y el patrón reactivo existente.
- No modificar backend, base de datos, contratos API ni archivos `.env`.
- No instalar dependencias.
- No modificar guards o permisos sin autorización explícita.
- No duplicar `PeerAssignmentFormPage` ni lógica de EP2b.
- Mantener tokens F00 y componentes compartidos.
- Evitar colores hexadecimales directos y estilos inline innecesarios.
- Mantener responsive sin desplazamiento horizontal en la barra.
- Mantener estados de carga, error, vacío y datos no disponibles.
- Proteger accesibilidad de teclado, foco, nombres y estados.

## 6. Criterios de aceptación

### Navegación

1. Las seis etapas son seleccionables únicamente para los roles que ya tienen autorización de acceso al workspace.
2. Una etapa pendiente puede abrirse y mostrar su estado y contexto únicamente cuando ese estado esté confirmado por una fuente real.
3. Una etapa completada puede abrirse y mostrar sus antecedentes disponibles únicamente cuando una fuente real confirme la finalización o entregue esos registros.
4. La selección actualiza el contenido en el mismo workspace.
5. La URL conserva el protocolo y el apartado seleccionado.
6. Una recarga conserva el protocolo y el apartado seleccionado.
7. Navegar no ejecuta transiciones ni cambia la etapa actual.
8. La etapa actual del backend permanece visible aunque el usuario consulte otra etapa.
9. La etapa actual y la etapa seleccionada tienen una diferenciación visual y accesible.
10. La interfaz no infiere el estado individual de ninguna etapa desde `header.stage`, el estado general del protocolo, el orden de la barra, la ruta o la ausencia de registros.

### Operaciones y seguridad

11. Las operaciones se habilitan únicamente cuando cumplen rol, permiso, estado y prerrequisitos.
12. Ingresar a una etapa pendiente no habilita operaciones prematuras.
13. Los guards y permisos existentes continúan aplicándose y EP2c no amplía los roles autorizados.
14. La navegación no concede autorización para ejecutar operaciones.
15. EP2b conserva su formulario (`workspace/:id/assignment`), validaciones, origen y retorno; `workspace/:id/assignment-history` es solo consulta y la ruta vieja `/dashboard/evaluations/assignment/:id` redirige al formulario.
16. La consulta de un registro formalizado no permite modificaciones directas no autorizadas.
17. Las correcciones y subsanaciones autorizadas mantienen el mecanismo de versionamiento existente.

### Datos y trazabilidad

18. No se muestran datos ficticios en ninguna etapa.
19. `Sin registros` se muestra únicamente cuando una fuente respondió y confirmó que no existe actividad.
20. `Fuente no disponible`, `Error de consulta` y `Carga en curso` se muestran diferenciados de `Sin registros`.
21. Los requisitos, prerrequisitos, documentos, versiones, fechas, responsables y resultados se muestran solo cuando existen fuentes reales que los respalden.
22. Resolución, Seguimiento y Renovación documentan sus limitaciones sin inventar información.
23. Los errores de carga no se presentan como listas vacías exitosas.

### Pestañas y formulario (24/11/2026, §3.6)

24. Con RECEPCIÓN seleccionada, el workspace muestra solo Resumen y Validación Técnica (F11-28).
25. Con ASIGNACIÓN seleccionada, muestra solo la pestaña Asignación: el formulario para la PRESIDENTE mientras no haya asignación, el historial después (F11-29).
26. Con EVALUACIÓN, RESOLUCIÓN o RENOVACIÓN seleccionadas no hay pestañas y la página muestra «no disponible»; SEGUIMIENTO muestra su pestaña cuando existe (F11-30).
27. Al abrir el espacio, la etapa seleccionada es la etapa actual del protocolo (F11-31).
28. Dentro del espacio, el formulario no ofrece «Revisar documentación» ni «Volver a la lista» (F11-32).
29. Antes de elegir el tipo de revisión no se ve el botón «Asignar evaluadores» ni su motivo (F11-33).
30. Con la pestaña Asignación abierta, el encabezado no muestra «Asignar Pares» (F11-34).

### Protocolo ya asignado e INVESTIGADOR (24/11/2026, §3.7)

31. Con al menos una asignación activa, la pestaña Asignación muestra el historial y nunca el formulario (F11-35).
32. Con al menos una asignación activa, «Asignar Pares» no se muestra (F11-36).
33. Si la PRESIDENTE abre `workspace/:id/assignment` con asignaciones activas, ve el aviso con el enlace al historial, sin formulario ni botón (F11-37).
34. Si falla la consulta de asignaciones activas, se muestra el error con «Reintentar» y no el formulario (F11-38).
35. El INVESTIGADOR abre la etapa Asignación sin rebote ni aviso de acceso denegado y ve el mensaje reservado del comité en lugar del historial (F11-39).
36. En la pestaña Asignación del INVESTIGADOR no hay peticiones de asignaciones ni se muestran nombres, ids ni correos de evaluadores (F11-40).

### Etapas posteriores a la actual (24/11/2026, §3.8)

37. El clic en una etapa posterior a la actual no navega y muestra el aviso «info» con su nombre (F11-41).
38. La barra anuncia esas etapas como «etapa pendiente, aún no disponible», sin `aria-current` ni enlace (F11-42).
39. La URL de una etapa posterior a la actual redirige a la etapa actual con `replaceUrl` y el mismo aviso; sin etapa del backend no se bloquea nada (F11-43).
40. Una etapa alcanzada cuya pantalla no existe muestra «Esta sección todavía no está disponible en el sistema.», distinto del aviso de «aún no llega» (F11-44).
41. Completadas, cerradas y la etapa actual siguen navegables (F11-45).
42. Aplica a SECRETARIA, PRESIDENTE e INVESTIGADOR; el EVALUADOR sigue redirigido (F11-46).
43. Con el protocolo cerrado, el clic en una etapa «no aplica» no navega y avisa dónde se cerró (F11-47).
44. Con el protocolo cerrado, la URL de una etapa «no aplica» redirige a la etapa cerrada con `replaceUrl` y el mismo aviso (F11-48).

## 7. Plan de pruebas

### Unitarias

- Reglas de estados de etapa: pendiente, actual y completada.
- Separación entre etapa actual y etapa seleccionada.
- Mapeo de etapa seleccionada desde la URL.
- Política de disponibilidad de operaciones.
- Estados vacíos, errores y datos no disponibles.
- No modificación de la etapa actual al navegar.
- No inferencia del estado individual de las seis etapas desde `header.stage`, el estado general, el orden de la barra o la ruta.
- Diferenciación entre `Sin registros`, `Fuente no disponible`, `Error de consulta` y `Carga en curso`.

### Integración y routing

- Las seis rutas del workspace cargan con el mismo `:id`.
- Navegación directa y recarga conservan el apartado.
- La barra genera destinos correctos.
- Las rutas antiguas de EP2b continúan funcionando.
- `assignment` (workspace) es el formulario de asignación (EP2b); `assignment-history` carga la consulta de la etapa Asignación (historial). `/dashboard/evaluations/assignment/:id` redirige a `workspace/:id/assignment`.
- Con rol EVALUADOR activo, el espacio y cada ruta de etapa (`reception`, `assignment`, `assignment-history`, `evaluation`, `resolution`, `follow-up`, `renewal`) redirigen a «Mis evaluaciones» sin aviso (`assignment` es el formulario; el historial es `assignment-history`) (F10 D11 / S-1f); el evaluador no ve el espacio ni la barra de etapas (F11). Las pestañas `info` y `validation` siguen con el aviso de acceso de `RoleGuard`.
- Sin etapa del backend, la barra de etapas no se renderiza (F10 D19).
- Los roles no autorizados siguen siendo rechazados por los guards.
- Cambiar de rol activo no conserva acceso indebido.
- Un rol sin autorización previa para el workspace no obtiene acceso por la existencia de las seis rutas.

### Consulta histórica

- Etapas completadas muestran registros reales.
- Documentos y versiones se consultan sin sobrescribir históricos.
- Los datos ausentes se muestran como estado contextualizado.
- Una fuente que responde sin registros produce `Sin registros`.
- Un apartado sin mecanismo compatible produce `Fuente no disponible`.
- Una fuente que falla produce `Error de consulta` y permite reintentar según el patrón existente.
- Mientras la consulta está activa se muestra `Carga en curso`.
- Ninguno de esos estados se obtiene por inferencia desde `header.stage`.
- Las operaciones de corrección usan los mecanismos existentes.

### Seguridad y regresión

- PRESIDENTE mantiene la consulta y las restricciones definidas por F11.
- SECRETARIA mantiene sus operaciones de Recepción.
- INVESTIGADOR mantiene sus vistas y restricciones.
- EVALUADOR no obtiene acceso al workspace por la sola existencia de las seis rutas.
- EP2b conserva asignación, validaciones, permisos y retornos.

### Verificación técnica

- `npx tsc -p tsconfig.app.json --noEmit`
- `npx tsc -p tsconfig.spec.json --noEmit`
- ESLint de los archivos modificados.
- Pruebas unitarias y de integración disponibles.
- Build de producción.
- `git diff --check`.

Las pruebas bloqueadas por el entorno deben registrarse con su error real y no marcarse como exitosas.

## 8. Plan de implementación posterior

1. Definir el modelo de navegación de las seis etapas y sus identificadores de ruta.
2. Separar en dominio la etapa actual, la etapa seleccionada y la disponibilidad de operaciones.
3. Evolucionar la barra compartida para navegación accesible.
4. Incorporar las rutas y el contenido de consulta de cada etapa sin duplicar componentes existentes.
5. Reutilizar EP2b y cubrir su regresión antes de ampliar operaciones.
6. Integrar únicamente fuentes reales de evaluación, documentos, auditoría, resolución, seguimiento y renovación.
7. Implementar estados pendientes, vacíos, error y no disponible.
8. Revisar la protección de registros formalizados y versionamiento.
9. Agregar pruebas de navegación, recarga, permisos, histórico e inmutabilidad.
10. Ejecutar la validación técnica completa y actualizar esta especificación con resultados reales.

## 9. Limitaciones explícitas y decisiones fuera de alcance

- No se agregan endpoints para Resolución, Seguimiento o Renovación.
- No se modifican contratos API para completar datos faltantes.
- No se calculan estados de etapa en el frontend.
- No se habilitan operaciones por estar seleccionado un apartado.
- No se presentan datos simulados para demostrar una etapa.
- No se reemplaza el versionamiento existente por edición local.
- No se modifica la implementación de EP2b salvo ajustes de integración estrictamente necesarios y aprobados.
