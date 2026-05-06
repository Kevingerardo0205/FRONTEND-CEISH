export enum EvaluationVerdict {
  FAVORABLE = 'FAVORABLE',
  OBSERVED = 'OBSERVED',
  NEGATIVE = 'NEGATIVE'
}

export interface CriteriaResult {
  key: string;
  value: 'YES' | 'NO';
}

export interface EvaluationEntity {
  id: string;
  protocolId: string;
  evaluatorId: string;
  technicalCriteria: CriteriaResult[];
  technicalObservations: string;
  ethicalCriteria: CriteriaResult[];
  ethicalObservations: string;
  verdict: EvaluationVerdict;
  actaUrl?: string;
  evaluationDate: Date;
}
