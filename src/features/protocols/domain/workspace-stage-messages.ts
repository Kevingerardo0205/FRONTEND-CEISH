/** Aviso (tipo «info») al intentar abrir una etapa posterior a la actual (F11-41, F11-43). */
export function stageNotReachedMessage(stageLabel: string): string {
  return `El protocolo aún no está en la etapa ${stageLabel}. Podrá verla cuando llegue a ella.`;
}

/** Aviso (tipo «info») al intentar abrir una etapa «no aplica» de un protocolo cerrado (F11-47, F11-48). */
export function stageClosedMessage(closedStageLabel: string): string {
  return `El protocolo se cerró en la etapa ${closedStageLabel}; esta etapa no aplica.`;
}

/** Etapa ya alcanzada cuya pantalla aún no existe: distinto de «aún no llega» (F11-44). */
export const STAGE_SCREEN_MISSING_MESSAGE = 'Esta sección todavía no está disponible en el sistema.';
