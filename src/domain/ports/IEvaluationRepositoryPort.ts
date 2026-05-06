import { Observable } from 'rxjs';
import { EvaluationEntity } from '../entities/evaluation.entity';

export abstract class IEvaluationRepositoryPort {
  abstract submit(evaluation: Partial<EvaluationEntity>): Observable<EvaluationEntity>;
  abstract getByProtocolId(protocolId: string): Observable<EvaluationEntity[]>;
  abstract getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]>;
}
