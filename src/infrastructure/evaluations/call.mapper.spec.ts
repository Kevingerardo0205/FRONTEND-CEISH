import { CallMapper, CallResponseDto } from './call.mapper';
import { CallSessionType } from '../../domain/evaluations/call.entity';

describe('CallMapper', () => {
  it('debe mapear correctamente un DTO de respuesta a la Entidad de Dominio CallEntity', () => {
    const dto: CallResponseDto = {
      id: 1,
      code: '25-2026',
      date: '2026-07-20T00:00:00.000Z',
      time: '15:00',
      placeId: 1,
      place: {
        name: 'Salón Dorado',
        location: 'Facultad de Salud Pública',
      },
      sessionType: 'ORDINARIA',
      statusId: 22,
      agendaSummary: 'Orden del día oficial',
      protocols: [
        {
          id: 162,
          ceishCode: 'CEISH-ESPOCH-EI-016-2026',
          title: 'Relación entre calorimetría...',
          investigatorName: 'Liliana Paguay',
          versionNumber: 1,
        },
      ],
    };

    const entity = CallMapper.toDomain(dto);

    expect(entity.id).toBe(1);
    expect(entity.code).toBe('25-2026');
    expect(entity.placeName).toBe('Salón Dorado (Facultad de Salud Pública)');
    expect(entity.sessionType).toBe(CallSessionType.ORDINARIA);
    expect(entity.protocols.length).toBe(1);
    expect(entity.protocols[0].ceishCode).toBe('CEISH-ESPOCH-EI-016-2026');
  });

  it('debe asignar valores por defecto cuando faltan campos opcionales', () => {
    const dto: CallResponseDto = {
      id: 2,
      code: '26-2026',
      date: '2026-08-10T00:00:00.000Z',
      time: '09:00',
      sessionType: 'EXTRAORDINARIA',
      statusId: 23,
    };

    const entity = CallMapper.toDomain(dto);

    expect(entity.placeName).toBe('Lugar no especificado');
    expect(entity.sessionType).toBe(CallSessionType.EXTRAORDINARIA);
    expect(entity.protocols.length).toBe(0);
  });
});
