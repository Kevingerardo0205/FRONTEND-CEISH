import { ResolutionMapper } from './resolution.mapper';

describe('ResolutionMapper', () => {
  it('should map DTO with consolidated observations to domain entity', () => {
    const mockDto = {
      id: 123,
      protocolId: 45,
      versionId: 6,
      resolutionTypeId: 2,
      issuedAt: '2026-08-24T12:00:00Z',
      vigencia_aprobacion_anios: 2,
      periodo_seguimiento_dias: 90,
      observaciones: 'Observaciones Mayores: Falta consentimiento informado.\nObservaciones Menores: Corregir ortografía.\nProcedimiento: Subir nueva versión del anexo 3.',
      archivoCartaPdf: 'path/to/pdf'
    };

    const domain = ResolutionMapper.toDomain(mockDto);

    expect(domain.id).toBe(123);
    expect(domain.protocolId).toBe(45);
    expect(domain.resolutionType).toBe('CONDITIONAL');
    expect(domain.majorObservations).toBe('Falta consentimiento informado.');
    expect(domain.minorObservations).toBe('Corregir ortografía.');
    expect(domain.correctionProcedure).toBe('Subir nueva versión del anexo 3.');
  });

  it('should map unformatted observations as majorObservations', () => {
    const mockDto = {
      id: 123,
      observaciones: 'Observaciones sin formato estructurado'
    };

    const domain = ResolutionMapper.toDomain(mockDto);

    expect(domain.majorObservations).toBe('Observaciones sin formato estructurado');
    expect(domain.minorObservations).toBe('');
    expect(domain.correctionProcedure).toBe('');
  });

  it('should consolidate domain observations to payload DTO', () => {
    const domainEntity = {
      protocolId: 45,
      resolutionTypeId: 2,
      validityYears: 2,
      followUpPeriodDays: 90,
      majorObservations: 'Falta consentimiento informado.',
      minorObservations: 'Corregir ortografía.',
      correctionProcedure: 'Subir nueva versión del anexo 3.',
      letterFilePath: 'path/to/pdf'
    };

    const payload = ResolutionMapper.toPayload(domainEntity);

    expect(payload.protocolId).toBe(45);
    expect(payload.resolutionTypeId).toBe(2);
    expect(payload.observations).toContain('Observaciones Mayores: Falta consentimiento informado.');
    expect(payload.observations).toContain('Observaciones Menores: Corregir ortografía.');
    expect(payload.observations).toContain('Procedimiento: Subir nueva versión del anexo 3.');
  });

  it('should handle undefined or null observations in toDomain and toPayload', () => {
    const domain = ResolutionMapper.toDomain(null as any);
    expect(domain).toEqual({} as any);

    const emptyDtoDomain = ResolutionMapper.toDomain({});
    expect(emptyDtoDomain.majorObservations).toBe('');
    expect(emptyDtoDomain.minorObservations).toBe('');
    expect(emptyDtoDomain.correctionProcedure).toBe('');

    const emptyPayload = ResolutionMapper.toPayload({
      protocolId: 45,
      resolutionTypeId: 1
    });
    expect(emptyPayload.observations).toBe('');
  });
});
