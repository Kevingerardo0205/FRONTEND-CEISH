import { protocolStatusTone } from './protocol-status-tone';
import { ProtocolUI } from './protocol-ui.util';

describe('protocolStatusTone (regla T14b de F00)', () => {
  it('pasa cada clase de ProtocolUI a su tono', () => {
    expect(protocolStatusTone('pending')).toBe('ambar');
    expect(protocolStatusTone('review')).toBe('azul');
    expect(protocolStatusTone('approved')).toBe('verde');
    expect(protocolStatusTone('rejected')).toBe('rojo');
  });

  it('cualquier otro valor, o ninguno, es gris', () => {
    expect(protocolStatusTone('otra')).toBe('gris');
    expect(protocolStatusTone('')).toBe('gris');
    expect(protocolStatusTone(null)).toBe('gris');
    expect(protocolStatusTone(undefined)).toBe('gris');
  });

  it('con ProtocolUI: aprobado verde, rechazado rojo, en evaluación azul y borrador ámbar', () => {
    expect(protocolStatusTone(ProtocolUI.class('APROBADO'))).toBe('verde');
    expect(protocolStatusTone(ProtocolUI.class('RECHAZADO'))).toBe('rojo');
    expect(protocolStatusTone(ProtocolUI.class('EN_EVALUACION'))).toBe('azul');
    expect(protocolStatusTone(ProtocolUI.class('BORRADOR'))).toBe('ambar');
  });
});
