import { ContractError } from '@infrastructure/mappers/contract-readers';
import { ProtocolHeaderMapper } from './protocol-header.mapper';

// Contrato de GET /api/protocols/:id (backend protocol.mapper.ts:45-100). Datos ficticios.
const PROTOCOLO = {
  id: 5,
  ceishCode: 'CEISH-ESPOCH-IO-034-2026',
  title: 'Estudio ficticio de adherencia al tratamiento',
  version: '2.0',
  receptionStatus: 'COMPLETO',
  statusId: 13,
  riskLevel: 'Riesgo mínimo',
};

describe('ProtocolHeaderMapper (F10 D18)', () => {
  it('lee código, versión, título y riesgo del objeto solo', () => {
    expect(ProtocolHeaderMapper.toHeader(PROTOCOLO)).toEqual({
      code: 'CEISH-ESPOCH-IO-034-2026',
      version: '2.0',
      title: 'Estudio ficticio de adherencia al tratamiento',
      riskLevel: 'Riesgo mínimo',
    });
  });

  it('acepta el envoltorio del ResponseInterceptor, también doble', () => {
    const envoltorio = { statusCode: 200, message: 'Success', data: PROTOCOLO };
    const doble = { statusCode: 200, message: 'Success', data: envoltorio };

    expect(ProtocolHeaderMapper.toHeader(envoltorio).title).toBe(PROTOCOLO.title);
    expect(ProtocolHeaderMapper.toHeader(doble).code).toBe(PROTOCOLO.ceishCode);
  });

  it('sin datos entrega null: sin "Sin título", "DESCONOCIDO", version 1 ni fecha de hoy', () => {
    const header = ProtocolHeaderMapper.toHeader({ id: 5, receptionStatus: 'COMPLETO' });

    expect(header).toEqual({ code: null, version: null, title: null, riskLevel: null });
  });

  it('null y textos vacíos o con solo espacios también son null', () => {
    const header = ProtocolHeaderMapper.toHeader({
      id: 5,
      ceishCode: null,
      title: '   ',
      version: '',
      riskLevel: null,
    });

    expect(header).toEqual({ code: null, version: null, title: null, riskLevel: null });
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
    expect(() => ProtocolHeaderMapper.toHeader({ version: true })).toThrowMatching(
      (e) => e instanceof ContractError && e.path === 'response.version',
    );
  });

  it('un cuerpo que no es objeto lanza ContractError', () => {
    expect(() => ProtocolHeaderMapper.toHeader(null)).toThrowError(ContractError);
    expect(() => ProtocolHeaderMapper.toHeader([PROTOCOLO])).toThrowError(ContractError);
  });
});
