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
  'DASHBOARD_RESUMEN': { label: 'Resumen', icon: 'analytics', path: '/dashboard/home' },
  'USUARIOS_VER': { label: 'Gestión de Usuarios', icon: 'people', path: '/dashboard/admin/users' },
  'USUARIOS_CREAR': { label: 'Nuevo Profesional', icon: 'person_add', path: '/dashboard/admin/users' },
  'PERMISOS_GESTIONAR': { label: 'Roles y Permisos', icon: 'admin_panel_settings', path: '/dashboard/admin/security' },
  'CONFIG_PLANTILLAS': { label: 'Configuración Plantillas', path: '/dashboard/admin/templates', icon: 'settings_system_daydream' },
  
  // Recepción de Protocolos (Secretaría / Admin)
  'RECEPCION_NUEVO': { label: 'Recepción Nueva', path: '/dashboard/protocols/reception/new', icon: 'add_task' },
  'RECEPCION_VER': { label: 'Recepción Nueva', path: '/dashboard/protocols/reception/new', icon: 'add_task' },
  'RECEPCION_LISTA': { label: 'Bandeja de Protocolos', path: '/dashboard/protocols/list', icon: 'list_alt' },
  'RECEPCION_VALIDAR': { label: 'Bandeja de Protocolos', path: '/dashboard/protocols/list', icon: 'list_alt' },
  'RECEPCION_BUSCAR': { label: 'Bandeja de Protocolos', path: '/dashboard/protocols/list', icon: 'list_alt' },
  'RECEPCION_CONSTANCIAS': { label: 'Archivo de Constancias', path: '/dashboard/home', icon: 'folder_zip' },
  
  // Investigador
  'RECEPCION_SUBIR_DOCUMENTOS': { label: 'Mis Protocolos', icon: 'description', path: '/dashboard/investigador/mis-protocolos' },
  'RECEPCION_INICIAR': { label: 'Nuevo Protocolo', path: '/dashboard/investigador/nuevo-protocolo', icon: 'add_circle' },
  'RECEPCION_CREAR': { label: 'Nuevo Protocolo', path: '/dashboard/investigador/nuevo-protocolo', icon: 'add_circle' },
  'PROTOCOLOS_CREAR': { label: 'Nuevo Protocolo', path: '/dashboard/investigador/nuevo-protocolo', icon: 'add_circle' },
  
  // Evaluaciones
  'DOCUMENTOS_VALIDAR': { label: 'Bandeja de Protocolos', path: '/dashboard/protocols/list', icon: 'list_alt' },
  'EVALUACION_RIESGO': { label: 'Clasificación de Riesgo', path: '/dashboard/home', icon: 'warning' },
  'EVALUACION_ASIGNAR': { label: 'Asignación de Evaluadores', path: '/dashboard/evaluations/assignment', icon: 'assignment_ind' },
  'EVALUATORS_ASSIGN': { label: 'Asignación de Evaluadores', path: '/dashboard/evaluations/assignment', icon: 'assignment_ind' },
  'EVALUATORS_SUGGEST': { label: 'Asignación de Evaluadores', path: '/dashboard/evaluations/assignment', icon: 'how_to_reg' },
  'EVALUACION_EXPEDITA': { label: 'Revisión Expedita', path: '/dashboard/home', icon: 'bolt' },
  'EVALUACION_PLENO': { label: 'Sesión de Pleno', path: '/dashboard/home', icon: 'groups' },
  'EVALUACION_SUBSANACIONES': { label: 'Subsanaciones', path: '/dashboard/evaluacion-etica/subsanaciones', icon: 'edit_calendar' },
  'EVALUATION_FILL': { label: 'Mis Evaluaciones', path: '/dashboard/evaluations/list', icon: 'rate_review' },
  'EVALUACION_COMPLETAR_FORMULARIO': { label: 'Mis Evaluaciones', path: '/dashboard/evaluations/list', icon: 'rate_review' },
  'EVALUACION_VER_PROPIAS': { label: 'Mis Evaluaciones', path: '/dashboard/evaluations/list', icon: 'rate_review' },
  'EVALUACION_INFORMES': { label: 'Consolidación (Anexo 12)', path: '/dashboard/evaluations/consolidation', icon: 'summarize' },
  
  // Resoluciones
  'RESOLUCION_CREAR': { label: 'Generar Resoluciones', path: '/dashboard/resolutions', icon: 'description' },
  'RESOLUCION_FIRMAR': { label: 'Firma Electrónica', path: '/dashboard/home', icon: 'draw' },
  'RESOLUCION_NOTIF': { label: 'Notificar Resoluciones', path: '/dashboard/home', icon: 'mail' },
  'RESOLUCION_HISTORIAL': { label: 'Historial Resoluciones', path: '/dashboard/home', icon: 'history_edu' },
  
  // Seguimiento
  'SEGUIMIENTO_VER': { label: 'Panel de Seguimiento', path: '/dashboard/follow-up', icon: 'history' },
  'SEGUIMIENTO_AVANCE': { label: 'Informes de Avance', path: '/dashboard/home', icon: 'query_stats' },
  'SEGUIMIENTO_FINAL': { label: 'Informes Finales', path: '/dashboard/home', icon: 'task_alt' },
  'SEGUIMIENTO_ENMIENDAS': { label: 'Solicitud Enmiendas', path: '/dashboard/home', icon: 'edit_note' },
  'SEGUIMIENTO_RENOVACIONES': { label: 'Solicitud Renovación', path: '/dashboard/home', icon: 'autorenew' },
  
  // Auditoría y Otros
  'ADMIN_ALL': { label: 'Bitácora de Auditoría', path: '/dashboard/audit', icon: 'security' },
  'REPORTES_VER': { label: 'Reportes y Estadísticas', path: '/dashboard/reports', icon: 'analytics' },
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
