import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoadActiveAssignmentsUseCase } from './load-active-assignments.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ActiveAssignmentsResult } from '@domain/entities/peer-evaluation.entity';
import { EvaluationApiAdapter } from '@infrastructure/adapters/evaluation-api.adapter';
import { ACTIVE_ASSIGNMENTS_119_BODY } from '../testing/reassignment.fixtures';

describe('LoadActiveAssignmentsUseCase (RF-12.3)', () => {
  let useCase: LoadActiveAssignmentsUseCase;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IEvaluationRepositoryPort, useClass: EvaluationApiAdapter },
      ],
    });
    useCase = TestBed.inject(LoadActiveAssignmentsUseCase);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carga las asignaciones activas del protocolo 119 a través del adaptador real', () => {
    let result: ActiveAssignmentsResult | undefined;
    useCase.execute(119).subscribe((r) => (result = r));

    httpMock
      .expectOne('/api/evaluations/protocol/119/active-assignments')
      .flush(ACTIVE_ASSIGNMENTS_119_BODY);

    expect(result?.ceishCode).toBe('CEISH-ESPOCH-EI-007-2026');
    expect(result?.assignments.map((a) => a.evaluatorId)).toEqual([39, 40, 41, 42, 43]);
  });

  for (const invalid of [0, -1, 1.5, Number.NaN]) {
    it(`rechaza el id ${invalid} sin hacer ninguna petición HTTP`, () => {
      let error: Error | undefined;
      useCase.execute(invalid).subscribe({ error: (e) => (error = e) });

      httpMock.expectNone(() => true);
      expect(error?.message).toContain('entero positivo');
    });
  }
});
