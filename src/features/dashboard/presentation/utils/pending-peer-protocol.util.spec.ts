import { toPendingPeerProtocols } from './pending-peer-protocol.util';

describe('toPendingPeerProtocols (F01 T01-0)', () => {
  const now = () => '2026-11-05T12:00:00.000Z';

  it('formato anidado: conserva los campos tal como llegan', () => {
    const [p] = toPendingPeerProtocols(
      [
        {
          id: 7,
          ceishCode: 'IO-999-2026',
          title: 'Estudio de prueba',
          receptionStatus: 'COMPLETO',
          isRiskLevelDesignated: true,
          createdAt: '2026-10-01T10:00:00.000Z',
          studyType: { id: 2, codigo: 'IO', nombre: 'Observacional' },
          principalInvestigatorRecord: {
            id: 9,
            fullName: 'Investigador de prueba',
            email: 'investigador@example.test',
          },
        },
      ],
      now,
    );

    expect(p).toEqual({
      id: 7,
      ceishCode: 'IO-999-2026',
      title: 'Estudio de prueba',
      receptionStatus: 'COMPLETO',
      isRiskLevelDesignated: true,
      createdAt: '2026-10-01T10:00:00.000Z',
      studyType: { id: 2, codigo: 'IO', nombre: 'Observacional' },
      principalInvestigatorRecord: {
        id: 9,
        fullName: 'Investigador de prueba',
        email: 'investigador@example.test',
      },
    });
  });

  it('formato plano y alias: code, titulo, status, submissionDate, studyTypeCode, type, principalInvestigator', () => {
    const [p] = toPendingPeerProtocols(
      [
        {
          id: '12',
          code: 'EI-998-2026',
          titulo: 'Título plano',
          status: 'EN_REVISION_SECRETARIA',
          submissionDate: '2026-09-15T08:00:00.000Z',
          studyTypeCode: 'EI',
          type: 'Intervención',
          principalInvestigator: 'Investigador plano',
        },
      ],
      now,
    );

    expect(p).toEqual({
      id: 12,
      ceishCode: 'EI-998-2026',
      title: 'Título plano',
      receptionStatus: 'EN_REVISION_SECRETARIA',
      isRiskLevelDesignated: false,
      createdAt: '2026-09-15T08:00:00.000Z',
      studyType: { id: 0, codigo: 'EI', nombre: 'Intervención' },
      principalInvestigatorRecord: { id: 0, fullName: 'Investigador plano', email: '' },
    });
  });

  it('alias anidados: studyType.code/name y principalInvestigatorRecord.nombre; estado y receptionDate', () => {
    const [p] = toPendingPeerProtocols(
      [
        {
          id: 3,
          estado: 'COMPLETO',
          receptionDate: '2026-08-01T00:00:00.000Z',
          studyType: { code: 'EC', name: 'Clínico' },
          principalInvestigatorRecord: { nombre: 'Nombre alterno' },
        },
      ],
      now,
    );

    expect(p.receptionStatus).toBe('COMPLETO');
    expect(p.createdAt).toBe('2026-08-01T00:00:00.000Z');
    expect(p.studyType).toEqual({ id: 0, codigo: 'EC', nombre: 'Clínico' });
    expect(p.principalInvestigatorRecord).toEqual({ id: 0, fullName: 'Nombre alterno', email: '' });
  });

  it('valores por defecto: sin datos, los mismos que usaba DashboardSecretariaPage', () => {
    const [p] = toPendingPeerProtocols([{}], now);

    expect(p).toEqual({
      id: 0,
      ceishCode: '',
      title: 'Sin título',
      receptionStatus: '',
      isRiskLevelDesignated: false,
      createdAt: '2026-11-05T12:00:00.000Z',
      studyType: { id: 0, codigo: '', nombre: 'General' },
      principalInvestigatorRecord: { id: 0, fullName: 'Investigador Principal', email: '' },
    });
  });

  it('un id que no es número queda en 0', () => {
    const [p] = toPendingPeerProtocols([{ id: 'abc' }], now);
    expect(p.id).toBe(0);
  });

  it('una lista vacía da una lista vacía', () => {
    expect(toPendingPeerProtocols([], now)).toEqual([]);
  });
});
