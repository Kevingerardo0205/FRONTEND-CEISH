// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");

// Regla de capas de F00 (T15, plan §2). En flat config la última opción de
// no-restricted-imports reemplaza a las anteriores, así que cada bloque cubre
// carpetas que no se solapan y lleva todas sus restricciones juntas.
const NO_HTTP = {
  group: ["@angular/common/http"],
  message: "Capas: HttpClient solo en infrastructure.",
};
const NO_INFRASTRUCTURE = {
  regex: "(^@infrastructure(/|$))|(^|/)infrastructure(/|$)",
  message: "Capas: esta carpeta no puede importar infrastructure.",
};
const NO_ANGULAR = {
  regex: "^@angular/",
  message: "Capas: domain no importa @angular.",
};
const NO_FEATURES = {
  regex: "(^@features/)|(^|/)features/",
  message: "Capas: shared/ui no importa secciones (features).",
};
const NO_OTHER_FEATURES = {
  regex: "(^@features/(?!shell(/|$)))|(^|/)features/(?!shell(/|$))",
  message: "Capas: shell no importa otras secciones.",
};
const NO_OTHER_FEATURES_EXCEPT_AUTH = {
  regex: "(^@features/(?!(shell|auth)(/|$)))|(^|/)features/(?!(shell|auth)(/|$))",
  message: "Capas: la única excepción de shell es @features/auth (plan §2).",
};

const layers = (files, patterns, extra = {}) => ({
  files,
  ...extra,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

// F01 (T01-8, plan §6): cada sección solo importa su propia carpeta de features.
const noOtherFeatures = (name) => ({
  regex: `(^@features/(?!${name}(/|$)))|(^|/)features/(?!${name}(/|$))`,
  message: `Capas: ${name} no importa otras secciones.`,
});
const NO_UPPER_LAYERS = {
  regex: "(^|/)(application|presentation)(/|$)",
  message: "Capas: domain no importa application ni presentation.",
};
// presentation y application: sin HttpClient ni infrastructure. domain: sin @angular (incluye
// @angular/common/http), infrastructure, application ni presentation. infrastructure y la raíz de
// composición (<feature>.providers.ts) sí importan su infrastructure.
const f01Layers = (f) => [
  layers(
    [`src/features/${f}/presentation/**/*.ts`, `src/features/${f}/application/**/*.ts`],
    [NO_HTTP, NO_INFRASTRUCTURE, noOtherFeatures(f)],
  ),
  layers(
    [`src/features/${f}/domain/**/*.ts`],
    [NO_ANGULAR, NO_INFRASTRUCTURE, NO_UPPER_LAYERS, noOtherFeatures(f)],
  ),
  layers([`src/features/${f}/infrastructure/**/*.ts`, `src/features/${f}/*.ts`], [noOtherFeatures(f)]),
];

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
    },
  },
  // R1: shared/ui
  layers(["src/shared/ui/**/*.ts"], [NO_HTTP, NO_INFRASTRUCTURE, NO_FEATURES]),
  // R1 + R4: presentation de shell
  layers(["src/features/shell/presentation/**/*.ts"], [NO_HTTP, NO_INFRASTRUCTURE, NO_OTHER_FEATURES]),
  // R2 + R4: application de shell
  layers(["src/features/shell/application/**/*.ts"], [NO_HTTP, NO_INFRASTRUCTURE, NO_OTHER_FEATURES]),
  // R3 + R4: domain de shell
  layers(["src/features/shell/domain/**/*.ts"], [NO_ANGULAR, NO_INFRASTRUCTURE, NO_OTHER_FEATURES]),
  // R3: archivos de dominio de F00 (el resto de src/domain se migra por sección)
  layers(
    [
      "src/domain/value-objects/stage.vo.ts",
      "src/domain/value-objects/role.vo.ts",
      "src/domain/entities/menu-item.entity.ts",
      "src/domain/ports/menu-config.port.ts",
    ],
    [NO_ANGULAR, NO_INFRASTRUCTURE],
  ),
  // R4: infrastructure de shell y raíz de composición (shell.providers.ts puede importar su infrastructure)
  layers(
    ["src/features/shell/infrastructure/**/*.ts", "src/features/shell/*.ts"],
    [NO_OTHER_FEATURES],
    { ignores: ["src/features/shell/infrastructure/auth-session.adapter.ts"] },
  ),
  // R4, excepción conocida (plan §2): el adapter de roles lee AuthFacade
  layers(
    ["src/features/shell/infrastructure/auth-session.adapter.ts"],
    [NO_OTHER_FEATURES_EXCEPT_AUTH],
  ),
  // F01: pendientes y protocolos
  ...f01Layers("pendientes"),
  ...f01Layers("protocolos"),
  // F02: espacio del protocolo (plan §6)
  ...f01Layers("espacio-protocolo"),
  // F01: utilidad compartida de fechas
  layers(["src/shared/utils/fecha-ecuador.util.ts"], [NO_ANGULAR, NO_HTTP, NO_INFRASTRUCTURE, NO_FEATURES]),
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.spec.ts",
      "**/test/**",
      "eslint.config.*",
    ],
  }
);
