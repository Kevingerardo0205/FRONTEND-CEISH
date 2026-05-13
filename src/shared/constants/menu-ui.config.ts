export interface MenuUIItem {
  label: string;
  icon: string;
  path?: string;
}

export const MODULE_UI_MAP: Record<string, MenuUIItem> = {
  'MOD_DASHBOARD': { label: 'Panel Principal', icon: 'dashboard' },
  'MOD_RECEPCION': { label: 'Recepción de Protocolos', icon: 'file_download' },
  'MOD_EVALUACION': { label: 'Evaluaciones Éticas', icon: 'gavel' },
  'MOD_RESOLUCION': { label: 'Resoluciones', icon: 'description' },
  'MOD_SEGUIMIENTO': { label: 'Seguimiento', icon: 'history' },
  'MOD_USUARIOS': { label: 'Gestión de Usuarios', icon: 'group' },
  'MOD_REPORTES': { label: 'Reportes y Estadísticas', icon: 'analytics' },
  'MOD_CONFIG': { label: 'Configuración', icon: 'settings' }
};

export const PERMISSION_UI_MAP: Record<string, MenuUIItem> = {
  'DASHBOARD_VER_PRINCIPAL': { label: 'Inicio', icon: 'home', path: '/dashboard/home' },
  'USUARIOS_VER': { label: 'Usuarios del Sistema', icon: 'person_search', path: '/dashboard/admin/users' },
  'RECEPCION_SUBIR_DOCUMENTOS': { label: 'Mis Protocolos', icon: 'description', path: '/dashboard/investigador/mis-protocolos' },
  'RECEPCION_INICIAR': { label: 'Nuevo Protocolo', path: '/dashboard/investigador/nuevo-protocolo', icon: 'add_circle' },
  'DOCUMENTOS_VALIDAR': { label: 'Validación Técnica', path: '/dashboard/protocols/validation/list', icon: 'fact_check' },
  'EVALUADORES_ASIGNAR': { label: 'Asignación de Pares', path: '/dashboard/evaluations/assignment', icon: 'assignment_ind' },
  'EVALUACION_COMPLETAR_FORMULARIO': { label: 'Mis Evaluaciones', path: '/dashboard/evaluations/list', icon: 'rate_review' },
  'RESOLUCION_CREAR': { label: 'Generar Resolución', path: '/dashboard/resolutions/generator', icon: 'article' },
  'ADMIN_ALL': { label: 'Bitácora de Auditoría', path: '/dashboard/audit', icon: 'security' },
  'NOTIFICACIONES_VER': { label: 'Notificaciones', path: '/dashboard/notifications', icon: 'notifications' }
};

/**
 * Convierte un código técnico (UPPER_CASE) a Sentence case amigable.
 * Ej: "RECEPCION_NUEVO" -> "Recepcion nuevo"
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(/_/g, ' ').toLowerCase();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
