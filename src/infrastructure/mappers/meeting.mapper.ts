import {
  CreatedMeeting,
  Meeting,
  MeetingContractError,
  MeetingDetail,
  MeetingPlace,
  MeetingPlaceOption,
  MeetingProtocol,
  MeetingSessionType,
  MEETING_SESSION_TYPES,
  PaginatedMeetings,
  PaginationMeta,
  PendingProtocol,
} from '@domain/entities/meeting.entity';

type Raw = Record<string, unknown>;

/**
 * Mapper determinista 1:1 del contrato `/api/evaluations/meetings`.
 * No hay alias ni valores por defecto: un campo requerido ausente o con otro tipo
 * lanza `MeetingContractError` indicando la ruta del campo.
 */
export class MeetingMapper {
  static unwrapData(envelope: unknown, path = 'response'): unknown {
    const obj = asObject(envelope, path);
    if (!('data' in obj)) throw new MeetingContractError(`${path}.data`, 'presente');
    return obj['data'];
  }

  static toPaginated(envelope: unknown): PaginatedMeetings {
    const data = MeetingMapper.unwrapData(envelope);
    const meta = asObject((envelope as Raw)['meta'], 'response.meta');
    return {
      items: asArray(data, 'data').map((m, i) => MeetingMapper.toMeeting(m, `data[${i}]`)),
      meta: MeetingMapper.toMeta(meta),
    };
  }

  static toMeta(raw: Raw): PaginationMeta {
    return {
      total: num(raw, 'total', 'meta'),
      page: num(raw, 'page', 'meta'),
      limit: num(raw, 'limit', 'meta'),
    };
  }

  static toMeeting(value: unknown, path = 'data'): Meeting {
    const raw = asObject(value, path);
    return {
      id: str(raw, 'id', path),
      meetingNumber: str(raw, 'meetingNumber', path),
      academicYear: nullableNum(raw, 'academicYear', path),
      sessionType: sessionType(raw, path),
      meetingDate: nullableStr(raw, 'meetingDate', path),
      evalSubmissionDeadline: nullableStr(raw, 'evalSubmissionDeadline', path),
      status: str(raw, 'status', path),
      place: raw['place'] === null ? null : MeetingMapper.toPlace(raw['place'], `${path}.place`),
      agendaPdfUrl: str(raw, 'agendaPdfUrl', path),
      protocolCount: num(raw, 'protocolCount', path),
    };
  }

  static toDetail(value: unknown, path = 'data'): MeetingDetail {
    const raw = asObject(value, path);
    return {
      ...MeetingMapper.toMeeting(raw, path),
      protocols: asArray(raw['protocols'], `${path}.protocols`).map((p, i) =>
        MeetingMapper.toMeetingProtocol(p, `${path}.protocols[${i}]`),
      ),
    };
  }

  static toMeetingProtocol(value: unknown, path: string): MeetingProtocol {
    const raw = asObject(value, path);
    return {
      order: num(raw, 'order', path),
      protocolId: nullableId(raw, 'protocolId', path),
      versionId: nullableNum(raw, 'versionId', path),
      versionNumber: nullableNum(raw, 'versionNumber', path),
      ceishCode: nullableStr(raw, 'ceishCode', path),
      title: nullableStr(raw, 'title', path),
      studyType: nullableStr(raw, 'studyType', path),
      investigatorName: nullableStr(raw, 'investigatorName', path),
      normativeDeadline: nullableStr(raw, 'normativeDeadline', path),
    };
  }

  static toPlace(value: unknown, path: string): MeetingPlace {
    const raw = asObject(value, path);
    return {
      id: str(raw, 'id', path),
      name: str(raw, 'name', path),
      address: nullableStr(raw, 'address', path),
      isVirtual: bool(raw, 'isVirtual', path),
      meetingLink: nullableStr(raw, 'meetingLink', path),
    };
  }

  static toPlaceOption(value: unknown, path: string): MeetingPlaceOption {
    const raw = asObject(value, path);
    return { ...MeetingMapper.toPlace(raw, path), isActive: bool(raw, 'isActive', path) };
  }

  static toPlaces(envelope: unknown): MeetingPlaceOption[] {
    return asArray(MeetingMapper.unwrapData(envelope), 'data').map((p, i) =>
      MeetingMapper.toPlaceOption(p, `data[${i}]`),
    );
  }

  static toPendingProtocol(value: unknown, path: string): PendingProtocol {
    const raw = asObject(value, path);
    const protocolId = nullableId(raw, 'protocolId', path);
    if (protocolId === null)
      throw new MeetingContractError(`${path}.protocolId`, 'string o number');
    return {
      protocolId,
      versionId: num(raw, 'versionId', path),
      versionNumber: nullableNum(raw, 'versionNumber', path),
      ceishCode: nullableStr(raw, 'ceishCode', path),
      title: nullableStr(raw, 'title', path),
      studyType: nullableStr(raw, 'studyType', path),
      investigatorName: nullableStr(raw, 'investigatorName', path),
      receptionDate: nullableStr(raw, 'receptionDate', path),
      deadline: nullableStr(raw, 'deadline', path),
    };
  }

  static toPendingProtocols(envelope: unknown): PendingProtocol[] {
    return asArray(MeetingMapper.unwrapData(envelope), 'data').map((p, i) =>
      MeetingMapper.toPendingProtocol(p, `data[${i}]`),
    );
  }

  static toCreated(envelope: unknown): CreatedMeeting {
    const raw = asObject(MeetingMapper.unwrapData(envelope), 'data');
    return {
      id: str(raw, 'id', 'data'),
      meetingNumber: str(raw, 'meetingNumber', 'data'),
      sessionType: sessionType(raw, 'data'),
      meetingDate: nullableStr(raw, 'meetingDate', 'data'),
      evalSubmissionDeadline: nullableStr(raw, 'evalSubmissionDeadline', 'data'),
      agendaPdfUrl: str(raw, 'agendaPdfUrl', 'data'),
    };
  }

  static toSuggestedEvalDate(envelope: unknown): string {
    const raw = asObject(MeetingMapper.unwrapData(envelope), 'data');
    return str(raw, 'suggestedEvalSubmissionDeadline', 'data');
  }
}

function asObject(value: unknown, path: string): Raw {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new MeetingContractError(path, 'object');
  }
  return value as Raw;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new MeetingContractError(path, 'array');
  return value;
}

function str(raw: Raw, key: string, path: string): string {
  const v = raw[key];
  if (typeof v !== 'string') throw new MeetingContractError(`${path}.${key}`, 'string');
  return v;
}

function nullableStr(raw: Raw, key: string, path: string): string | null {
  const v = raw[key];
  if (v === null) return null;
  if (typeof v !== 'string') throw new MeetingContractError(`${path}.${key}`, 'string | null');
  return v;
}

function num(raw: Raw, key: string, path: string): number {
  const v = raw[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new MeetingContractError(`${path}.${key}`, 'number');
  }
  return v;
}

function nullableNum(raw: Raw, key: string, path: string): number | null {
  const v = raw[key];
  if (v === null) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new MeetingContractError(`${path}.${key}`, 'number | null');
  }
  return v;
}

/** El contrato no fija el tipo de `protocolId`: se acepta string o number tal cual llega. */
function nullableId(raw: Raw, key: string, path: string): string | number | null {
  const v = raw[key];
  if (v === null || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) {
    return v;
  }
  throw new MeetingContractError(`${path}.${key}`, 'string | number | null');
}

function bool(raw: Raw, key: string, path: string): boolean {
  const v = raw[key];
  if (typeof v !== 'boolean') throw new MeetingContractError(`${path}.${key}`, 'boolean');
  return v;
}

function sessionType(raw: Raw, path: string): MeetingSessionType {
  const v = raw['sessionType'];
  if (!MEETING_SESSION_TYPES.includes(v as MeetingSessionType)) {
    throw new MeetingContractError(`${path}.sessionType`, "'ORDINARIA' | 'EXTRAORDINARIA'");
  }
  return v as MeetingSessionType;
}
