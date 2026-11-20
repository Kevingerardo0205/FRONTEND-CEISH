import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { AssignmentMember } from '@domain/entities/peer-evaluation.entity';
import { LoadAssignmentMembersUseCase } from './load-assignment-members.use-case';

describe('LoadAssignmentMembersUseCase (F03 D8)', () => {
  it('cruza evaluators/active con los perfiles del dashboard y reconoce Bioético', () => {
    const repo = {
      getActiveEvaluators: jasmine
        .createSpy('getActiveEvaluators')
        .and.returnValue(
          of([
            { id: 2, fullName: 'Beatriz Prueba' },
            { id: 1, fullName: 'Andrés Prueba' },
            { id: 3, fullName: 'Carla Prueba' },
          ]),
        ),
      getEvaluatorsDashboard: jasmine.createSpy('getEvaluatorsDashboard').and.returnValue(
        of({
          evaluators: [
            { id: 1, fullName: 'Andrés Prueba', profiles: [{ id: 7, name: 'Bioético' }] },
            {
              id: 2,
              fullName: 'Beatriz Prueba',
              profiles: [
                { id: 10, name: 'Sociedad Civil' },
                { id: 99, name: 'Perfil desconocido' },
              ],
            },
            { id: 4, fullName: 'Inactiva Prueba', profiles: [{ id: 3, name: 'Salud' }] },
          ],
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: IEvaluationRepositoryPort, useValue: repo }],
    });

    let result: AssignmentMember[] | undefined;
    TestBed.inject(LoadAssignmentMembersUseCase)
      .execute()
      .subscribe((r) => (result = r));

    expect(repo.getEvaluatorsDashboard).toHaveBeenCalledWith();
    expect(result).toEqual([
      { id: 1, fullName: 'Andrés Prueba', profiles: ['BIOETICO'] },
      { id: 2, fullName: 'Beatriz Prueba', profiles: ['SOCIEDAD_CIVIL'] },
      { id: 3, fullName: 'Carla Prueba', profiles: [] },
    ]);
  });
});
