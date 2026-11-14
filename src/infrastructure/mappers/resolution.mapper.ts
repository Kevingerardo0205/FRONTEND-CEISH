import { ResolutionEntity } from '@domain/entities/resolution.entity';

export interface CreateResolutionPayloadDTO {
  protocolId: number;
  resolutionTypeId: number;
  validityYears?: number;
  followUpPeriodDays?: number;
  observations?: string;
  pdfLetterPath?: string;
}

interface ResolutionDto {
  data?: ResolutionDtoRaw;
  id?: string | number;
  protocolId?: string | number;
  versionId?: string | number;
  resolutionTypeId?: number;
  issuedAt?: Date | string;
  validityYears?: number;
  followUpPeriodDays?: number;
  observations?: string;
  observaciones?: string;
  letterFilePath?: string;
  archivoCartaPdf?: string;
  pdfLetterPath?: string;
  createdByUserId?: number;
  creadoPor?: number;
  fechaEmision?: Date | string;
  fecha_emision?: Date | string;
  vigenciaAprobacionAnios?: number;
  vigencia_aprobacion_anios?: number;
  periodoSeguimientoDias?: number;
  periodo_seguimiento_dias?: number;
}

interface ResolutionDtoRaw {
  id?: string | number;
  protocolId?: string | number;
  versionId?: string | number;
  resolutionTypeId?: number;
  issuedAt?: Date | string;
  validityYears?: number;
  followUpPeriodDays?: number;
  observations?: string;
  observaciones?: string;
  letterFilePath?: string;
  archivoCartaPdf?: string;
  pdfLetterPath?: string;
  createdByUserId?: number;
  creadoPor?: number;
  fechaEmision?: Date | string;
  fecha_emision?: Date | string;
  vigenciaAprobacionAnios?: number;
  vigencia_aprobacion_anios?: number;
  periodoSeguimientoDias?: number;
  periodo_seguimiento_dias?: number;
}

export class ResolutionMapper {
  /**
   * Transforma la respuesta DTO del backend en una entidad del dominio de la aplicación,
   * deserializando las observaciones consolidadas en campos individuales para la UI.
   */
  static toDomain(dto: ResolutionDto): ResolutionEntity {
    if (!dto) return {} as ResolutionEntity;
    const raw = (dto.data || dto) as ResolutionDtoRaw;

    const observations = raw.observations || raw.observaciones || '';
    const parsedObs = this.parseConsolidatedObservations(observations);

    let typeStr: 'APPROVAL' | 'CONDITIONAL' | 'REJECTION' | 'EXEMPTION' = 'APPROVAL';
    if (raw.resolutionTypeId === 2) typeStr = 'CONDITIONAL';
    else if (raw.resolutionTypeId === 3) typeStr = 'REJECTION';

    return {
      id: raw.id,
      protocolId: raw.protocolId as string | number,
      versionId: raw.versionId as string | number,
      resolutionTypeId: raw.resolutionTypeId as number,
      resolutionType: typeStr,
      issuedAt: raw.issuedAt || raw.fechaEmision || raw.fecha_emision,
      validityYears:
        raw.validityYears || raw.vigenciaAprobacionAnios || raw.vigencia_aprobacion_anios || 1,
      followUpPeriodDays:
        raw.followUpPeriodDays || raw.periodoSeguimientoDias || raw.periodo_seguimiento_dias,
      observations: observations,
      letterFilePath: raw.letterFilePath || raw.archivoCartaPdf || raw.pdfLetterPath,
      createdByUserId: raw.createdByUserId || raw.creadoPor,
      ...parsedObs,
    };
  }

  /**
   * Consolida las observaciones estructuradas del frontend en el campo único de observaciones
   * que espera el backend de acuerdo al tipo de dictamen.
   */
  static toPayload(entity: Partial<ResolutionEntity>): CreateResolutionPayloadDTO {
    let consolidatedObs = '';

    if (entity.resolutionTypeId === 1) {
      consolidatedObs = entity.observations || '';
    } else if (entity.resolutionTypeId === 2) {
      if (entity.majorObservations) {
        consolidatedObs += `Observaciones Mayores: ${entity.majorObservations}\n`;
      }
      if (entity.minorObservations) {
        consolidatedObs += `Observaciones Menores: ${entity.minorObservations}\n`;
      }
      if (entity.correctionProcedure) {
        consolidatedObs += `Procedimiento: ${entity.correctionProcedure}`;
      }
    } else if (entity.resolutionTypeId === 3) {
      consolidatedObs = entity.majorObservations || '';
    }

    return {
      protocolId: Number(entity.protocolId),
      resolutionTypeId: Number(entity.resolutionTypeId),
      validityYears: entity.resolutionTypeId === 3 ? undefined : Number(entity.validityYears || 1),
      followUpPeriodDays:
        entity.resolutionTypeId === 3 ? undefined : Number(entity.followUpPeriodDays || 180),
      observations: consolidatedObs.trim(),
      pdfLetterPath: entity.letterFilePath,
    };
  }

  /**
   * Procesa la cadena consolidada de la BD para extraer las secciones individuales.
   */
  static parseConsolidatedObservations(obs: string): {
    majorObservations: string;
    minorObservations: string;
    correctionProcedure: string;
  } {
    if (!obs) {
      return { majorObservations: '', minorObservations: '', correctionProcedure: '' };
    }

    let major = '';
    let minor = '';
    let procedure = '';

    const majorLabel = 'Observaciones Mayores:';
    const minorLabel = 'Observaciones Menores:';
    const procedureLabel = 'Procedimiento:';

    const majorIdx = obs.indexOf(majorLabel);
    const minorIdx = obs.indexOf(minorLabel);
    const procedureIdx = obs.indexOf(procedureLabel);

    // Si no contiene marcas del consolidado, se asume todo como observaciones mayores
    if (majorIdx === -1 && minorIdx === -1 && procedureIdx === -1) {
      return { majorObservations: obs.trim(), minorObservations: '', correctionProcedure: '' };
    }

    const segments = [
      { label: majorLabel, index: majorIdx, key: 'major' },
      { label: minorLabel, index: minorIdx, key: 'minor' },
      { label: procedureLabel, index: procedureIdx, key: 'procedure' },
    ]
      .filter((s) => s.index !== -1)
      .sort((a, b) => a.index - b.index);

    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      const start = current.index + current.label.length;
      const end = next ? next.index : obs.length;
      const val = obs.slice(start, end).trim();

      if (current.key === 'major') major = val;
      if (current.key === 'minor') minor = val;
      if (current.key === 'procedure') procedure = val;
    }

    return { majorObservations: major, minorObservations: minor, correctionProcedure: procedure };
  }
}
