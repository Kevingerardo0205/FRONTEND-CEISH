import { ActiveAssignment } from '@domain/entities/peer-evaluation.entity';
import {
  filterEligibleCandidates,
  mapDashboardCandidates,
  normalizeProfile,
} from './reassignment-candidates.util';
import { ACTIVE_ASSIGNMENTS_119_BODY, DASHBOARD_BODY } from '../../testing/reassignment.fixtures';

describe('reassignment-candidates.util', () => {
  const assignments119 = ACTIVE_ASSIGNMENTS_119_BODY.data.assignments as ActiveAssignment[];
  const activeIds119 = assignments119.map((a) => a.evaluatorId);
  const candidates = mapDashboardCandidates(DASHBOARD_BODY.data.evaluators);
  const byId = (id: number) => assignments119.find((a) => a.evaluatorId === id) as ActiveAssignment;

  describe('normalizeProfile', () => {
    it('reconoce los nombres reales con tilde y mayúsculas mixtas', () => {
      expect(normalizeProfile('Metodológico')).toBe('METODOLOGICO');
      expect(normalizeProfile('Jurídico')).toBe('JURIDICO');
      expect(normalizeProfile('Sociedad Civil')).toBe('SOCIEDAD_CIVIL');
      expect(normalizeProfile('Salud')).toBe('SALUD');
      expect(normalizeProfile('SOCIEDAD_CIVIL')).toBe('SOCIEDAD_CIVIL');
    });

    it('"Ético" y cualquier otro nombre → null (nunca SALUD)', () => {
      expect(normalizeProfile('Ético')).toBeNull();
      expect(normalizeProfile('Otro perfil')).toBeNull();
      expect(normalizeProfile(null)).toBeNull();
    });
  });

  describe('mapDashboardCandidates (forma real del dashboard)', () => {
    it('conserva solo los perfiles reconocidos de cada evaluador', () => {
      const rolando = candidates.find((c) => c.id === 36);
      expect(rolando?.fullName).toBe('Rolando Teruel Ginés');
      expect(rolando?.profiles).toEqual(['SALUD']);
      expect(rolando?.currentLoad).toBe(3);
      expect(candidates.find((c) => c.id === 38)?.profiles).toEqual(['METODOLOGICO', 'SALUD']);
    });

    it('los evaluadores con profiles [] quedan sin perfil reconocido', () => {
      for (const id of [104, 103, 32, 2, 8]) {
        expect(candidates.find((c) => c.id === id)?.profiles).toEqual([]);
      }
    });
  });

  describe('filterEligibleCandidates (protocolo 119)', () => {
    it('saliente METODOLOGICO (Ana, 39): 38 es elegible; 40 (ya asignado) y los sin perfil no', () => {
      const eligible = filterEligibleCandidates(candidates, byId(39), activeIds119);
      expect(eligible.map((c) => c.id)).toEqual([38]);
    });

    it('candidato multi-perfil cuenta si alguno coincide: SALUD admite a 36 y 38', () => {
      const outgoing = { evaluatorId: 999, evaluatorProfile: 'SALUD' as const };
      const eligible = filterEligibleCandidates(candidates, outgoing, activeIds119);
      expect(eligible.map((c) => c.id)).toEqual([36, 38]);
      // 39 y 40 tienen "Ético", que no se degrada a SALUD.
    });

    it('saliente sin perfil reconocido → ningún candidato', () => {
      const outgoing = { evaluatorId: 999, evaluatorProfile: null };
      expect(filterEligibleCandidates(candidates, outgoing, activeIds119)).toEqual([]);
    });

    it('saliente JURIDICO (41): no hay otro jurídico disponible', () => {
      expect(filterEligibleCandidates(candidates, byId(41), activeIds119)).toEqual([]);
    });
  });
});
