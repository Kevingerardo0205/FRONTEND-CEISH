/**
 * TSK-015-N23 (legacy): la resolución se emite solo con la carta firmada real en PDF.
 * Sin archivo no se envía nada al almacenamiento ni al backend.
 */
export const MENSAJE_CARTA_FIRMADA_REQUERIDA = 'Debe adjuntar la carta firmada en PDF.';

/** Descarga de la carta de un protocolo que no tiene carta registrada (404 o sin ruta). */
export const MENSAJE_CARTA_NO_ENCONTRADA = 'No se encontró la carta de resolución de este protocolo.';

/** Descarga de la carta cuando la consulta falla por otra causa (no es 404). */
export const MENSAJE_CARTA_CONSULTA_FALLIDA =
  'No pudimos consultar la carta de resolución de este protocolo. Intente nuevamente.';
