import { MeetingContractError } from '@domain/entities/meeting.entity';
import { MeetingMapper } from './meeting.mapper';

// Payloads copiados del contrato GET/POST /api/evaluations/meetings.
const SUMMARY_WITH_PLACE = {
  id: '6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f',
  meetingNumber: 'CEISH-ORD-003-2026',
  academicYear: 2026,
  sessionType: 'ORDINARIA',
  meetingDate: '2026-11-04T14:00:00.000Z',
  evalSubmissionDeadline: '2026-10-28T23:59:00.000Z',
  status: 'PROGRAMADA',
  place: {
    id: '9a8b7c6d-0000-4000-8000-000000000001',
    name: 'Sala de Sesiones del Rectorado',
    address: 'Panamericana Sur km 1 1/2',
    isVirtual: false,
    meetingLink: null,
  },
  agendaPdfUrl: '/api/evaluations/meetings/6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f/pdf',
  protocolCount: 2,
};

const SUMMARY_NULLS = {
  id: '11111111-2222-4333-8444-555555555555',
  meetingNumber: 'CEISH-EXT-001-2026',
  academicYear: null,
  sessionType: 'EXTRAORDINARIA',
  meetingDate: null,
  evalSubmissionDeadline: null,
  status: 'BORRADOR',
  place: null,
  agendaPdfUrl: '/api/evaluations/meetings/11111111-2222-4333-8444-555555555555/pdf',
  protocolCount: 0,
};

describe('MeetingMapper', () => {
  describe('toPaginated (GET /meetings)', () => {
    it('desenvuelve data/meta y mapea cada reunión 1:1', () => {
      const result = MeetingMapper.toPaginated({
        statusCode: 200,
        message: 'OK',
        data: [SUMMARY_WITH_PLACE, SUMMARY_NULLS],
        meta: { total: 12, page: 2, limit: 10 },
      });

      expect(result.meta).toEqual({ total: 12, page: 2, limit: 10 });
      expect(result.items.length).toBe(2);
      expect(result.items[0]).toEqual({
        id: '6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f',
        meetingNumber: 'CEISH-ORD-003-2026',
        academicYear: 2026,
        sessionType: 'ORDINARIA',
        meetingDate: '2026-11-04T14:00:00.000Z',
        evalSubmissionDeadline: '2026-10-28T23:59:00.000Z',
        status: 'PROGRAMADA',
        place: {
          id: '9a8b7c6d-0000-4000-8000-000000000001',
          name: 'Sala de Sesiones del Rectorado',
          address: 'Panamericana Sur km 1 1/2',
          isVirtual: false,
          meetingLink: null,
        },
        agendaPdfUrl: '/api/evaluations/meetings/6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f/pdf',
        protocolCount: 2,
      });
    });

    it('conserva meetingDate, academicYear y place nulos sin inventar valores', () => {
      const [m] = MeetingMapper.toPaginated({
        statusCode: 200,
        message: 'OK',
        data: [SUMMARY_NULLS],
        meta: { total: 1, page: 1, limit: 10 },
      }).items;

      expect(m.meetingDate).toBeNull();
      expect(m.evalSubmissionDeadline).toBeNull();
      expect(m.academicYear).toBeNull();
      expect(m.place).toBeNull();
      expect(m.status).toBe('BORRADOR');
      expect(m.sessionType).toBe('EXTRAORDINARIA');
    });

    it('falla con MeetingContractError si falta meta', () => {
      expect(() => MeetingMapper.toPaginated({ statusCode: 200, data: [] })).toThrowMatching(
        (e) => e instanceof MeetingContractError && e.path === 'response.meta',
      );
    });

    it('falla si falta un campo requerido (status) en vez de usar un default', () => {
      const { status, ...withoutStatus } = SUMMARY_WITH_PLACE;
      expect(status).toBe('PROGRAMADA');
      expect(() =>
        MeetingMapper.toPaginated({
          data: [withoutStatus],
          meta: { total: 1, page: 1, limit: 10 },
        }),
      ).toThrowMatching((e) => e instanceof MeetingContractError && e.path === 'data[0].status');
    });

    it('rechaza id numérico (el contrato exige uuid string)', () => {
      expect(() =>
        MeetingMapper.toPaginated({
          data: [{ ...SUMMARY_WITH_PLACE, id: 7 }],
          meta: { total: 1, page: 1, limit: 10 },
        }),
      ).toThrowMatching((e) => e instanceof MeetingContractError && e.path === 'data[0].id');
    });

    it('rechaza sessionType fuera del contrato', () => {
      expect(() =>
        MeetingMapper.toPaginated({
          data: [{ ...SUMMARY_WITH_PLACE, sessionType: 'ordinaria' }],
          meta: { total: 1, page: 1, limit: 10 },
        }),
      ).toThrowMatching(
        (e) => e instanceof MeetingContractError && e.path === 'data[0].sessionType',
      );
    });
  });

  describe('toDetail (GET /meetings/:id)', () => {
    it('mapea protocolos incluyendo protocolId/versionId nulos', () => {
      const detail = MeetingMapper.toDetail(
        MeetingMapper.unwrapData({
          statusCode: 200,
          message: 'OK',
          data: {
            ...SUMMARY_WITH_PLACE,
            protocols: [
              {
                order: 1,
                protocolId: 'b3f0e2c1-aaaa-4bbb-8ccc-000000000042',
                versionId: 42,
                versionNumber: 2,
                ceishCode: 'CEISH-2026-015',
                title: 'Prevalencia de anemia en escolares',
                studyType: 'OBSERVACIONAL',
                investigatorName: 'Ana Pérez',
                normativeDeadline: '2026-11-20T00:00:00.000Z',
              },
              {
                order: 2,
                protocolId: null,
                versionId: null,
                versionNumber: null,
                ceishCode: null,
                title: null,
                studyType: null,
                investigatorName: null,
                normativeDeadline: null,
              },
            ],
          },
        }),
      );

      expect(detail.id).toBe('6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f');
      expect(detail.protocols).toEqual([
        {
          order: 1,
          protocolId: 'b3f0e2c1-aaaa-4bbb-8ccc-000000000042',
          versionId: 42,
          versionNumber: 2,
          ceishCode: 'CEISH-2026-015',
          title: 'Prevalencia de anemia en escolares',
          studyType: 'OBSERVACIONAL',
          investigatorName: 'Ana Pérez',
          normativeDeadline: '2026-11-20T00:00:00.000Z',
        },
        {
          order: 2,
          protocolId: null,
          versionId: null,
          versionNumber: null,
          ceishCode: null,
          title: null,
          studyType: null,
          investigatorName: null,
          normativeDeadline: null,
        },
      ]);
    });

    it('falla si protocols no es un array', () => {
      expect(() => MeetingMapper.toDetail({ ...SUMMARY_WITH_PLACE })).toThrowMatching(
        (e) => e instanceof MeetingContractError && e.path === 'data.protocols',
      );
    });
  });

  describe('toPendingProtocols (GET /meetings/pending-protocols)', () => {
    it('mantiene versionId distinto de protocolId', () => {
      const [p] = MeetingMapper.toPendingProtocols({
        statusCode: 200,
        message: 'OK',
        data: [
          {
            protocolId: 'c0ffee00-0000-4000-8000-000000000015',
            versionId: 87,
            versionNumber: null,
            ceishCode: 'CEISH-2026-021',
            title: null,
            studyType: null,
            investigatorName: 'Luis Andrade',
            receptionDate: null,
            deadline: '2026-12-01T00:00:00.000Z',
          },
        ],
      });

      expect(p.protocolId).toBe('c0ffee00-0000-4000-8000-000000000015');
      expect(p.versionId).toBe(87);
      expect(p.versionNumber).toBeNull();
      expect(p.title).toBeNull();
      expect(p.receptionDate).toBeNull();
      expect(p.deadline).toBe('2026-12-01T00:00:00.000Z');
    });

    it('falla si versionId no es numérico (no se extraen dígitos de strings)', () => {
      expect(() =>
        MeetingMapper.toPendingProtocols({
          data: [
            {
              protocolId: 15,
              versionId: 'PRT-87',
              versionNumber: 1,
              ceishCode: null,
              title: null,
              studyType: null,
              investigatorName: null,
              receptionDate: null,
              deadline: null,
            },
          ],
        }),
      ).toThrowMatching((e) => e instanceof MeetingContractError && e.path === 'data[0].versionId');
    });
  });

  describe('toPlaces (GET /meetings/places)', () => {
    it('mapea lugares con isActive y address/meetingLink nulos', () => {
      const places = MeetingMapper.toPlaces({
        statusCode: 200,
        message: 'OK',
        data: [
          {
            id: '9a8b7c6d-0000-4000-8000-000000000002',
            name: 'Sala virtual Teams',
            address: null,
            isVirtual: true,
            meetingLink: 'https://teams.example/ceish',
            isActive: true,
          },
        ],
      });

      expect(places).toEqual([
        {
          id: '9a8b7c6d-0000-4000-8000-000000000002',
          name: 'Sala virtual Teams',
          address: null,
          isVirtual: true,
          meetingLink: 'https://teams.example/ceish',
          isActive: true,
        },
      ]);
    });

    it('devuelve lista vacía cuando data = []', () => {
      expect(MeetingMapper.toPlaces({ statusCode: 200, message: 'OK', data: [] })).toEqual([]);
    });
  });

  describe('toCreated (POST /meetings)', () => {
    it('mapea el número asignado por el backend', () => {
      const created = MeetingMapper.toCreated({
        statusCode: 201,
        message: 'Reunión creada',
        data: {
          id: '22222222-3333-4444-8555-666666666666',
          meetingNumber: 'CEISH-ORD-004-2026',
          sessionType: 'ORDINARIA',
          meetingDate: '2026-11-18T14:00:00.000Z',
          evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
          agendaPdfUrl: '/api/evaluations/meetings/22222222-3333-4444-8555-666666666666/pdf',
        },
      });

      expect(created).toEqual({
        id: '22222222-3333-4444-8555-666666666666',
        meetingNumber: 'CEISH-ORD-004-2026',
        sessionType: 'ORDINARIA',
        meetingDate: '2026-11-18T14:00:00.000Z',
        evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
        agendaPdfUrl: '/api/evaluations/meetings/22222222-3333-4444-8555-666666666666/pdf',
      });
    });
  });

  describe('toSuggestedEvalDate (POST /meetings/calculate-eval-date)', () => {
    it('extrae data.suggestedEvalSubmissionDeadline', () => {
      expect(
        MeetingMapper.toSuggestedEvalDate({
          statusCode: 200,
          message: 'OK',
          data: { suggestedEvalSubmissionDeadline: '2026-11-11T23:59:00.000Z' },
        }),
      ).toBe('2026-11-11T23:59:00.000Z');
    });

    it('falla si data no está presente en el envelope', () => {
      expect(() => MeetingMapper.toSuggestedEvalDate({ statusCode: 200 })).toThrowMatching(
        (e) => e instanceof MeetingContractError && e.path === 'response.data',
      );
    });
  });
});
