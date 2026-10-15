import { DictamenMapping, DictamenId, DictamenCode } from '@domain/catalogs/dictamen.catalog';

export class EvaluationMapper {
  static toBackendResult(resultStr: string): DictamenId {
    const res = resultStr?.toUpperCase() as DictamenCode;
    return DictamenMapping[res] || DictamenId.APROBADO;
  }
}
