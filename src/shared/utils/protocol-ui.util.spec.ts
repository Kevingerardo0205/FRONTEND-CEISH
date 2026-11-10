import { ProtocolUI } from './protocol-ui.util';

describe('ProtocolUI.label', () => {
  it('muestra "Borrador" para BORRADOR', () => {
    expect(ProtocolUI.label('BORRADOR')).toBe('Borrador');
  });

  it('muestra "Borrador" para borrador', () => {
    expect(ProtocolUI.label('borrador')).toBe('Borrador');
  });

  it('muestra "Correcciones sin enviar" para EVALUACION_SUBSANACIONES', () => {
    expect(ProtocolUI.label('EVALUACION_SUBSANACIONES')).toBe('Correcciones sin enviar');
  });

  it('mantiene "Iniciado" para INICIADO', () => {
    expect(ProtocolUI.label('INICIADO')).toBe('Iniciado');
  });

  it('mantiene "Subsanación Documental" para PENDIENTE_SUBSANACION', () => {
    expect(ProtocolUI.label('PENDIENTE_SUBSANACION')).toBe('Subsanación Documental');
  });

  it('mantiene "Revisión Secretaría" para EN_REVISION_SECRETARIA', () => {
    expect(ProtocolUI.label('EN_REVISION_SECRETARIA')).toBe('Revisión Secretaría');
  });

  it('muestra "Desconocido" para undefined', () => {
    expect(ProtocolUI.label(undefined)).toBe('Desconocido');
  });

  it('mantiene XYZ para un estado desconocido', () => {
    expect(ProtocolUI.label('XYZ')).toBe('XYZ');
  });
});

describe('ProtocolUI.class', () => {
  it('devuelve pending para BORRADOR', () => {
    expect(ProtocolUI.class('BORRADOR')).toBe('pending');
  });

  it('devuelve pending para EVALUACION_SUBSANACIONES', () => {
    expect(ProtocolUI.class('EVALUACION_SUBSANACIONES')).toBe('pending');
  });

  it('mantiene review para EN_REVISION_SECRETARIA', () => {
    expect(ProtocolUI.class('EN_REVISION_SECRETARIA')).toBe('review');
  });

  it('mantiene rejected para PENDIENTE_SUBSANACION', () => {
    expect(ProtocolUI.class('PENDIENTE_SUBSANACION')).toBe('rejected');
  });

  it('mantiene pending para undefined', () => {
    expect(ProtocolUI.class(undefined)).toBe('pending');
  });
});