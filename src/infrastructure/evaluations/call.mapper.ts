import { CallEntity, CallSessionType, ScheduledProtocol } from '../../domain/evaluations/call.entity';

export interface CallResponseDto {
  id: number;
  code: string;
  date: string;
  time: string;
  placeId?: number;
  place?: { name: string; location?: string };
  sessionType: string;
  statusId: number;
  agendaSummary?: string;
  createdByUserId?: number;
  protocols?: Array<{
    id: number;
    ceishCode: string;
    title: string;
    investigatorName: string;
    versionNumber?: number;
  }>;
}

export class CallMapper {
  static toDomain(dto: CallResponseDto): CallEntity {
    const placeName = dto.place
      ? dto.place.location
        ? `${dto.place.name} (${dto.place.location})`
        : dto.place.name
      : 'Lugar no especificado';

    const mappedProtocols: ScheduledProtocol[] = (dto.protocols || []).map((p) => ({
      id: p.id,
      ceishCode: p.ceishCode || 'S/C',
      title: p.title || 'Sin Título',
      investigatorName: p.investigatorName || 'No asignado',
      versionNumber: p.versionNumber || 1,
    }));

    const sessionTypeEnum =
      dto.sessionType?.toUpperCase() === 'EXTRAORDINARIA'
        ? CallSessionType.EXTRAORDINARIA
        : CallSessionType.ORDINARIA;

    return new CallEntity(
      dto.id,
      dto.code,
      new Date(dto.date),
      dto.time,
      dto.placeId,
      placeName,
      sessionTypeEnum,
      dto.statusId,
      dto.agendaSummary,
      dto.createdByUserId,
      mappedProtocols
    );
  }

  static toDomainList(dtos: CallResponseDto[]): CallEntity[] {
    return (dtos || []).map((dto) => this.toDomain(dto));
  }
}
