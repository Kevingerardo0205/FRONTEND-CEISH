import {
  agruparMisProtocolos,
  esInvestigadorPrincipal,
  fechaAceptacion,
  filaComite,
  numeroDeVersion,
  textoDocumentosBorrador,
  textoObservados,
  textoPlazoCorreccion,
  tipoDeAccion,
} from './mis-protocolos.rules';
import { EstadoProtocolo, ProtocoloResumen } from './dtos/crear-protocolo.dto';

/** Reglas puras de Mis protocolos (F09 D21 a D26, MP1); sin TestBed. */

function protocolo(id: number, cambios: Partial<ProtocoloResumen> = {}): ProtocoloResumen {
  return {
    id,
    codigoCeish: '',
    titulo: `Estudio de prueba numero ${id} del investigador`,
    estado: EstadoProtocolo.BORRADOR,
    fechaCreacion: '2026-11-01',
    ...cambios,
  };
}

describe('mis-protocolos.rules (F09 MP1)', () => {
  it('tipoDeAccion: cada receptionStatus de Necesita su acción y null para los demás', () => {
    expect(tipoDeAccion(protocolo(1), false)).toBe('borrador');
    expect(tipoDeAccion(protocolo(2, { estado: EstadoProtocolo.COMPLETO }), false)).toBe('tiempos');
    expect(
      tipoDeAccion(protocolo(2, { estado: EstadoProtocolo.COMPLETO, isTimelineTermsAccepted: true }), false),
    ).toBeNull();
    expect(
      tipoDeAccion(protocolo(2, { estado: EstadoProtocolo.COMPLETO, isTimelineTermsAccepted: true }), true),
    ).toBe('tiempos');
    expect(tipoDeAccion(protocolo(3, { estado: 'INCOMPLETO' as EstadoProtocolo }), false)).toBe('observaciones');
    expect(tipoDeAccion(protocolo(4, { estado: 'EVALUACION_SUBSANACIONES' as EstadoProtocolo }), false)).toBe(
      'correcciones',
    );
    expect(tipoDeAccion(protocolo(4, { estado: 'PENDIENTE_SUBSANACION' as EstadoProtocolo }), false)).toBe(
      'correcciones',
    );
    expect(tipoDeAccion(protocolo(5, { estado: EstadoProtocolo.EN_REVISION_SECRETARIA }), false)).toBeNull();
    expect(tipoDeAccion(protocolo(8, { estado: EstadoProtocolo.ARCHIVADO }), false)).toBeNull();
  });

  it('agruparMisProtocolos: ordena Necesita su acción por tipo y conserva el orden del backend', () => {
    const grupos = agruparMisProtocolos(
      [
        protocolo(30, { estado: 'INCOMPLETO' as EstadoProtocolo }),
        protocolo(10),
        protocolo(20, { estado: EstadoProtocolo.EN_REVISION_SECRETARIA }),
        protocolo(11),
        protocolo(40, { estado: EstadoProtocolo.ARCHIVADO }),
      ],
      new Set(),
    );
    expect(grupos.accion.map((a) => a.protocolo.id)).toEqual([10, 11, 30]);
    expect(grupos.comite.map((p) => p.id)).toEqual([20]);
    expect(grupos.archivados.map((p) => p.id)).toEqual([40]);
  });

  it('textoDocumentosBorrador: N de M con la regla de D16', () => {
    expect(
      textoDocumentosBorrador([
        { status: 'PRESENTADO' },
        { status: 'APROBADO' },
        { status: 'PENDIENTE' },
        { status: 'NO_APLICA' },
      ]),
    ).toBe('2 de 3 documentos subidos · sin código hasta que la Secretaría lo reciba');
    expect(textoDocumentosBorrador([{ status: 'APROBADO' }])).toBe(
      '1 de 1 documento subido · sin código hasta que la Secretaría lo reciba',
    );
    expect(textoDocumentosBorrador(undefined)).toBe('Sin código hasta que la Secretaría lo reciba');
  });

  it('textoObservados: solo cuenta RECHAZADO', () => {
    expect(textoObservados([{ status: 'RECHAZADO' }, { status: 'NO_PRESENTADO' }])).toBe(
      'La Secretaría observó 1 documento.',
    );
    expect(textoObservados([{ status: 'RECHAZADO' }, { status: 'RECHAZADO' }, { status: 'RECHAZADO' }])).toBe(
      'La Secretaría observó 3 documentos.',
    );
    expect(textoObservados([])).toBe('La Secretaría pidió completar la documentación.');
  });

  it('textoPlazoCorreccion: fecha de calendario sin correr el día; null si no es válida', () => {
    expect(textoPlazoCorreccion('2026-12-04')).toBe('Corrija hasta el 04/12/2026.');
    expect(textoPlazoCorreccion('2026-02-30')).toBeNull();
    expect(textoPlazoCorreccion(null)).toBeNull();
  });

  it('esInvestigadorPrincipal: solo con el mismo id; sin usuario o sin principal, no', () => {
    expect(esInvestigadorPrincipal(protocolo(1, { principalInvestigatorId: 30 }), 30)).toBeTrue();
    expect(esInvestigadorPrincipal(protocolo(1, { principalInvestigatorId: 99 }), 30)).toBeFalse();
    expect(esInvestigadorPrincipal(protocolo(1, { principalInvestigatorId: null }), 30)).toBeFalse();
    expect(esInvestigadorPrincipal(protocolo(1, { principalInvestigatorId: 30 }), null)).toBeFalse();
  });

  it('fechaAceptacion: la del backend (con o sin data) en hora de Ecuador; si no viene, el instante dado', () => {
    const ahora = new Date('2026-11-17T20:00:00.000Z');
    expect(fechaAceptacion({ data: { timelineTermsAcceptedAt: '2026-11-18T03:30:00.000Z' } }, ahora)).toBe(
      '17/11/2026',
    );
    expect(fechaAceptacion({ timelineTermsAcceptedAt: '2026-11-18T06:00:00.000Z' }, ahora)).toBe('18/11/2026');
    expect(fechaAceptacion({ message: 'ok' }, new Date('2026-11-18T04:00:00.000Z'))).toBe('17/11/2026');
    expect(fechaAceptacion(null, ahora)).toBe('17/11/2026');
  });

  it('filaComite: etapa nula o desconocida → sin etapa y la etiqueta que ya existe', () => {
    expect(filaComite(protocolo(5, { estado: EstadoProtocolo.EN_REVISION_SECRETARIA, etapa: null }))).toEqual({
      etapa: null,
      linea: 'Revisión Secretaría',
    });
    expect(filaComite(protocolo(5, { etapa: 'OTRA', statusId: 18 }))).toEqual({
      etapa: null,
      linea: 'Rechazado',
    });
    expect(filaComite(protocolo(5, { etapa: 'SEGUIMIENTO', statusId: 17 }))).toEqual({
      etapa: 'Seguimiento',
      linea: 'Aprobado',
    });
  });

  it('numeroDeVersion (T09-6): entero > 0 o 1', () => {
    expect(numeroDeVersion(1)).toBe(1);
    expect(numeroDeVersion(3)).toBe(3);
    expect(numeroDeVersion('1.0')).toBe(1);
    expect(numeroDeVersion('2.0')).toBe(1);
    expect(numeroDeVersion(0)).toBe(1);
    expect(numeroDeVersion(undefined)).toBe(1);
  });
});
