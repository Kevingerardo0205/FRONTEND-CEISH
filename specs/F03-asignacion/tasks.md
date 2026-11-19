# F03 · Asignación de evaluadores por la Presidenta — tareas

**Rama:** `feat/asignacion-presidenta` (desde `dev` con EP1b, `444c49f`). Se fusiona junto con TSK-002-N52 del backend.
**Línea base (19/11/2026, `444c49f`):** `tsc` app y spec exit 0; `npx ng test --watch=false` cuatro veces: `2 FAILED, 1476 SUCCESS`, `1478 SUCCESS`, `1478 SUCCESS`, `1 FAILED, 1477 SUCCESS` (fallo intermitente anotado en F00 `tasks.md`); `npx ng build --configuration production` exit 0; `npx eslint "src/**/*.ts"` `✖ 68 problems (0 errors, 68 warnings)`.
**Verificación:** `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -p tsconfig.spec.json --noEmit` · `npx ng test --watch=false` tres veces · `npx ng build --configuration production` · `npx eslint` (ningún aviso nuevo).

| # | Capa | Tarea | Archivos | Terminado cuando… | Estado |
|---|---|---|---|---|---|
| AP1 | todas | Asignación por la Presidenta (D1 a D10), retiro de la asignación de la Secretaría y perfil Bioético | `plan.md` §1 | EARS 1 a 12 con pruebas; mutaciones M1 a M13 detectadas; verificación limpia | En curso |

**Mutaciones previstas (AP1):**

| # | Qué se rompe |
|---|---|
| M1 | `BIOETICO` fuera de `PEER_EVALUATOR_PROFILES` |
| M2 | mínimo de 1 evaluador en lugar de 2 |
| M3 | sin la regla «al menos uno que no sea de Sociedad Civil» |
| M4 | sin la regla «al menos uno de Sociedad Civil» |
| M5 | se permiten personas repetidas |
| M6 | la fila de Sociedad Civil se puede quitar en la expedita |
| M7 | aparece la fila de un perfil sin miembros |
| M8 | se vuelve a enviar `{ evaluatorIds }` (código anterior) |
| M9 | texto genérico en lugar del mensaje del backend |
| M10 | `ASSIGN_EVALUATORS: ['SECRETARIA']` |
| M11 | sin la opción del menú de PRESIDENTE, o las rutas con `roles: ['SECRETARIA']` |
| M12 | vuelve la pestaña «Estratificación de Riesgo» de la Secretaría |
| M13 | en pleno, el perfil viene elegido por defecto |
