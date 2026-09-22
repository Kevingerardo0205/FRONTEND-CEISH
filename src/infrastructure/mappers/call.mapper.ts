import { CallEntity } from '@domain/entities/call.entity';

export class CallMapper {
  static toDomain(raw: any): CallEntity {
    if (!raw) return {} as CallEntity;

    const callNumber = raw.callNumber || raw.call_number || raw.numeroConvocatoria || raw.code || raw.numero || 'S/N';
    const sessionType = String(raw.sessionType || raw.session_type || raw.tipoSesion || raw.type || 'ORDINARIA').toUpperCase();
    const meetingDate = raw.meetingDate || raw.meeting_date || raw.fechaSesion || raw.fecha || raw.date || raw.createdAt || new Date().toISOString();
    const meetingPlace = raw.meetingPlace || raw.meeting_place || raw.lugarSesion || raw.lugar || raw.place || 'Salón Dorado de la Facultad de Medicina';
    const agenda = raw.agenda || raw.ordenDia || raw.orden_dia || '';

    // Mapeo robusto de lista/cantidad de protocolos agendados
    let versions: any[] = [];
    if (Array.isArray(raw.protocolVersionIds)) versions = raw.protocolVersionIds;
    else if (Array.isArray(raw.protocol_version_ids)) versions = raw.protocol_version_ids;
    else if (Array.isArray(raw.protocols)) versions = raw.protocols;
    else if (Array.isArray(raw.protocolVersions)) versions = raw.protocolVersions;
    else if (Array.isArray(raw.protocol_versions)) versions = raw.protocol_versions;

    return {
      id: raw.id || 0,
      callNumber: String(callNumber),
      sessionType: sessionType === 'EXTRAORDINARIA' ? 'EXTRAORDINARIA' : 'ORDINARIA',
      meetingDate: typeof meetingDate === 'object' ? meetingDate.toISOString() : String(meetingDate),
      meetingPlace: String(meetingPlace),
      agenda: String(agenda),
      status: raw.status || 'AGENDADA',
      protocolVersionIds: versions.map(v => (typeof v === 'object' && v !== null) ? (v.id || v.protocolVersionId || v) : v),
      protocols: Array.isArray(raw.protocols) ? raw.protocols : [],
      createdAt: raw.createdAt || raw.created_at,
      updatedAt: raw.updatedAt || raw.updated_at
    };
  }

  static toDomainList(rawList: any): CallEntity[] {
    if (!rawList) return [];
    let arr: any[] = [];
    if (Array.isArray(rawList)) {
      arr = rawList;
    } else if (rawList && Array.isArray(rawList.data)) {
      arr = rawList.data;
    } else if (rawList && Array.isArray(rawList.items)) {
      arr = rawList.items;
    }
    return arr.map(item => CallMapper.toDomain(item));
  }
}
