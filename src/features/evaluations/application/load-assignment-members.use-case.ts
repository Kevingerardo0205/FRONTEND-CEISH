import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import {
  AssignmentMember,
  dashboardMemberProfiles,
} from '@domain/entities/peer-evaluation.entity';
import { crossAssignmentMembers } from '@domain/entities/peer-assignment-composition';

/**
 * Personas que la Presidenta puede asignar (F03 D8, transitorio hasta TSK-002-N54): las de
 * `evaluators/active`, con los perfiles del dashboard, cruzadas por id.
 */
@Injectable({ providedIn: 'root' })
export class LoadAssignmentMembersUseCase {
  private readonly repo = inject(IEvaluationRepositoryPort);

  execute(): Observable<AssignmentMember[]> {
    return forkJoin({
      active: this.repo.getActiveEvaluators(),
      dashboard: this.repo.getEvaluatorsDashboard(),
    }).pipe(
      map(({ active, dashboard }) =>
        crossAssignmentMembers(
          active,
          dashboardMemberProfiles((dashboard as { evaluators?: unknown } | null)?.evaluators),
        ),
      ),
    );
  }
}
