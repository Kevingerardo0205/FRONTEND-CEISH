import { ContractError } from '@infrastructure/mappers/contract-readers';
import { Stage } from '@domain/value-objects/stage.vo';
import { ProtocolHeaderMapper } from './protocol-header.mapper';

// Contrato de GET /api/protocols/:id (backend toListResponse, TSK-001.27). Datos ficticios.
const PROTOCOLO = {
  id: 5,
  ceishCode: 'CEISH-ESPOCH-IO-034-2026',
  title: 'Estudio ficticio de adherencia al tratamiento',
  version: '2.0',
  receptionStatus: 'COMPLETO',
  statusId: 13,
  riskLevel: 'Riesgo mínimo',
  riskLevelCode: 'MINIMO',
  etapa: 'EVALUACION',
  etapaOrden: 3,
  principalInvestigator: { id: 7, fullName: 'Investigador de prueba' },
};

describe('ProtocolHeaderMapper (F10 D18)', () => {
  it('lee código, versión, título, riesgo y etapa del objeto solo', () => {
    expect(ProtocolHeaderMapper.toHeader(PROTOCOLO)).toEqual({
      code: 'CEISH-ESPOCH-IO-034-2026',
      version: '2.0',
      title: 'Estudio ficticio de adherencia al tratamiento',
      riskLevel: 'Riesgo mínimo',
      stage: Stage.fromBackend('EVALUACION'),
    });
  });

  it('D19: la etapa sale de `etapa` y su orden de Stage, sin mirar etapaOrden', () => {
    const header = ProtocolHeaderMapper.toHeader({ ...PROTOCOLO, etapa: 'SEGUIMIENTO', etapaOrden: 1 });

    expect(header.stage?.code).toBe('SEGUIMIENTO');
    expect(header.stage?.order).toBe(5);
  });

  it('D19: etapa null, ausente o desconocida → sin etapa (no hay barra)', () => {
    expect(ProtocolHeaderMapper.toHeader({ ...PROTOCOLO, etapa: null }).stage).toBeNull();
    expect(ProtocolHeaderMapper.toHeader({ title: 'Estudio ficticio' }).stage).toBeNull();
    expect(ProtocolHeaderMapper.toHeader({ ...PROTOCOLO, etapa: 'ARCHIVO' }).stage).toBeNull();
  });

  it('D19: riskLevel null es «sin fijar» (null); sin la clave queda undefined', () => {
    expect(ProtocolHeaderMapper.toHeader({ ...PROTOCOLO, riskLevel: null }).riskLevel).toBeNull();
    expect(ProtocolHeaderMapper.toHeader({ title: 'Estudio ficticio' }).riskLevel).toBeUndefined();
  });

  it('acepta el envoltorio del ResponseInterceptor, también doble', () => {
    const envoltorio = { statusCode: 200, message: 'Success', data: PROTOCOLO };
    const doble = { statusCode: 200, message: 'Success', data: envoltorio };

    expect(ProtocolHeaderMapper.toHeader(envoltorio).title).toBe(PROTOCOLO.title);
    expect(ProtocolHeaderMapper.toHeader(doble).code).toBe(PROTOCOLO.ceishCode);
  });

  it('sin datos entrega null: sin "Sin título", "DESCONOCIDO", version 1 ni fecha de hoy', () => {
    const header = ProtocolHeaderMapper.toHeader({ id: 5, receptionStatus: 'COMPLETO' });

    expect(header).toEqual({
      code: null,
      version: null,
      title: null,
      riskLevel: undefined,
      stage: null,
    });
  });

  it('null y textos vacíos o con solo espacios también son null', () => {
    const header = ProtocolHeaderMapper.toHeader({
      id: 5,
      ceishCode: null,
      title: '   ',
      version: '',
      riskLevel: null,
    });

    expect(header).toEqual({ code: null, version: null, title: null, riskLevel: null, stage: null });
  });

  it('quita los espacios de los extremos', () => {
    expect(ProtocolHeaderMapper.toHeader({ title: '  Estudio ficticio  ' }).title).toBe(
      'Estudio ficticio',
    );
  });

  it('una versión numérica se lee como texto', () => {
    expect(ProtocolHeaderMapper.toHeader({ version: 3 }).version).toBe('3');
  });

  it('un campo con otro tipo lanza ContractError con su ruta', () => {
    expect(() => ProtocolHeaderMapper.toHeader({ title: 42 })).toThrowMatching(
      (e) => e instanceof ContractError && e.path === 'response.title',
    );
    expect(() =>
      ProtocolHeaderMapper.toHeader({ statusCode: 200, message: 'Success', data: { riskLevel: {} } }),
    ).toThrowMatching((e) => e instanceof ContractError && e.path === 'data.riskLevel');
    expect(() => ProtocolHeaderMapper.toHeader({ etapa: 3 })).toThrowMatching(
      (e) => e instanceof ContractError && e.path === 'response.etapa',
    );
    expect(() => ProtocolHeaderMapper.toHeader({ version: true })).toThrowMatching(
      (e) => e instanceof ContractError && e.path === 'response.version',
    );
  });

  it('un cuerpo que no es objeto lanza ContractError', () => {
    expect(() => ProtocolHeaderMapper.toHeader(null)).toThrowError(ContractError);
    expect(() => ProtocolHeaderMapper.toHeader([PROTOCOLO])).toThrowError(ContractError);
  });
});
