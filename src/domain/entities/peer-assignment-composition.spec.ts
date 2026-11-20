import {
  AssignmentSelection,
  EXPEDITED_REVIEW_PROFILES,
  MIN_ASSIGNED_EVALUATORS,
  compositionBlockReason,
  crossAssignmentMembers,
  expeditedRowProfiles,
  membersWithProfile,
  toAssignedEvaluators,
} from './peer-assignment-composition';
import { AssignmentMember, PeerEvaluatorProfile } from './peer-evaluation.entity';

const row = (
  evaluatorId: number | null,
  profile: PeerEvaluatorProfile | null,
  rowLabel = 'Fila',
  evaluatorName: string | null = evaluatorId === null ? null : `Persona ${evaluatorId}`,
): AssignmentSelection => ({ rowLabel, evaluatorId, evaluatorName, profile });

describe('peer-assignment-composition (F03 D3 a D5, D8)', () => {
  it('filas de la expedita en el orden de RF-12.1 a, con Bioético', () => {
    expect([...EXPEDITED_REVIEW_PROFILES]).toEqual([
      'METODOLOGICO',
      'SALUD',
      'JURIDICO',
      'BIOETICO',
      'SOCIEDAD_CIVIL',
    ]);
    expect(MIN_ASSIGNED_EVALUATORS).toBe(2);
  });

  describe('expeditedRowProfiles (D3)', () => {
    const members: AssignmentMember[] = [
      { id: 1, fullName: 'Uno', profiles: ['SALUD', 'BIOETICO'] },
      { id: 2, fullName: 'Dos', profiles: ['SOCIEDAD_CIVIL'] },
      { id: 3, fullName: 'Tres', profiles: [] },
    ];

    it('la fila de un perfil sin miembros no aparece', () => {
      expect(expeditedRowProfiles(members)).toEqual(['SALUD', 'BIOETICO', 'SOCIEDAD_CIVIL']);
    });

    it('membersWithProfile devuelve solo quien tiene el perfil', () => {
      expect(membersWithProfile(members, 'BIOETICO').map((m) => m.id)).toEqual([1]);
      expect(membersWithProfile(members, 'JURIDICO')).toEqual([]);
    });
  });

  describe('crossAssignmentMembers (D8)', () => {
    it('solo las personas de evaluators/active, con sus perfiles del dashboard y ordenadas', () => {
      const members = crossAssignmentMembers(
        [
          { id: 20, fullName: 'Zoila Prueba' },
          { id: 10, fullName: 'Ana Prueba' },
          { id: 30, fullName: 'Sin Perfiles Prueba' },
        ],
        [
          { id: 10, profiles: ['METODOLOGICO'] },
          { id: 20, profiles: ['SOCIEDAD_CIVIL', 'SALUD'] },
          { id: 99, profiles: ['JURIDICO'] },
        ],
      );
      expect(members).toEqual([
        { id: 10, fullName: 'Ana Prueba', profiles: ['METODOLOGICO'] },
        { id: 30, fullName: 'Sin Perfiles Prueba', profiles: [] },
        { id: 20, fullName: 'Zoila Prueba', profiles: ['SOCIEDAD_CIVIL', 'SALUD'] },
      ]);
    });

    it('una persona repetida en evaluators/active aparece una sola vez', () => {
      const members = crossAssignmentMembers(
        [
          { id: 1, fullName: 'Una Prueba' },
          { id: 1, fullName: 'Una Prueba' },
        ],
        [],
      );
      expect(members.length).toBe(1);
    });
  });

  describe('compositionBlockReason (D5, en orden)', () => {
    const valid = [row(1, 'METODOLOGICO'), row(2, 'SOCIEDAD_CIVIL')];

    it('composición válida → null (2 personas, una de Sociedad Civil y otra no)', () => {
      expect(compositionBlockReason('EXPEDITA', valid)).toBeNull();
      expect(compositionBlockReason('PLENO', valid)).toBeNull();
    });

    it('(2) sin tipo de revisión', () => {
      expect(compositionBlockReason(null, valid)).toBe('Elija el tipo de revisión.');
    });

    it('(3) expedita: fila sin persona', () => {
      expect(compositionBlockReason('EXPEDITA', [row(null, 'SALUD', 'Salud'), ...valid])).toBe(
        'Elija una persona para Salud o quite la fila.',
      );
    });

    it('(3) pleno: persona sin perfil elegido', () => {
      expect(
        compositionBlockReason('PLENO', [...valid, row(3, null, 'Tres Prueba', 'Tres Prueba')]),
      ).toBe('Elija el perfil de Tres Prueba.');
    });

    it('(4) personas repetidas', () => {
      expect(
        compositionBlockReason('EXPEDITA', [...valid, row(1, 'SALUD', 'Salud', 'Uno Prueba')]),
      ).toBe('Uno Prueba está en más de una fila; cada persona entra una sola vez.');
    });

    it('(5) menos de 2 evaluadores', () => {
      expect(compositionBlockReason('EXPEDITA', [row(2, 'SOCIEDAD_CIVIL')])).toBe(
        'Asigne al menos 2 evaluadores.',
      );
      expect(compositionBlockReason('PLENO', [])).toBe('Asigne al menos 2 evaluadores.');
    });

    it('(6) sin Sociedad Civil', () => {
      expect(compositionBlockReason('PLENO', [row(1, 'SALUD'), row(2, 'JURIDICO')])).toBe(
        'Incluya al menos un evaluador de Sociedad Civil.',
      );
    });

    it('(7) todos de Sociedad Civil', () => {
      expect(
        compositionBlockReason('PLENO', [row(1, 'SOCIEDAD_CIVIL'), row(2, 'SOCIEDAD_CIVIL')]),
      ).toBe('Incluya al menos un evaluador que no sea de Sociedad Civil.');
    });
  });

  it('toAssignedEvaluators: cuerpo de N52 en el orden de las filas', () => {
    expect(toAssignedEvaluators([row(5, 'SALUD'), row(null, 'JURIDICO'), row(7, 'SOCIEDAD_CIVIL')])).toEqual([
      { evaluatorId: 5, profile: 'SALUD' },
      { evaluatorId: 7, profile: 'SOCIEDAD_CIVIL' },
    ]);
  });
});
