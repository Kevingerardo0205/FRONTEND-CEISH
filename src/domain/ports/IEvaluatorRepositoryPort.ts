import { Observable } from 'rxjs';
import { EvaluatorEntity } from '../entities/evaluator.entity';

export interface ProtocolForAssignment {
  id: string;
  code?: string;
  title: string;
  studyType?: string;
}

export abstract class IEvaluatorRepositoryPort {
  abstract getEvaluatorsWithLoad(): Observable<EvaluatorEntity[]>;
  abstract suggestEvaluators(protocolId: string, evaluatorIds: string[]): Observable<void>;
  abstract confirmAssignment(protocolId: string, evaluatorIds: string[], deadlineDays: number): Observable<void>;
  abstract getProtocolsForAssignment(): Observable<ProtocolForAssignment[]>;
}
